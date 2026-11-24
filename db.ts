import path from 'path';
import os from 'os';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

dotenv.config();

export interface UserRecord {
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
  lastLoginAt?: number;
}

export interface UserLoginRecord {
  id: string;
  userId: string;
  email: string;
  eventType: 'signup' | 'login';
  tokenJti?: string;
  userAgent?: string;
  loggedInAt: number;
  loggedOutAt?: number;
}

export interface ActivityRecord {
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

export interface ProfileRecord {
  id: string;
  appUserId: string;
  email: string;
  name: string;
  fullName: string;
  subtitle: string;
  presetAvatar?: string;
  avatarUrl?: string;
  dailyGoalMinutes: number;
  defaultActivity: string;
  rawUserMetaData: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
  lastLoginAt?: number;
}

interface AppStoreData {
  users: UserRecord[];
  profiles: ProfileRecord[];
  logins: UserLoginRecord[];
  activities: ActivityRecord[];
}

export class DatabaseSetupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseSetupError';
  }
}

// -------------------------------------------------------------
// Supabase Client Setup (Server-side Service Role Key Only)
// -------------------------------------------------------------
let cachedSupabase: SupabaseClient | null = null;
let cachedEnvSignature = '';

function isValidSupabaseUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    return parsed.protocol === 'https:' || (parsed.protocol === 'http:' && parsed.hostname === 'localhost');
  } catch {
    return false;
  }
}

function isPublishableOrAnonKey(key: string): boolean {
  if (key.startsWith('sb_publishable_')) return true;
  const parts = key.split('.');
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
      if (payload?.role === 'anon') return true;
    } catch {
      // ignore decode errors
    }
  }
  return false;
}

function resolveSupabaseCredentials(): { url: string; serviceKey: string } {
  const url = (
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    ''
  ).trim();
  const serviceKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SECRET ||
    process.env.SUPABASE_KEY ||
    ''
  ).trim();
  return { url, serviceKey };
}

function isLocalFallbackAllowed(): boolean {
  return process.env.ALLOW_LOCAL_FALLBACK === 'true' && !process.env.VERCEL;
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, serviceKey } = resolveSupabaseCredentials();
  const signature = `${url}::${serviceKey ? 'set' : 'unset'}`;

  if (cachedSupabase && cachedEnvSignature === signature) {
    return cachedSupabase;
  }

  if (!url || !serviceKey) {
    return null;
  }

  if (!isValidSupabaseUrl(url)) {
    throw new DatabaseSetupError(
      'Invalid SUPABASE_URL format. Use your full https://...supabase.co project URL.'
    );
  }

  if (isPublishableOrAnonKey(serviceKey)) {
    throw new DatabaseSetupError(
      'SUPABASE_SERVICE_ROLE_KEY is set to a public/anon key. Replace it with your Supabase service_role/secret key.'
    );
  }

  cachedEnvSignature = signature;
  cachedSupabase = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return cachedSupabase;
}

function requireSupabaseOrFallback(): SupabaseClient | null {
  const client = getSupabaseClient();
  if (client) return client;
  if (isLocalFallbackAllowed()) return null;

  const { url, serviceKey } = resolveSupabaseCredentials();
  if (url && !serviceKey) {
    throw new DatabaseSetupError(
      'SUPABASE_SERVICE_ROLE_KEY is missing. Add it to your server environment variables (or Vercel Project Settings) so accounts and data save to Supabase.'
    );
  }
  if (!url && serviceKey) {
    throw new DatabaseSetupError(
      'SUPABASE_URL is missing. Add it to your server environment variables (or Vercel Project Settings) so accounts and data save to Supabase.'
    );
  }
  throw new DatabaseSetupError(
    'Supabase is not connected yet. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your server environment variables and run supabase/schema.sql in Supabase.'
  );
}

export function isSupabaseConfigured(): boolean {
  try {
    return getSupabaseClient() !== null;
  } catch {
    return false;
  }
}

function handleSupabaseError(error: { code?: string; message?: string } | null, context: string): never {
  const code = error?.code || '';
  const msg = error?.message || '';
  if (
    code === 'PGRST205' ||
    code === '42P01' ||
    code === '42703' ||
    msg.includes('Could not find the table') ||
    msg.includes('does not exist')
  ) {
    throw new DatabaseSetupError(
      'Database tables are not set up yet. Run supabase/schema.sql in your Supabase SQL Editor.'
    );
  }
  if (
    code === '42501' ||
    msg.toLowerCase().includes('row-level security')
  ) {
    throw new DatabaseSetupError(
      'Supabase rejected the request due to Row Level Security. Ensure SUPABASE_SERVICE_ROLE_KEY uses your secret service_role key, not the anon/public key.'
    );
  }
  if (
    code === 'PGRST301' ||
    msg.toLowerCase().includes('invalid api key') ||
    msg.toLowerCase().includes('jwt')
  ) {
    throw new DatabaseSetupError(
      'Database credentials appear invalid. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }
  throw new Error(`${context}: ${msg || 'Database request failed'}`);
}

interface SupabaseUserRow {
  id: string;
  email: string;
  name: string;
  subtitle: string;
  preset_avatar: string | null;
  avatar_url: string | null;
  daily_goal_minutes: number;
  default_activity: string;
  password_hash: string;
  password_salt: string;
  created_at: number | string;
  last_login_at: number | string | null;
}

interface SupabaseActivityRow {
  id: string;
  user_id: string;
  name: string;
  date: string;
  duration_minutes: number;
  status: 'Completed' | 'Ongoing' | 'Not Started';
  category: string;
  description: string;
  created_at: number | string;
}

function parseEpochMs(value: number | string | null | undefined): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string') {
    if (/^\d+$/.test(value.trim())) return Number(value.trim());
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return Date.now();
}

function mapUserRow(row: SupabaseUserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    subtitle: row.subtitle || 'Building a consistent routine',
    presetAvatar: row.preset_avatar || undefined,
    avatarUrl: row.avatar_url || undefined,
    dailyGoalMinutes: Number(row.daily_goal_minutes) || 60,
    defaultActivity: row.default_activity || 'Running',
    passwordHash: row.password_hash,
    passwordSalt: row.password_salt,
    createdAt: parseEpochMs(row.created_at),
    lastLoginAt: row.last_login_at != null ? parseEpochMs(row.last_login_at) : undefined,
  };
}

function mapActivityRow(row: SupabaseActivityRow): ActivityRecord {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    date: row.date,
    durationMinutes: Number(row.duration_minutes),
    status: row.status,
    category: row.category || 'Cardio',
    description: row.description || '',
    createdAt: parseEpochMs(row.created_at),
  };
}

function isMissingCategoryError(error: { code?: string; message?: string } | null): boolean {
  const msg = (error?.message || '').toLowerCase();
  return (error?.code === '42703' || error?.code === 'PGRST204') && msg.includes('category');
}

function isTimestampTypeError(error: { code?: string; message?: string } | null): boolean {
  const msg = (error?.message || '').toLowerCase();
  return (
    error?.code === '22007' ||
    msg.includes('timestamp') ||
    msg.includes('time zone')
  );
}

function toActivityInsertRow(
  activity: ActivityRecord,
  options: { includeCategory: boolean; createdAtAsIso: boolean }
): Record<string, unknown> {
  const row: Record<string, unknown> = {
    id: activity.id,
    user_id: activity.userId,
    name: activity.name,
    date: activity.date,
    duration_minutes: activity.durationMinutes,
    status: activity.status,
    description: activity.description,
    created_at: options.createdAtAsIso
      ? new Date(activity.createdAt).toISOString()
      : activity.createdAt,
  };
  if (options.includeCategory) {
    row.category = activity.category;
  }
  return row;
}

// -------------------------------------------------------------
// Local Atomic JSON Store Fallback (used when Supabase is unset)
// -------------------------------------------------------------
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : process.env.VERCEL
    ? path.join(os.tmpdir(), 'physical-list-data')
    : path.resolve(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'app-store.json');

let storeCache: AppStoreData | null = null;
let writeQueue: Promise<void> = Promise.resolve();

function loadLocalStore(): AppStoreData {
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
          profiles: Array.isArray(parsed.profiles) ? parsed.profiles : [],
          logins: Array.isArray(parsed.logins) ? parsed.logins : [],
          activities: parsed.activities,
        };
        return storeCache;
      }
    }
  } catch (err) {
    console.warn('Could not read existing store, initializing clean store:', (err as Error).message);
  }

  storeCache = { users: [], profiles: [], logins: [], activities: [] };
  return storeCache;
}

function persistLocalStore(partial: Partial<AppStoreData>): Promise<void> {
  const current = loadLocalStore();
  const data: AppStoreData = {
    users: partial.users ?? current.users,
    profiles: partial.profiles ?? current.profiles,
    logins: partial.logins ?? current.logins,
    activities: partial.activities ?? current.activities,
  };
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

function buildAuthUserMetadata(user: UserRecord): Record<string, unknown> {
  const meta: Record<string, unknown> = {
    app_user_id: user.id,
    name: user.name,
    full_name: user.name,
    subtitle: user.subtitle,
    preset_avatar: user.presetAvatar ?? null,
    daily_goal_minutes: user.dailyGoalMinutes,
    default_activity: user.defaultActivity,
    has_custom_avatar: Boolean(user.avatarUrl),
  };
  if (!user.avatarUrl || user.avatarUrl.length <= 1024) {
    meta.avatar_url = user.avatarUrl ?? null;
  }
  return meta;
}

async function findAuthUserIdByEmail(supabase: SupabaseClient, email: string): Promise<string | null> {
  const target = email.trim().toLowerCase();
  let page = 1;
  const perPage = 200;
  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error || !data?.users?.length) return null;
    const match = data.users.find((u) => (u.email || '').toLowerCase() === target);
    if (match) return match.id;
    if (data.users.length < perPage) return null;
    page += 1;
  }
  return null;
}

// -------------------------------------------------------------
// Unified Repository Operations
// -------------------------------------------------------------
export const db = {
  async checkHealth(): Promise<{ storage: 'supabase' | 'local' | 'unconfigured'; tablesReady: boolean }> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      if (isLocalFallbackAllowed()) {
        loadLocalStore();
        return { storage: 'local', tablesReady: true };
      }
      return { storage: 'unconfigured', tablesReady: false };
    }

    const [usersRes, profilesRes, loginsRes, activitiesRes] = await Promise.all([
      supabase.from('users').select('id').limit(1),
      supabase.from('profiles').select('id').limit(1),
      supabase.from('user_logins').select('id').limit(1),
      supabase.from('activities').select('id').limit(1),
    ]);

    const tablesReady =
      !usersRes.error &&
      !profilesRes.error &&
      !loginsRes.error &&
      !activitiesRes.error;
    return { storage: 'supabase', tablesReady };
  },

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const supabase = requireSupabaseOrFallback();
    if (!supabase) {
      const store = loadLocalStore();
      return store.users.find((u) => u.email === email) || null;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) handleSupabaseError(error, 'Failed to query user by email');
    return data ? mapUserRow(data as SupabaseUserRow) : null;
  },

  async findUserById(id: string): Promise<UserRecord | null> {
    const supabase = requireSupabaseOrFallback();
    if (!supabase) {
      const store = loadLocalStore();
      return store.users.find((u) => u.id === id) || null;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) handleSupabaseError(error, 'Failed to query user by ID');
    return data ? mapUserRow(data as SupabaseUserRow) : null;
  },

  async createUser(user: UserRecord): Promise<UserRecord> {
    const supabase = requireSupabaseOrFallback();
    if (!supabase) {
      const store = loadLocalStore();
      await persistLocalStore({
        users: [...store.users, user],
        logins: store.logins,
        activities: store.activities,
      });
      return user;
    }

    const { data, error } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
        name: user.name,
        subtitle: user.subtitle,
        preset_avatar: user.presetAvatar ?? null,
        avatar_url: user.avatarUrl ?? null,
        daily_goal_minutes: user.dailyGoalMinutes,
        default_activity: user.defaultActivity,
        password_hash: user.passwordHash,
        password_salt: user.passwordSalt,
        created_at: user.createdAt,
        last_login_at: user.lastLoginAt ?? user.createdAt,
      })
      .select('*')
      .single();

    if (error) handleSupabaseError(error, 'Failed to create user');
    return mapUserRow(data as SupabaseUserRow);
  },

  async updateLastLogin(userId: string, timestamp: number): Promise<void> {
    const supabase = requireSupabaseOrFallback();
    if (!supabase) {
      const store = loadLocalStore();
      await persistLocalStore({
        users: store.users.map((u) => (u.id === userId ? { ...u, lastLoginAt: timestamp } : u)),
        logins: store.logins,
        activities: store.activities,
      });
      return;
    }

    const { error } = await supabase
      .from('users')
      .update({ last_login_at: timestamp })
      .eq('id', userId);

    if (error) handleSupabaseError(error, 'Failed to record login timestamp');
  },

  async recordLogin(entry: UserLoginRecord): Promise<void> {
    const supabase = requireSupabaseOrFallback();
    if (!supabase) {
      const store = loadLocalStore();
      await persistLocalStore({
        users: store.users,
        logins: [entry, ...store.logins],
        activities: store.activities,
      });
      return;
    }

    const { error } = await supabase.from('user_logins').insert({
      id: entry.id,
      user_id: entry.userId,
      email: entry.email,
      event_type: entry.eventType,
      token_jti: entry.tokenJti ?? null,
      user_agent: entry.userAgent ?? null,
      logged_in_at: entry.loggedInAt,
      logged_out_at: entry.loggedOutAt ?? null,
    });

    if (error) handleSupabaseError(error, 'Failed to record user login event');
  },

  async markLogout(tokenJti: string, timestamp: number): Promise<void> {
    const supabase = requireSupabaseOrFallback();
    if (!supabase) {
      const store = loadLocalStore();
      await persistLocalStore({
        users: store.users,
        logins: store.logins.map((l) =>
          l.tokenJti === tokenJti ? { ...l, loggedOutAt: timestamp } : l
        ),
        activities: store.activities,
      });
      return;
    }

    const { error } = await supabase
      .from('user_logins')
      .update({ logged_out_at: timestamp })
      .eq('token_jti', tokenJti);

    if (error) handleSupabaseError(error, 'Failed to update logout timestamp');
  },

  async listLoginsByUser(userId: string, limit = 10): Promise<UserLoginRecord[]> {
    const supabase = requireSupabaseOrFallback();
    if (!supabase) {
      const store = loadLocalStore();
      return store.logins
        .filter((l) => l.userId === userId)
        .sort((a, b) => b.loggedInAt - a.loggedInAt)
        .slice(0, limit);
    }

    const { data, error } = await supabase
      .from('user_logins')
      .select('id, user_id, email, event_type, user_agent, logged_in_at, logged_out_at')
      .eq('user_id', userId)
      .order('logged_in_at', { ascending: false })
      .limit(limit);

    if (error) handleSupabaseError(error, 'Failed to load sign-in history');

    interface LoginRow {
      id: string;
      user_id: string;
      email: string;
      event_type: 'signup' | 'login';
      user_agent: string | null;
      logged_in_at: number | string;
      logged_out_at: number | string | null;
    }

    return ((data || []) as LoginRow[]).map((row) => ({
      id: row.id,
      userId: row.user_id,
      email: row.email,
      eventType: row.event_type,
      userAgent: row.user_agent || undefined,
      loggedInAt: Number(row.logged_in_at),
      loggedOutAt: row.logged_out_at != null ? Number(row.logged_out_at) : undefined,
    }));
  },

  async updateUserProfile(
    userId: string,
    updates: Partial<
      Pick<UserRecord, 'name' | 'subtitle' | 'avatarUrl' | 'presetAvatar' | 'dailyGoalMinutes' | 'defaultActivity'>
    >
  ): Promise<UserRecord | null> {
    const supabase = requireSupabaseOrFallback();
    if (!supabase) {
      const store = loadLocalStore();
      const existing = store.users.find((u) => u.id === userId);
      if (!existing) return null;
      const updatedUser: UserRecord = { ...existing, ...updates };
      await persistLocalStore({
        users: store.users.map((u) => (u.id === userId ? updatedUser : u)),
        logins: store.logins,
        activities: store.activities,
      });
      return updatedUser;
    }

    const payload: Record<string, unknown> = {};
    if ('name' in updates) payload.name = updates.name;
    if ('subtitle' in updates) payload.subtitle = updates.subtitle;
    if ('avatarUrl' in updates) payload.avatar_url = updates.avatarUrl ?? null;
    if ('presetAvatar' in updates) payload.preset_avatar = updates.presetAvatar ?? null;
    if ('dailyGoalMinutes' in updates) payload.daily_goal_minutes = updates.dailyGoalMinutes;
    if ('defaultActivity' in updates) payload.default_activity = updates.defaultActivity;

    const { data, error } = await supabase
      .from('users')
      .update(payload)
      .eq('id', userId)
      .select('*')
      .maybeSingle();

    if (error) handleSupabaseError(error, 'Failed to update profile');
    return data ? mapUserRow(data as SupabaseUserRow) : null;
  },

  async listActivitiesByUser(userId: string): Promise<ActivityRecord[]> {
    const supabase = requireSupabaseOrFallback();
    if (!supabase) {
      const store = loadLocalStore();
      return store.activities
        .filter((a) => a.userId === userId)
        .sort((a, b) => {
          const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
          return dateDiff !== 0 ? dateDiff : b.createdAt - a.createdAt;
        });
    }

    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) handleSupabaseError(error, 'Failed to load activities');
    return ((data || []) as SupabaseActivityRow[]).map(mapActivityRow);
  },

  async createActivity(activity: ActivityRecord): Promise<ActivityRecord> {
    const supabase = requireSupabaseOrFallback();
    if (!supabase) {
      const store = loadLocalStore();
      await persistLocalStore({
        users: store.users,
        logins: store.logins,
        activities: [activity, ...store.activities],
      });
      return activity;
    }

    let includeCategory = true;
    let createdAtAsIso = false;
    let lastError: { code?: string; message?: string } | null = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error } = await supabase
        .from('activities')
        .insert(toActivityInsertRow(activity, { includeCategory, createdAtAsIso }))
        .select('*')
        .single();

      if (!error) {
        const mapped = mapActivityRow(data as SupabaseActivityRow);
        if (!includeCategory) mapped.category = activity.category || 'Cardio';
        return mapped;
      }

      lastError = error;
      if (includeCategory && isMissingCategoryError(error)) {
        includeCategory = false;
        continue;
      }
      if (!createdAtAsIso && isTimestampTypeError(error)) {
        createdAtAsIso = true;
        continue;
      }
      break;
    }

    handleSupabaseError(lastError, 'Failed to save activity');
  },

  async findActivityByIdAndUser(id: string, userId: string): Promise<ActivityRecord | null> {
    const supabase = requireSupabaseOrFallback();
    if (!supabase) {
      const store = loadLocalStore();
      return store.activities.find((a) => a.id === id && a.userId === userId) || null;
    }

    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) handleSupabaseError(error, 'Failed to look up activity');
    return data ? mapActivityRow(data as SupabaseActivityRow) : null;
  },

  async updateActivity(
    id: string,
    userId: string,
    updates: Partial<Pick<ActivityRecord, 'name' | 'date' | 'durationMinutes' | 'status' | 'category' | 'description'>>
  ): Promise<ActivityRecord | null> {
    const supabase = requireSupabaseOrFallback();
    if (!supabase) {
      const store = loadLocalStore();
      const existing = store.activities.find((a) => a.id === id && a.userId === userId);
      if (!existing) return null;
      const updated: ActivityRecord = { ...existing, ...updates };
      await persistLocalStore({
        users: store.users,
        logins: store.logins,
        activities: store.activities.map((a) => (a.id === id && a.userId === userId ? updated : a)),
      });
      return updated;
    }

    const payload: Record<string, unknown> = {};
    if ('name' in updates) payload.name = updates.name;
    if ('date' in updates) payload.date = updates.date;
    if ('durationMinutes' in updates) payload.duration_minutes = updates.durationMinutes;
    if ('status' in updates) payload.status = updates.status;
    if ('category' in updates) payload.category = updates.category;
    if ('description' in updates) payload.description = updates.description;

    let { data, error } = await supabase
      .from('activities')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .maybeSingle();

    if (error && 'category' in payload && isMissingCategoryError(error)) {
      const { category: _omit, ...withoutCategory } = payload;
      const retry = await supabase
        .from('activities')
        .update(withoutCategory)
        .eq('id', id)
        .eq('user_id', userId)
        .select('*')
        .maybeSingle();
      data = retry.data;
      error = retry.error;
    }

    if (error) handleSupabaseError(error, 'Failed to update activity');
    return data ? mapActivityRow(data as SupabaseActivityRow) : null;
  },

  async deleteActivity(id: string, userId: string): Promise<boolean> {
    const supabase = requireSupabaseOrFallback();
    if (!supabase) {
      const store = loadLocalStore();
      const existing = store.activities.find((a) => a.id === id && a.userId === userId);
      if (!existing) return false;
      await persistLocalStore({
        users: store.users,
        logins: store.logins,
        activities: store.activities.filter((a) => !(a.id === id && a.userId === userId)),
      });
      return true;
    }

    const { data, error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select('id');

    if (error) handleSupabaseError(error, 'Failed to delete activity');
    return Array.isArray(data) && data.length > 0;
  },

  async replaceUserActivities(userId: string, activities: ActivityRecord[]): Promise<ActivityRecord[]> {
    const supabase = requireSupabaseOrFallback();
    if (!supabase) {
      const store = loadLocalStore();
      const otherUsersActivities = store.activities.filter((a) => a.userId !== userId);
      await persistLocalStore({
        users: store.users,
        logins: store.logins,
        activities: [...activities, ...otherUsersActivities],
      });
      return activities;
    }

    const { error: deleteError } = await supabase
      .from('activities')
      .delete()
      .eq('user_id', userId);

    if (deleteError) handleSupabaseError(deleteError, 'Failed to reset user activities');

    if (activities.length === 0) return [];

    let includeCategory = true;
    let createdAtAsIso = false;
    let lastError: { code?: string; message?: string } | null = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      const rows = activities.map((a) =>
        toActivityInsertRow(
          { ...a, userId },
          { includeCategory, createdAtAsIso }
        )
      );
      const { data, error: insertError } = await supabase
        .from('activities')
        .insert(rows)
        .select('*');

      if (!insertError) {
        return ((data || []) as SupabaseActivityRow[]).map((row, idx) => {
          const mapped = mapActivityRow(row);
          if (!includeCategory && activities[idx]) {
            mapped.category = activities[idx].category || 'Cardio';
          }
          return mapped;
        });
      }

      lastError = insertError;
      if (includeCategory && isMissingCategoryError(insertError)) {
        includeCategory = false;
        continue;
      }
      if (!createdAtAsIso && isTimestampTypeError(insertError)) {
        createdAtAsIso = true;
        continue;
      }
      break;
    }

    handleSupabaseError(lastError, 'Failed to insert starter activities');
  },

  async syncUserProfile(
    user: UserRecord,
    options?: { password?: string; isLogin?: boolean }
  ): Promise<ProfileRecord | null> {
    const supabase = requireSupabaseOrFallback();
    const meta = buildAuthUserMetadata(user);
    const now = Date.now();

    if (!supabase) {
      const store = loadLocalStore();
      const existing = store.profiles.find(
        (p) => p.appUserId === user.id || p.email.toLowerCase() === user.email.toLowerCase()
      );
      const profile: ProfileRecord = {
        id: existing?.id || crypto.randomUUID(),
        appUserId: user.id,
        email: user.email,
        name: user.name,
        fullName: user.name,
        subtitle: user.subtitle,
        presetAvatar: user.presetAvatar,
        avatarUrl: user.avatarUrl,
        dailyGoalMinutes: user.dailyGoalMinutes,
        defaultActivity: user.defaultActivity,
        rawUserMetaData: meta,
        createdAt: existing?.createdAt || user.createdAt || now,
        updatedAt: now,
        lastLoginAt: options?.isLogin ? user.lastLoginAt || now : existing?.lastLoginAt ?? user.lastLoginAt,
      };
      const nextProfiles = existing
        ? store.profiles.map((p) => (p.id === existing.id ? profile : p))
        : [profile, ...store.profiles];
      await persistLocalStore({ profiles: nextProfiles });
      return profile;
    }

    // 1. Locate linked profile row if already created
    const { data: profileByAppId, error: lookupByAppError } = await supabase
      .from('profiles')
      .select('id')
      .eq('app_user_id', user.id)
      .maybeSingle();

    if (lookupByAppError) {
      handleSupabaseError(lookupByAppError, 'Failed to query profiles table');
    }

    let authUserId: string | null = (profileByAppId as { id?: string } | null)?.id || null;

    if (!authUserId) {
      const { data: profileByEmail, error: lookupByEmailError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', user.email)
        .limit(1)
        .maybeSingle();

      if (lookupByEmailError) {
        handleSupabaseError(lookupByEmailError, 'Failed to query profiles table');
      }
      authUserId = (profileByEmail as { id?: string } | null)?.id || null;
    }

    // 2. Ensure auth.users user exists & metadata stays synced (which also fires handle_new_user trigger)
    if (!authUserId) {
      if (options?.password) {
        const { data: createdAuth, error: createAuthError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: options.password,
          email_confirm: true,
          user_metadata: meta,
        });
        if (!createAuthError && createdAuth?.user?.id) {
          authUserId = createdAuth.user.id;
        } else {
          if (createAuthError && !createAuthError.message.toLowerCase().includes('already')) {
            console.warn('Supabase Auth createUser warning:', createAuthError.message);
          }
          authUserId = await findAuthUserIdByEmail(supabase, user.email);
        }
      } else {
        authUserId = await findAuthUserIdByEmail(supabase, user.email);
      }
    }

    if (!authUserId) {
      return null;
    }

    const { error: updateAuthError } = await supabase.auth.admin.updateUserById(authUserId, {
      user_metadata: meta,
    });
    if (updateAuthError) {
      console.warn('Supabase Auth metadata update warning:', updateAuthError.message);
    }

    // 3. Upsert public.profiles directly so custom avatar_url, app_user_id, and last_login_at are always persisted
    const upsertPayload: Record<string, unknown> = {
      id: authUserId,
      app_user_id: user.id,
      email: user.email,
      name: user.name,
      full_name: user.name,
      subtitle: user.subtitle,
      preset_avatar: user.presetAvatar ?? null,
      avatar_url: user.avatarUrl ?? null,
      daily_goal_minutes: user.dailyGoalMinutes,
      default_activity: user.defaultActivity,
      raw_user_meta_data: meta,
      updated_at: new Date(now).toISOString(),
    };
    if (user.lastLoginAt != null) {
      upsertPayload.last_login_at = new Date(user.lastLoginAt).toISOString();
    }

    const { data: savedProfile, error: upsertError } = await supabase
      .from('profiles')
      .upsert(upsertPayload, { onConflict: 'id' })
      .select('*')
      .single();

    if (upsertError) {
      handleSupabaseError(upsertError, 'Failed to sync user profile row');
    }

    const row = savedProfile as Record<string, unknown>;
    return {
      id: String(row.id),
      appUserId: String(row.app_user_id || user.id),
      email: String(row.email || user.email),
      name: String(row.name || user.name),
      fullName: String(row.full_name || row.name || user.name),
      subtitle: String(row.subtitle || user.subtitle),
      presetAvatar: typeof row.preset_avatar === 'string' ? row.preset_avatar : undefined,
      avatarUrl: typeof row.avatar_url === 'string' ? row.avatar_url : undefined,
      dailyGoalMinutes: Number(row.daily_goal_minutes) || user.dailyGoalMinutes,
      defaultActivity: String(row.default_activity || user.defaultActivity),
      rawUserMetaData: (row.raw_user_meta_data as Record<string, unknown>) || meta,
      createdAt: parseEpochMs(row.created_at as string | number),
      updatedAt: parseEpochMs(row.updated_at as string | number),
      lastLoginAt: row.last_login_at != null ? parseEpochMs(row.last_login_at as string | number) : undefined,
    };
  },

  async getProfileByUserId(userId: string): Promise<ProfileRecord | null> {
    const supabase = requireSupabaseOrFallback();
    if (!supabase) {
      const store = loadLocalStore();
      return store.profiles.find((p) => p.appUserId === userId) || null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('app_user_id', userId)
      .maybeSingle();

    if (error) handleSupabaseError(error, 'Failed to load profile');
    if (!data) return null;
    const row = data as Record<string, unknown>;
    return {
      id: String(row.id),
      appUserId: String(row.app_user_id || userId),
      email: String(row.email || ''),
      name: String(row.name || ''),
      fullName: String(row.full_name || row.name || ''),
      subtitle: String(row.subtitle || ''),
      presetAvatar: typeof row.preset_avatar === 'string' ? row.preset_avatar : undefined,
      avatarUrl: typeof row.avatar_url === 'string' ? row.avatar_url : undefined,
      dailyGoalMinutes: Number(row.daily_goal_minutes) || 60,
      defaultActivity: String(row.default_activity || 'Running'),
      rawUserMetaData: (row.raw_user_meta_data as Record<string, unknown>) || {},
      createdAt: parseEpochMs(row.created_at as string | number),
      updatedAt: parseEpochMs(row.updated_at as string | number),
      lastLoginAt: row.last_login_at != null ? parseEpochMs(row.last_login_at as string | number) : undefined,
    };
  },
};
