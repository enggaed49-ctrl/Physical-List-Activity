import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { db, DatabaseSetupError, isSupabaseConfigured } from './db.ts';
import type { UserRecord, ActivityRecord } from './db.ts';

dotenv.config();

export const app = express();
app.use(express.json({ limit: '3mb' }));

// -------------------------------------------------------------
// Security & Session Configuration
// -------------------------------------------------------------
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
if (process.env.VERCEL && !process.env.SESSION_SECRET) {
  console.warn(
    'Warning: SESSION_SECRET is not set in Vercel environment variables. Set SESSION_SECRET so auth tokens stay valid across serverless invocations.'
  );
}

const TOKEN_TTL_SECONDS = 60 * 60 * 24; // 24 hours

interface AuthenticatedRequest extends Request {
  user?: UserRecord;
  tokenJti?: string;
  tokenExp?: number;
}

const revokedTokens = new Map<string, number>();

function pruneRevokedTokens() {
  const nowSec = Math.floor(Date.now() / 1000);
  for (const [jti, exp] of revokedTokens.entries()) {
    if (exp <= nowSec) {
      revokedTokens.delete(jti);
    }
  }
}

// -------------------------------------------------------------
// Cryptography Helpers (scrypt Password Hashing + HMAC Tokens)
// -------------------------------------------------------------
function hashPassword(password: string, existingSalt?: string): Promise<{ salt: string; hash: string }> {
  return new Promise((resolve, reject) => {
    const salt = existingSalt || crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
      if (err) return reject(err);
      resolve({ salt, hash: derivedKey.toString('hex') });
    });
  });
}

async function verifyPassword(password: string, salt: string, storedHash: string): Promise<boolean> {
  const { hash } = await hashPassword(password, salt);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function toBase64Url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function fromBase64Url(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4;
  const padded = pad ? normalized + '='.repeat(4 - pad) : normalized;
  return Buffer.from(padded, 'base64').toString('utf-8');
}

function signAuthToken(user: UserRecord): { token: string; jti: string } {
  const nowSec = Math.floor(Date.now() / 1000);
  const jti = crypto.randomUUID();
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = toBase64Url(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      jti,
      iat: nowSec,
      exp: nowSec + TOKEN_TTL_SECONDS,
    })
  );
  const signingInput = `${header}.${payload}`;
  const signature = toBase64Url(
    crypto.createHmac('sha256', SESSION_SECRET).update(signingInput).digest()
  );
  return { token: `${signingInput}.${signature}`, jti };
}

function verifyAuthToken(token: string): { sub: string; email: string; jti: string; exp: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts;
    const signingInput = `${headerB64}.${payloadB64}`;
    const expectedSig = toBase64Url(
      crypto.createHmac('sha256', SESSION_SECRET).update(signingInput).digest()
    );

    const sigBuf = Buffer.from(sigB64);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const payload = JSON.parse(fromBase64Url(payloadB64));
    const nowSec = Math.floor(Date.now() / 1000);
    if (!payload || typeof payload.sub !== 'string' || typeof payload.exp !== 'number' || payload.exp <= nowSec) {
      return null;
    }

    pruneRevokedTokens();
    if (typeof payload.jti === 'string' && revokedTokens.has(payload.jti)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function sanitizeUser(user: UserRecord) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    subtitle: user.subtitle,
    presetAvatar: user.presetAvatar,
    avatarUrl: user.avatarUrl,
    dailyGoalMinutes: user.dailyGoalMinutes,
    defaultActivity: user.defaultActivity,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}

// -------------------------------------------------------------
// Input Validation Helpers
// -------------------------------------------------------------
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const VALID_STATUSES = new Set(['Completed', 'Ongoing', 'Not Started']);
const VALID_CATEGORIES = new Set(['Cardio', 'Strength', 'Flexibility', 'Sports', 'Recovery', 'Other']);

function validatePasswordStrength(password: string): string | null {
  if (!password) {
    return 'Password is required.';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (password.length > 128) {
    return 'Password must be 128 characters or fewer.';
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must include at least one letter and one number.';
  }
  return null;
}

function isSafeAvatarDataUrl(url: string): boolean {
  return /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(url) && url.length <= 2_500_000;
}

function inferCategory(name: string): string {
  const n = (name || '').toLowerCase();
  if (n.includes('run') || n.includes('cycl') || n.includes('swim') || n.includes('walk') || n.includes('cardio') || n.includes('jog')) return 'Cardio';
  if (n.includes('gym') || n.includes('lift') || n.includes('strength') || n.includes('press') || n.includes('workout') || n.includes('crossfit')) return 'Strength';
  if (n.includes('yoga') || n.includes('stretch') || n.includes('pilates') || n.includes('flex')) return 'Flexibility';
  if (n.includes('sport') || n.includes('basket') || n.includes('soccer') || n.includes('tennis')) return 'Sports';
  if (n.includes('recover') || n.includes('sauna') || n.includes('rest')) return 'Recovery';
  return 'Cardio';
}

function respondRouteError(res: Response, err: unknown, fallbackMessage: string) {
  if (err instanceof DatabaseSetupError) {
    return res.status(503).json({ error: err.message });
  }
  console.error(fallbackMessage, err);
  return res.status(500).json({ error: fallbackMessage });
}

// -------------------------------------------------------------
// Auth Middleware
// -------------------------------------------------------------
async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }
    const token = authHeader.slice(7).trim();
    const decoded = verifyAuthToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Your session has expired or is invalid. Please log in again.' });
    }

    const user = await db.findUserById(decoded.sub);
    if (!user) {
      return res.status(401).json({ error: 'Account not found. Please log in again.' });
    }

    req.user = user;
    req.tokenJti = decoded.jti;
    req.tokenExp = decoded.exp;
    return next();
  } catch (err) {
    return respondRouteError(res, err, 'Unable to verify session right now.');
  }
}

// -------------------------------------------------------------
// Health Route
// -------------------------------------------------------------
app.get('/api/status', async (_req, res) => {
  try {
    const health = await db.checkHealth();
    return res.json({
      ok: true,
      status: health.storage === 'supabase' && health.tablesReady ? 'ready' : 'needs_setup',
      version: '2.0.0',
      storage: health.storage,
      tablesReady: health.tablesReady,
    });
  } catch (err) {
    return res.json({
      ok: true,
      status: 'needs_setup',
      version: '2.0.0',
      storage: isSupabaseConfigured() ? 'supabase' : 'unconfigured',
      tablesReady: false,
      ...(err instanceof DatabaseSetupError ? { message: err.message } : {}),
    });
  }
});

// -------------------------------------------------------------
// Authentication Routes
// -------------------------------------------------------------
app.post('/api/auth/signup', async (req: Request, res: Response) => {
  try {
    const rawName = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const rawEmail = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const rawPassword = typeof req.body?.password === 'string' ? req.body.password : '';

    const fieldErrors: Record<string, string> = {};

    if (!rawName) {
      fieldErrors.name = 'Full name is required.';
    } else if (rawName.length > 80) {
      fieldErrors.name = 'Name must be 80 characters or fewer.';
    }

    if (!rawEmail) {
      fieldErrors.email = 'Email address is required.';
    } else if (!EMAIL_REGEX.test(rawEmail) || rawEmail.length > 254) {
      fieldErrors.email = 'Please enter a valid email address.';
    }

    const pwError = validatePasswordStrength(rawPassword);
    if (pwError) {
      fieldErrors.password = pwError;
    }

    if (Object.keys(fieldErrors).length > 0) {
      const firstError = Object.values(fieldErrors)[0];
      return res.status(400).json({ error: firstError, fieldErrors });
    }

    const existing = await db.findUserByEmail(rawEmail);
    if (existing) {
      return res.status(409).json({
        error: 'An account with this email already exists.',
        fieldErrors: { email: 'An account with this email already exists.' },
      });
    }

    const now = Date.now();
    const { salt, hash } = await hashPassword(rawPassword);
    const newUser: UserRecord = {
      id: `usr_${crypto.randomUUID()}`,
      email: rawEmail,
      name: rawName,
      subtitle: 'Building a consistent routine',
      dailyGoalMinutes: 60,
      defaultActivity: 'Running',
      passwordHash: hash,
      passwordSalt: salt,
      createdAt: now,
      lastLoginAt: now,
    };

    const savedUser = await db.createUser(newUser);
    const { token, jti } = signAuthToken(savedUser);
    const userAgent =
      typeof req.headers['user-agent'] === 'string'
        ? req.headers['user-agent'].slice(0, 200)
        : undefined;

    await Promise.all([
      db.recordLogin({
        id: `lgn_${crypto.randomUUID()}`,
        userId: savedUser.id,
        email: savedUser.email,
        eventType: 'signup',
        tokenJti: jti,
        userAgent,
        loggedInAt: now,
      }),
      db.syncUserProfile(savedUser, { password: rawPassword, isLogin: true }),
    ]);

    return res.status(201).json({ token, user: sanitizeUser(savedUser) });
  } catch (err) {
    return respondRouteError(res, err, 'Unable to create account right now. Please try again.');
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const rawEmail = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const rawPassword = typeof req.body?.password === 'string' ? req.body.password : '';

    const fieldErrors: Record<string, string> = {};
    if (!rawEmail) {
      fieldErrors.email = 'Email address is required.';
    } else if (!EMAIL_REGEX.test(rawEmail)) {
      fieldErrors.email = 'Please enter a valid email address.';
    }
    if (!rawPassword) {
      fieldErrors.password = 'Password is required.';
    }

    if (Object.keys(fieldErrors).length > 0) {
      return res.status(400).json({ error: Object.values(fieldErrors)[0], fieldErrors });
    }

    const user = await db.findUserByEmail(rawEmail);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await verifyPassword(rawPassword, user.passwordSalt, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const loginTime = Date.now();
    const { token, jti } = signAuthToken(user);
    const userAgent =
      typeof req.headers['user-agent'] === 'string'
        ? req.headers['user-agent'].slice(0, 200)
        : undefined;

    const updatedUserWithLogin = { ...user, lastLoginAt: loginTime };
    await Promise.all([
      db.updateLastLogin(user.id, loginTime),
      db.recordLogin({
        id: `lgn_${crypto.randomUUID()}`,
        userId: user.id,
        email: user.email,
        eventType: 'login',
        tokenJti: jti,
        userAgent,
        loggedInAt: loginTime,
      }),
      db.syncUserProfile(updatedUserWithLogin, { password: rawPassword, isLogin: true }),
    ]);

    return res.json({ token, user: sanitizeUser(updatedUserWithLogin) });
  } catch (err) {
    return respondRouteError(res, err, 'Unable to log in right now. Please try again.');
  }
});

app.post('/api/auth/logout', async (req: AuthenticatedRequest, res: Response) => {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const decoded = verifyAuthToken(token);
    if (decoded?.jti && decoded?.exp) {
      revokedTokens.set(decoded.jti, decoded.exp);
      try {
        await db.markLogout(decoded.jti, Date.now());
      } catch (err) {
        console.warn('Could not persist logout timestamp:', (err as Error).message);
      }
    }
  }
  return res.json({ success: true });
});

app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ user: sanitizeUser(req.user!) });
});

app.get('/api/auth/logins', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const logins = await db.listLoginsByUser(req.user!.id, 8);
    return res.json({
      logins: logins.map((item) => ({
        id: item.id,
        eventType: item.eventType,
        userAgent: item.userAgent,
        loggedInAt: item.loggedInAt,
        loggedOutAt: item.loggedOutAt,
      })),
    });
  } catch (err) {
    return respondRouteError(res, err, 'Unable to load sign-in history.');
  }
});

app.put('/api/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const existing = await db.findUserById(userId);
    if (!existing) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const { name, subtitle, presetAvatar, avatarUrl, dailyGoalMinutes, defaultActivity } = req.body || {};

    let nextName = existing.name;
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Name cannot be empty.' });
      }
      nextName = name.trim().slice(0, 80);
    }

    let nextSubtitle = existing.subtitle;
    if (subtitle !== undefined && typeof subtitle === 'string') {
      nextSubtitle = subtitle.trim().slice(0, 140) || 'Stay active, stay healthy!';
    }

    let nextAvatarUrl = existing.avatarUrl;
    if (avatarUrl !== undefined) {
      if (avatarUrl === null || avatarUrl === '') {
        nextAvatarUrl = undefined;
      } else if (typeof avatarUrl === 'string' && isSafeAvatarDataUrl(avatarUrl)) {
        nextAvatarUrl = avatarUrl;
      } else {
        return res.status(400).json({ error: 'Invalid avatar image format or file too large.' });
      }
    }

    let nextPresetAvatar = existing.presetAvatar;
    if (presetAvatar !== undefined) {
      nextPresetAvatar =
        typeof presetAvatar === 'string' && presetAvatar.trim()
          ? presetAvatar.trim().slice(0, 40)
          : undefined;
    }

    let nextDailyGoal = existing.dailyGoalMinutes;
    if (dailyGoalMinutes !== undefined) {
      const parsed = Number(dailyGoalMinutes);
      if (isNaN(parsed) || parsed < 10 || parsed > 300) {
        return res.status(400).json({ error: 'Daily goal must be between 10 and 300 minutes.' });
      }
      nextDailyGoal = Math.round(parsed);
    }

    let nextDefaultActivity = existing.defaultActivity;
    if (defaultActivity !== undefined && typeof defaultActivity === 'string' && defaultActivity.trim()) {
      nextDefaultActivity = defaultActivity.trim().slice(0, 60);
    }

    const updatedUser = await db.updateUserProfile(userId, {
      name: nextName,
      subtitle: nextSubtitle,
      avatarUrl: nextAvatarUrl,
      presetAvatar: nextPresetAvatar,
      dailyGoalMinutes: nextDailyGoal,
      defaultActivity: nextDefaultActivity,
    });

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await db.syncUserProfile(updatedUser);

    return res.json({ user: sanitizeUser(updatedUser) });
  } catch (err) {
    return respondRouteError(res, err, 'Unable to update profile.');
  }
});

// -------------------------------------------------------------
// Protected Per-User Activity Routes
// -------------------------------------------------------------
app.get('/api/activities', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userActivities = await db.listActivitiesByUser(userId);
    return res.json({ activities: userActivities });
  } catch (err) {
    return respondRouteError(res, err, 'Unable to load activities.');
  }
});

app.post('/api/activities', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, date, durationMinutes, status, category, description } = req.body || {};

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Activity name is required.' });
    }
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'A valid date (YYYY-MM-DD) is required.' });
    }
    const parsedDuration = Number(durationMinutes);
    if (!parsedDuration || isNaN(parsedDuration) || parsedDuration <= 0 || parsedDuration > 1440) {
      return res.status(400).json({ error: 'Duration must be between 1 and 1440 minutes.' });
    }

    const safeStatus: ActivityRecord['status'] = VALID_STATUSES.has(status) ? status : 'Not Started';
    const safeCategory = VALID_CATEGORIES.has(category) ? category : inferCategory(name);

    const newActivity: ActivityRecord = {
      id: crypto.randomUUID(),
      userId,
      name: name.trim().slice(0, 100),
      date,
      durationMinutes: Math.round(parsedDuration),
      status: safeStatus,
      category: safeCategory,
      description: typeof description === 'string' ? description.trim().slice(0, 500) : '',
      createdAt: Date.now(),
    };

    const created = await db.createActivity(newActivity);
    return res.status(201).json({ activity: created });
  } catch (err) {
    return respondRouteError(res, err, 'Unable to save activity.');
  }
});

app.put('/api/activities/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const existing = await db.findActivityByIdAndUser(id, userId);

    if (!existing) {
      return res.status(404).json({ error: 'Activity not found.' });
    }

    const { name, date, durationMinutes, status, category, description } = req.body || {};

    if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
      return res.status(400).json({ error: 'Activity name cannot be empty.' });
    }
    if (date !== undefined && (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date))) {
      return res.status(400).json({ error: 'Invalid date format.' });
    }
    if (durationMinutes !== undefined) {
      const parsedDuration = Number(durationMinutes);
      if (isNaN(parsedDuration) || parsedDuration <= 0 || parsedDuration > 1440) {
        return res.status(400).json({ error: 'Duration must be between 1 and 1440 minutes.' });
      }
    }

    const updated = await db.updateActivity(id, userId, {
      ...(name !== undefined && { name: name.trim().slice(0, 100) }),
      ...(date !== undefined && { date }),
      ...(durationMinutes !== undefined && { durationMinutes: Math.round(Number(durationMinutes)) }),
      ...(status !== undefined && VALID_STATUSES.has(status) && { status }),
      ...(category !== undefined && VALID_CATEGORIES.has(category) && { category }),
      ...(description !== undefined && typeof description === 'string' && { description: description.trim().slice(0, 500) }),
    });

    if (!updated) {
      return res.status(404).json({ error: 'Activity not found.' });
    }

    return res.json({ activity: updated });
  } catch (err) {
    return respondRouteError(res, err, 'Unable to update activity.');
  }
});

app.delete('/api/activities/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const deleted = await db.deleteActivity(id, userId);

    if (!deleted) {
      return res.status(404).json({ error: 'Activity not found.' });
    }

    return res.json({ success: true });
  } catch (err) {
    return respondRouteError(res, err, 'Unable to delete activity.');
  }
});

app.post('/api/activities/seed', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const today = new Date();
    const formatOffsetDate = (daysAgo: number) => {
      const d = new Date(today.getTime() - daysAgo * 86400000);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    const starterTemplates: Omit<ActivityRecord, 'id' | 'userId' | 'createdAt'>[] = [
      {
        name: 'Morning Run',
        date: formatOffsetDate(0),
        durationMinutes: 30,
        status: 'Completed',
        category: 'Cardio',
        description: 'Brisk 5km morning run around the park.',
      },
      {
        name: 'Strength Training',
        date: formatOffsetDate(1),
        durationMinutes: 50,
        status: 'Completed',
        category: 'Strength',
        description: 'Upper body strength session with compound lifts.',
      },
      {
        name: 'Evening Cycling',
        date: formatOffsetDate(1),
        durationMinutes: 45,
        status: 'Ongoing',
        category: 'Cardio',
        description: 'Steady endurance ride along the riverside trail.',
      },
      {
        name: 'Restorative Yoga',
        date: formatOffsetDate(2),
        durationMinutes: 40,
        status: 'Not Started',
        category: 'Flexibility',
        description: 'Evening mobility and recovery flow.',
      },
    ];

    const created = starterTemplates.map((item, idx) => ({
      ...item,
      id: crypto.randomUUID(),
      userId,
      createdAt: Date.now() - idx * 1000,
    }));

    const inserted = await db.replaceUserActivities(userId, created);
    return res.json({ activities: inserted });
  } catch (err) {
    return respondRouteError(res, err, 'Unable to load sample activities.');
  }
});
