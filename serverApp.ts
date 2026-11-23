import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import os from 'os';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';

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

interface UserRecord {
  id: string;
  email: string;
  name: string;
  subtitle: string;
  presetAvatar?: string;
  avatarUrl?: string;
  dailyGoalMinutes: number;
  defaultActivity: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: number;
}

interface ActivityRecord {
  id: string;
  userId: string;
  name: string;
  date: string;
  durationMinutes: number;
  status: 'Completed' | 'Ongoing' | 'Not Started';
  category: string;
  description: string;
  createdAt: number;
}

interface AppStoreData {
  users: UserRecord[];
  activities: ActivityRecord[];
}

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
// Atomic Persistent File Store (Per-User Isolated Data)
// Uses /tmp on read-only serverless runtimes (e.g. Vercel)
// -------------------------------------------------------------
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : process.env.VERCEL
    ? path.join(os.tmpdir(), 'physical-list-data')
    : path.resolve(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'app-store.json');

let storeCache: AppStoreData | null = null;
let writeQueue: Promise<void> = Promise.resolve();

function loadStore(): AppStoreData {
  if (storeCache) return storeCache;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
    }
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.activities)) {
        storeCache = {
          users: parsed.users,
          activities: parsed.activities,
        };
        return storeCache;
      }
    }
  } catch (err) {
    console.warn('Could not read existing store, initializing clean store:', (err as Error).message);
  }

  storeCache = { users: [], activities: [] };
  return storeCache;
}

function persistStore(data: AppStoreData): Promise<void> {
  storeCache = data;
  writeQueue = writeQueue
    .then(async () => {
      if (!fs.existsSync(DATA_DIR)) {
        await fs.promises.mkdir(DATA_DIR, { recursive: true, mode: 0o700 });
      }
      const tempPath = `${STORE_PATH}.${crypto.randomBytes(6).toString('hex')}.tmp`;
      await fs.promises.writeFile(tempPath, JSON.stringify(data, null, 2), {
        encoding: 'utf-8',
        mode: 0o600,
      });
      await fs.promises.rename(tempPath, STORE_PATH);
    })
    .catch((err) => {
      console.error('Failed to persist store:', err);
    });
  return writeQueue;
}

loadStore();

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

function signAuthToken(user: UserRecord): string {
  const nowSec = Math.floor(Date.now() / 1000);
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = toBase64Url(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      jti: crypto.randomUUID(),
      iat: nowSec,
      exp: nowSec + TOKEN_TTL_SECONDS,
    })
  );
  const signingInput = `${header}.${payload}`;
  const signature = toBase64Url(
    crypto.createHmac('sha256', SESSION_SECRET).update(signingInput).digest()
  );
  return `${signingInput}.${signature}`;
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

// -------------------------------------------------------------
// Auth Middleware
// -------------------------------------------------------------
function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  const token = authHeader.slice(7).trim();
  const decoded = verifyAuthToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Your session has expired or is invalid. Please log in again.' });
  }

  const store = loadStore();
  const user = store.users.find((u) => u.id === decoded.sub);
  if (!user) {
    return res.status(401).json({ error: 'Account not found. Please log in again.' });
  }

  req.user = user;
  req.tokenJti = decoded.jti;
  req.tokenExp = decoded.exp;
  return next();
}

// -------------------------------------------------------------
// Health Route
// -------------------------------------------------------------
app.get('/api/status', (_req, res) => {
  res.json({ ok: true, status: 'ready', version: '2.0.0' });
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

    const store = loadStore();
    const existing = store.users.find((u) => u.email === rawEmail);
    if (existing) {
      return res.status(409).json({
        error: 'An account with this email already exists.',
        fieldErrors: { email: 'An account with this email already exists.' },
      });
    }

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
      createdAt: Date.now(),
    };

    const nextStore: AppStoreData = {
      users: [...store.users, newUser],
      activities: store.activities,
    };
    await persistStore(nextStore);

    const token = signAuthToken(newUser);
    return res.status(201).json({ token, user: sanitizeUser(newUser) });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Unable to create account right now. Please try again.' });
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

    const store = loadStore();
    const user = store.users.find((u) => u.email === rawEmail);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await verifyPassword(rawPassword, user.passwordSalt, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signAuthToken(user);
    return res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Unable to log in right now. Please try again.' });
  }
});

app.post('/api/auth/logout', (req: AuthenticatedRequest, res: Response) => {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const decoded = verifyAuthToken(token);
    if (decoded?.jti && decoded?.exp) {
      revokedTokens.set(decoded.jti, decoded.exp);
    }
  }
  return res.json({ success: true });
});

app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ user: sanitizeUser(req.user!) });
});

app.put('/api/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const store = loadStore();
    const existing = store.users.find((u) => u.id === userId);
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

    const updatedUser: UserRecord = {
      ...existing,
      name: nextName,
      subtitle: nextSubtitle,
      avatarUrl: nextAvatarUrl,
      presetAvatar: nextPresetAvatar,
      dailyGoalMinutes: nextDailyGoal,
      defaultActivity: nextDefaultActivity,
    };

    await persistStore({
      users: store.users.map((u) => (u.id === userId ? updatedUser : u)),
      activities: store.activities,
    });

    return res.json({ user: sanitizeUser(updatedUser) });
  } catch (err) {
    console.error('Profile update error:', err);
    return res.status(500).json({ error: 'Unable to update profile.' });
  }
});

// -------------------------------------------------------------
// Protected Per-User Activity Routes
// -------------------------------------------------------------
app.get('/api/activities', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const store = loadStore();
  const userActivities = store.activities
    .filter((a) => a.userId === userId)
    .sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      return dateDiff !== 0 ? dateDiff : b.createdAt - a.createdAt;
    });

  return res.json({ activities: userActivities });
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
      id: `act_${crypto.randomUUID()}`,
      userId,
      name: name.trim().slice(0, 100),
      date,
      durationMinutes: Math.round(parsedDuration),
      status: safeStatus,
      category: safeCategory,
      description: typeof description === 'string' ? description.trim().slice(0, 500) : '',
      createdAt: Date.now(),
    };

    const store = loadStore();
    await persistStore({
      users: store.users,
      activities: [newActivity, ...store.activities],
    });

    return res.status(201).json({ activity: newActivity });
  } catch (err) {
    console.error('Create activity error:', err);
    return res.status(500).json({ error: 'Unable to save activity.' });
  }
});

app.put('/api/activities/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const store = loadStore();
    const existing = store.activities.find((a) => a.id === id && a.userId === userId);

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

    const updated: ActivityRecord = {
      ...existing,
      ...(name !== undefined && { name: name.trim().slice(0, 100) }),
      ...(date !== undefined && { date }),
      ...(durationMinutes !== undefined && { durationMinutes: Math.round(Number(durationMinutes)) }),
      ...(status !== undefined && VALID_STATUSES.has(status) && { status }),
      ...(category !== undefined && VALID_CATEGORIES.has(category) && { category }),
      ...(description !== undefined && typeof description === 'string' && { description: description.trim().slice(0, 500) }),
    };

    await persistStore({
      users: store.users,
      activities: store.activities.map((a) => (a.id === id && a.userId === userId ? updated : a)),
    });

    return res.json({ activity: updated });
  } catch (err) {
    console.error('Update activity error:', err);
    return res.status(500).json({ error: 'Unable to update activity.' });
  }
});

app.delete('/api/activities/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const store = loadStore();
    const existing = store.activities.find((a) => a.id === id && a.userId === userId);

    if (!existing) {
      return res.status(404).json({ error: 'Activity not found.' });
    }

    await persistStore({
      users: store.users,
      activities: store.activities.filter((a) => !(a.id === id && a.userId === userId)),
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('Delete activity error:', err);
    return res.status(500).json({ error: 'Unable to delete activity.' });
  }
});

app.post('/api/activities/seed', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const store = loadStore();
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
      id: `act_${crypto.randomUUID()}`,
      userId,
      createdAt: Date.now() - idx * 1000,
    }));

    const otherUsersActivities = store.activities.filter((a) => a.userId !== userId);
    const nextActivities = [...created, ...otherUsersActivities];

    await persistStore({
      users: store.users,
      activities: nextActivities,
    });

    return res.json({ activities: created });
  } catch (err) {
    console.error('Seed activities error:', err);
    return res.status(500).json({ error: 'Unable to load sample activities.' });
  }
});
