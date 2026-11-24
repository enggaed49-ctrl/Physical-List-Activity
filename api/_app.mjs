// serverApp.ts
import express from "express";
import crypto2 from "crypto";
import dotenv2 from "dotenv";

// db.ts
import path from "path";
import os from "os";
import fs from "fs";
import crypto from "crypto";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
dotenv.config();
var DatabaseSetupError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "DatabaseSetupError";
  }
};
var cachedSupabase = null;
var cachedEnvSignature = "";
function stripWrappingQuotesAndSpaces(raw) {
  let cleaned = raw.trim();
  if (cleaned.startsWith('"') && cleaned.endsWith('"') || cleaned.startsWith("'") && cleaned.endsWith("'")) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
}
function normalizeSupabaseUrl(raw) {
  let trimmed = stripWrappingQuotesAndSpaces(raw);
  if (!trimmed) return "";
  if (/^[a-z0-9]{16,32}$/i.test(trimmed)) {
    return `https://${trimmed.toLowerCase()}.supabase.co`;
  }
  if (!/^[a-z]+:\/\//i.test(trimmed) && /^[a-z0-9.-]+\.supabase\.(co|in|net)(\/.*)?$/i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }
  try {
    const parsed = new URL(trimmed);
    const cleanedPath = parsed.pathname.replace(/\/(rest|auth|storage|graphql|realtime)\/v1\/?.*$/i, "").replace(/\/+$/, "");
    return `${parsed.protocol}//${parsed.host}${cleanedPath}`;
  } catch {
    return trimmed.replace(/\/(rest|auth|storage|graphql|realtime)\/v1\/?.*$/i, "").replace(/\/+$/, "");
  }
}
function isValidSupabaseUrl(raw) {
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "https:" || parsed.protocol === "http:" && parsed.hostname === "localhost";
  } catch {
    return false;
  }
}
function extractSupabaseProjectRef(url) {
  try {
    const host = new URL(url).hostname;
    const match = host.match(/^([a-z0-9-]+)\.supabase\.(co|in|net)$/i);
    return match ? match[1].toLowerCase() : null;
  } catch {
    return null;
  }
}
function decodeJwtPayload(token) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
  } catch {
    return null;
  }
}
function inspectServiceKey(url, serviceKey) {
  if (!serviceKey) {
    return { format: "missing", error: null };
  }
  if (serviceKey.startsWith("sb_publishable_")) {
    return {
      format: "anon",
      error: "SUPABASE_SERVICE_ROLE_KEY is set to a publishable key (sb_publishable_...). Replace it with your secret service_role or sb_secret_... key."
    };
  }
  if (serviceKey.startsWith("sbp_")) {
    return {
      format: "invalid",
      error: "SUPABASE_SERVICE_ROLE_KEY is set to a Supabase Personal Access Token (sbp_...). Use your project service_role or Secret key from Project Settings -> API Keys instead."
    };
  }
  const jwtPayload = decodeJwtPayload(serviceKey);
  if (jwtPayload) {
    const role = typeof jwtPayload.role === "string" ? jwtPayload.role : "";
    if (role === "anon") {
      return {
        format: "anon",
        error: "SUPABASE_SERVICE_ROLE_KEY is set to the public anon key. Replace it with your private service_role key."
      };
    }
    const tokenRef = typeof jwtPayload.ref === "string" ? jwtPayload.ref.toLowerCase() : "";
    const urlRef = extractSupabaseProjectRef(url);
    if (tokenRef && urlRef && tokenRef !== urlRef) {
      return {
        format: "invalid",
        error: `SUPABASE_SERVICE_ROLE_KEY belongs to project "${tokenRef}", which does not match SUPABASE_URL ("${urlRef}").`
      };
    }
    if (role && role !== "service_role") {
      return {
        format: "invalid",
        error: `SUPABASE_SERVICE_ROLE_KEY has JWT role "${role}" instead of "service_role".`
      };
    }
    return { format: "jwt:service_role", error: null };
  }
  if (serviceKey.startsWith("sb_secret_")) {
    if (serviceKey.length < 24) {
      return {
        format: "invalid",
        error: "SUPABASE_SERVICE_ROLE_KEY looks truncated. Copy the complete sb_secret_... key from Project Settings -> API Keys."
      };
    }
    return { format: "sb_secret", error: null };
  }
  if (extractSupabaseProjectRef(url)) {
    return {
      format: "invalid",
      error: "SUPABASE_SERVICE_ROLE_KEY does not look like a valid Supabase service_role JWT (eyJ...) or Secret key (sb_secret_...). Make sure you did not paste the JWT Secret or a truncated value."
    };
  }
  return serviceKey.length >= 20 ? { format: "sb_secret", error: null } : { format: "invalid", error: "SUPABASE_SERVICE_ROLE_KEY is too short to be a valid API key." };
}
function resolveSupabaseCredentials() {
  const urlCandidates = [
    ["SUPABASE_URL", process.env.SUPABASE_URL],
    ["SUPABASE_REST_URL", process.env.SUPABASE_REST_URL],
    ["NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL],
    ["VITE_SUPABASE_URL", process.env.VITE_SUPABASE_URL]
  ];
  const matchedUrl = urlCandidates.find(([, val]) => Boolean(val && stripWrappingQuotesAndSpaces(val)));
  const keyCandidates = [
    ["SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY],
    ["SERVICE_KEY", process.env.SERVICE_KEY],
    ["SUPABASE_SERVICE_ROLE", process.env.SUPABASE_SERVICE_ROLE],
    ["SUPABASE_SERVICE_KEY", process.env.SUPABASE_SERVICE_KEY],
    ["SUPABASE_SECRET_KEY", process.env.SUPABASE_SECRET_KEY],
    ["SUPABASE_SECRET", process.env.SUPABASE_SECRET],
    ["SUPABASE_KEY", process.env.SUPABASE_KEY]
  ];
  const matchedKey = keyCandidates.find(([, val]) => Boolean(val && stripWrappingQuotesAndSpaces(val)));
  const url = matchedUrl ? normalizeSupabaseUrl(matchedUrl[1]) : "";
  const serviceKey = matchedKey ? stripWrappingQuotesAndSpaces(matchedKey[1]) : "";
  return {
    url,
    serviceKey,
    urlSource: matchedUrl ? matchedUrl[0] : null,
    keySource: matchedKey ? matchedKey[0] : null
  };
}
function isLocalFallbackAllowed() {
  return process.env.ALLOW_LOCAL_FALLBACK === "true" && !process.env.VERCEL;
}
function getSupabaseClient() {
  const { url, serviceKey } = resolveSupabaseCredentials();
  const signature = `${url}::${serviceKey ? "set" : "unset"}`;
  if (cachedSupabase && cachedEnvSignature === signature) {
    return cachedSupabase;
  }
  if (!url || !serviceKey) {
    return null;
  }
  if (!isValidSupabaseUrl(url)) {
    throw new DatabaseSetupError(
      "Invalid SUPABASE_URL format. Use your https://...supabase.co project URL (or .../rest/v1/)."
    );
  }
  const keyInspection = inspectServiceKey(url, serviceKey);
  if (keyInspection.error) {
    throw new DatabaseSetupError(keyInspection.error);
  }
  cachedEnvSignature = signature;
  cachedSupabase = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
  return cachedSupabase;
}
async function verifySupabaseConnection(options) {
  const shouldLog = options?.log ?? true;
  const checkedAt = (/* @__PURE__ */ new Date()).toISOString();
  const { url, serviceKey, urlSource, keySource } = resolveSupabaseCredentials();
  const urlLoaded = Boolean(url);
  const keyLoaded = Boolean(serviceKey);
  const keyInspection = inspectServiceKey(url, serviceKey);
  const buildResult = (partial) => ({
    ok: false,
    urlLoaded,
    keyLoaded,
    urlSource,
    keySource,
    resolvedUrl: urlLoaded ? url : null,
    keyFormat: keyInspection.format,
    connectionActive: false,
    authValid: false,
    tablesReady: false,
    missingTables: [],
    error: null,
    checkedAt,
    ...partial
  });
  const logResult = (result) => {
    if (!shouldLog) return result;
    if (result.ok) {
      console.info(
        `[Supabase Diagnostic] Connected to ${result.resolvedUrl} (${result.urlSource} + ${result.keySource}, key=${result.keyFormat}, tablesReady=${result.tablesReady}).`
      );
    } else if (result.error) {
      console.error(
        `[Supabase Diagnostic] ${result.error} (urlLoaded=${result.urlLoaded}${result.urlSource ? ` [${result.urlSource}]` : ""}, keyLoaded=${result.keyLoaded}${result.keySource ? ` [${result.keySource}]` : ""}, keyFormat=${result.keyFormat}).`
      );
    }
    return result;
  };
  if (!urlLoaded && !keyLoaded) {
    return logResult(
      buildResult({
        error: "Supabase environment variables (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY / SERVICE_KEY) are not loaded."
      })
    );
  }
  if (!urlLoaded) {
    return logResult(
      buildResult({
        error: "SUPABASE_URL is not loaded in environment variables."
      })
    );
  }
  if (!isValidSupabaseUrl(url)) {
    return logResult(
      buildResult({
        error: `Invalid SUPABASE_URL format ("${url}"). Expected https://<project-ref>.supabase.co.`
      })
    );
  }
  if (!keyLoaded) {
    return logResult(
      buildResult({
        error: "SUPABASE_SERVICE_ROLE_KEY (or SERVICE_KEY) is not loaded in environment variables."
      })
    );
  }
  if (keyInspection.error) {
    return logResult(
      buildResult({
        error: keyInspection.error
      })
    );
  }
  try {
    const restPing = await fetch(`${url}/rest/v1/`, {
      method: "GET",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`
      },
      signal: AbortSignal.timeout(6e3)
    });
    if (restPing.status === 401 || restPing.status === 403) {
      let detail = `HTTP ${restPing.status}`;
      try {
        const body = await restPing.json();
        if (body?.message) detail = body.message;
      } catch {
      }
      return logResult(
        buildResult({
          connectionActive: true,
          authValid: false,
          error: `Supabase authentication failed against ${url}: ${detail}. Verify SUPABASE_SERVICE_ROLE_KEY uses your project's active service_role or sb_secret_ key.`
        })
      );
    }
    if (!restPing.ok && restPing.status >= 500) {
      return logResult(
        buildResult({
          connectionActive: false,
          error: `Supabase REST endpoint (${url}/rest/v1/) returned HTTP ${restPing.status}.`
        })
      );
    }
  } catch (err) {
    return logResult(
      buildResult({
        connectionActive: false,
        error: `Cannot reach Supabase URL (${url}): ${err.message}`
      })
    );
  }
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return logResult(buildResult({ error: "Unable to initialize Supabase client." }));
    }
    const tableNames = ["users", "profiles", "user_logins", "activities"];
    const [tableResults, authAdminResult] = await Promise.all([
      Promise.all(tableNames.map((name) => supabase.from(name).select("id").limit(1))),
      supabase.auth.admin.listUsers({ page: 1, perPage: 1 })
    ]);
    const authTableError = tableResults.find(
      (r) => r.error && (r.error.code === "PGRST301" || r.error.message.toLowerCase().includes("invalid api key") || r.error.message.toLowerCase().includes("invalid jwt"))
    );
    if (authTableError?.error || authAdminResult.error) {
      const msg = authTableError?.error?.message || authAdminResult.error?.message || "Authentication failed";
      return logResult(
        buildResult({
          connectionActive: true,
          authValid: false,
          error: `Supabase authentication failed for ${url}: ${msg}. Check SUPABASE_SERVICE_ROLE_KEY.`
        })
      );
    }
    const missingTables = [];
    tableResults.forEach((res, idx) => {
      if (res.error) {
        missingTables.push(tableNames[idx]);
      }
    });
    const tablesReady = missingTables.length === 0;
    const result = buildResult({
      ok: true,
      connectionActive: true,
      authValid: true,
      tablesReady,
      missingTables,
      error: tablesReady ? null : `Connected to Supabase, but missing tables: ${missingTables.join(", ")}. Run supabase/schema.sql in Supabase SQL Editor.`
    });
    if (shouldLog) {
      if (tablesReady) {
        logResult(result);
      } else {
        console.warn(`[Supabase Diagnostic] ${result.error}`);
      }
    }
    return result;
  } catch (err) {
    return logResult(
      buildResult({
        connectionActive: true,
        error: err instanceof Error ? err.message : "Supabase diagnostic check failed."
      })
    );
  }
}
function requireSupabaseOrFallback() {
  const client = getSupabaseClient();
  if (client) return client;
  if (isLocalFallbackAllowed()) return null;
  const { url, serviceKey } = resolveSupabaseCredentials();
  if (url && !serviceKey) {
    throw new DatabaseSetupError(
      "SUPABASE_SERVICE_ROLE_KEY is missing. Add it to your server environment variables (or Vercel Project Settings) so accounts and data save to Supabase."
    );
  }
  if (!url && serviceKey) {
    throw new DatabaseSetupError(
      "SUPABASE_URL is missing. Add it to your server environment variables (or Vercel Project Settings) so accounts and data save to Supabase."
    );
  }
  throw new DatabaseSetupError(
    "Supabase is not connected yet. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your server environment variables and run supabase/schema.sql in Supabase."
  );
}
function isSupabaseConfigured() {
  try {
    return getSupabaseClient() !== null;
  } catch {
    return false;
  }
}
function handleSupabaseError(error, context) {
  const code = error?.code || "";
  const msg = error?.message || "";
  const lower = msg.toLowerCase();
  if (code === "PGRST205" || code === "42P01" || code === "42703" || msg.includes("Could not find the table") || msg.includes("does not exist")) {
    throw new DatabaseSetupError(
      "Database tables are not set up yet. Run supabase/schema.sql in your Supabase SQL Editor."
    );
  }
  if (code === "42501" || lower.includes("row-level security")) {
    throw new DatabaseSetupError(
      "Supabase rejected the request due to Row Level Security. Ensure SUPABASE_SERVICE_ROLE_KEY uses your secret service_role key, not the anon/public key."
    );
  }
  if (code === "PGRST301" || lower.includes("invalid api key") || lower.includes("no api key") || lower.includes("invalid jwt") || lower.includes("jwt expired") || lower.includes("jwserror")) {
    throw new DatabaseSetupError(
      `Supabase rejected the API key (${msg || code || "Invalid credentials"}). Verify SUPABASE_URL matches your project and SUPABASE_SERVICE_ROLE_KEY is your secret service_role or sb_secret_ key (without quotes).`
    );
  }
  throw new Error(`${context}: ${msg || "Database request failed"}`);
}
function parseEpochMs(value) {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    if (/^\d+$/.test(value.trim())) return Number(value.trim());
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return Date.now();
}
function mapUserRow(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    subtitle: row.subtitle || "Building a consistent routine",
    presetAvatar: row.preset_avatar || void 0,
    avatarUrl: row.avatar_url || void 0,
    dailyGoalMinutes: Number(row.daily_goal_minutes) || 60,
    defaultActivity: row.default_activity || "Running",
    passwordHash: row.password_hash,
    passwordSalt: row.password_salt,
    createdAt: parseEpochMs(row.created_at),
    lastLoginAt: row.last_login_at != null ? parseEpochMs(row.last_login_at) : void 0
  };
}
function mapActivityRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    date: row.date,
    durationMinutes: Number(row.duration_minutes),
    status: row.status,
    category: row.category || "Cardio",
    description: row.description || "",
    createdAt: parseEpochMs(row.created_at)
  };
}
function isMissingCategoryError(error) {
  const msg = (error?.message || "").toLowerCase();
  return (error?.code === "42703" || error?.code === "PGRST204") && msg.includes("category");
}
function isTimestampTypeError(error) {
  const msg = (error?.message || "").toLowerCase();
  return error?.code === "22007" || msg.includes("timestamp") || msg.includes("time zone");
}
function toActivityInsertRow(activity, options) {
  const row = {
    id: activity.id,
    user_id: activity.userId,
    name: activity.name,
    date: activity.date,
    duration_minutes: activity.durationMinutes,
    status: activity.status,
    description: activity.description,
    created_at: options.createdAtAsIso ? new Date(activity.createdAt).toISOString() : activity.createdAt
  };
  if (options.includeCategory) {
    row.category = activity.category;
  }
  return row;
}
var DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : process.env.VERCEL ? path.join(os.tmpdir(), "physical-list-data") : path.resolve(process.cwd(), "data");
var STORE_PATH = path.join(DATA_DIR, "app-store.json");
var storeCache = null;
var writeQueue = Promise.resolve();
function loadLocalStore() {
  if (storeCache) return storeCache;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true, mode: 448 });
    }
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.activities)) {
        storeCache = {
          users: parsed.users,
          profiles: Array.isArray(parsed.profiles) ? parsed.profiles : [],
          logins: Array.isArray(parsed.logins) ? parsed.logins : [],
          activities: parsed.activities
        };
        return storeCache;
      }
    }
  } catch (err) {
    console.warn("Could not read existing store, initializing clean store:", err.message);
  }
  storeCache = { users: [], profiles: [], logins: [], activities: [] };
  return storeCache;
}
function persistLocalStore(partial) {
  const current = loadLocalStore();
  const data = {
    users: partial.users ?? current.users,
    profiles: partial.profiles ?? current.profiles,
    logins: partial.logins ?? current.logins,
    activities: partial.activities ?? current.activities
  };
  storeCache = data;
  writeQueue = writeQueue.then(async () => {
    if (!fs.existsSync(DATA_DIR)) {
      await fs.promises.mkdir(DATA_DIR, { recursive: true, mode: 448 });
    }
    const tempPath = `${STORE_PATH}.${crypto.randomBytes(6).toString("hex")}.tmp`;
    await fs.promises.writeFile(tempPath, JSON.stringify(data, null, 2), {
      encoding: "utf-8",
      mode: 384
    });
    await fs.promises.rename(tempPath, STORE_PATH);
  }).catch((err) => {
    console.error("Failed to persist store:", err);
  });
  return writeQueue;
}
function buildAuthUserMetadata(user) {
  const meta = {
    app_user_id: user.id,
    name: user.name,
    full_name: user.name,
    subtitle: user.subtitle,
    preset_avatar: user.presetAvatar ?? null,
    daily_goal_minutes: user.dailyGoalMinutes,
    default_activity: user.defaultActivity,
    has_custom_avatar: Boolean(user.avatarUrl)
  };
  if (!user.avatarUrl || user.avatarUrl.length <= 1024) {
    meta.avatar_url = user.avatarUrl ?? null;
  }
  return meta;
}
async function findAuthUserIdByEmail(supabase, email) {
  const target = email.trim().toLowerCase();
  let page = 1;
  const perPage = 200;
  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error || !data) return null;
    const users = data.users || [];
    if (!users.length) return null;
    const match = users.find((u) => (u.email || "").toLowerCase() === target);
    if (match) return match.id;
    if (data.users.length < perPage) return null;
    page += 1;
  }
  return null;
}
var db = {
  async checkHealth() {
    const supabase = getSupabaseClient();
    if (!supabase) {
      if (isLocalFallbackAllowed()) {
        loadLocalStore();
        return { storage: "local", tablesReady: true };
      }
      return { storage: "unconfigured", tablesReady: false };
    }
    const [usersRes, profilesRes, loginsRes, activitiesRes] = await Promise.all([
      supabase.from("users").select("id").limit(1),
      supabase.from("profiles").select("id").limit(1),
      supabase.from("user_logins").select("id").limit(1),
      supabase.from("activities").select("id").limit(1)
    ]);
    const tablesReady = !usersRes.error && !profilesRes.error && !loginsRes.error && !activitiesRes.error;
    return { storage: "supabase", tablesReady };
  },
  async findUserByEmail(email) {
    const supabase = requireSupabaseOrFallback();
    if (!supabase) {
      const store = loadLocalStore();
      return store.users.find((u) => u.email === email) || null;
    }
    const { data, error } = await supabase.from("users").select("*").eq("email", email).maybeSingle();
    if (error) handleSupabaseError(error, "Failed to query user by email");
    return data ? mapUserRow(data) : null;
  },
  async findUserById(id) {
    const supabase = requireSupabaseOrFallback();
    if (!supabase) {
      const store = loadLocalStore();
      return store.users.find((u) => u.id === id) || null;
    }
    const { data, error } = await supabase.from("users").select("*").eq("id", id).maybeSingle();
    if (error) handleSupabaseError(error, "Failed to query user by ID");
    return data ? mapUserRow(data) : null;
  },
  async createUser(user) {
    const supabase = requireSupabaseOrFallback();
    if (!supabase) {
      const store = loadLocalStore();
      await persistLocalStore({
        users: [...store.users, user],
        logins: store.logins,
        activities: store.activities
      });
      return user;
    }
    const { data, error } = await supabase.from("users").insert({
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
      last_login_at: user.lastLoginAt ?? user.createdAt
    }).select("*").single();
    if (error) handleSupabaseError(error, "Failed to create user");
    return mapUserRow(data);
  },
  async updateLastLogin(userId, timestamp) {
    const supabase = requireSupabaseOrFallback();
    if (!supabase) {
      const store = loadLocalStore();
      await persistLocalStore({
        users: store.users.map((u) => u.id === userId ? { ...u, lastLoginAt: timestamp } : u),
        logins: store.logins,
        activities: store.activities
      });
      return;
    }
    const { error } = await supabase.from("users").update({ last_login_at: timestamp }).eq("id", userId);
    if (error) handleSupabaseError(error, "Failed to record login timestamp");
  },
  async recordLogin(entry) {
    const supabase = requireSupabaseOrFallback();
    if (!supabase) {
      const store = loadLocalStore();
      await persistLocalStore({
        users: store.users,
        logins: [entry, ...store.logins],
        activities: store.activities
      });
      return;
    }
    const { error } = await supabase.from("user_logins").insert({
      id: entry.id,
      user_id: entry.userId,
      email: entry.email,
      event_type: entry.eventType,
      token_jti: entry.tokenJti ?? null,
      user_agent: entry.userAgent ?? null,
      logged_in_at: entry.loggedInAt,
      logged_out_at: entry.loggedOutAt ?? null
    });
    if (error) handleSupabaseError(error, "Failed to record user login event");
  },
  async markLogout(tokenJti, timestamp) {
    const supabase = requireSupabaseOrFallback();
    if (!supabase) {
      const store = loadLocalStore();
      await persistLocalStore({
        users: store.users,
        logins: store.logins.map(
          (l) => l.tokenJti === tokenJti ? { ...l, loggedOutAt: timestamp } : l
        ),
        activities: store.activities
      });
      return;
    }
    const { error } = await supabase.from("user_logins").update({ logged_out_at: timestamp }).eq("token_jti", tokenJti);
    if (error) handleSupabaseError(error, "Failed to update logout timestamp");
  },
  async listLoginsByUser(userId, limit = 10) {
    const supabase = requireSupabaseOrFallback();
    if (!supabase) {
      const store = loadLocalStore();
      return store.logins.filter((l) => l.userId === userId).sort((a, b) => b.loggedInAt - a.loggedInAt).slice(0, limit);
    }
    const { data, error } = await supabase.from("user_logins").select("id, user_id, email, event_type, user_agent, logged_in_at, logged_out_at").eq("user_id", userId).order("logged_in_at", { ascending: false }).limit(limit);
    if (error) handleSupabaseError(error, "Failed to load sign-in history");
    return (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      email: row.email,
      eventType: row.event_type,
      userAgent: row.user_agent || void 0,
      loggedInAt: Number(row.logged_in_at),
      loggedOutAt: row.logged_out_at != null ? Number(row.logged_out_at) : void 0
    }));
  },
  async updateUserProfile(userId, updates) {
    const supabase = requireSupabaseOrFallback();
    if (!supabase) {
      const store = loadLocalStore();
      const existing = store.users.find((u) => u.id === userId);
      if (!existing) return null;
      const updatedUser = { ...existing, ...updates };
      await persistLocalStore({
        users: store.users.map((u) => u.id === userId ? updatedUser : u),
        logins: store.logins,
        activities: store.activities
      });
      return updatedUser;
    }
    const payload = {};
    if ("name" in updates) payload.name = updates.name;
    if ("subtitle" in updates) payload.subtitle = updates.subtitle;
    if ("avatarUrl" in updates) payload.avatar_url = updates.avatarUrl ?? null;
    if ("presetAvatar" in updates) payload.preset_avatar = updates.presetAvatar ?? null;
    if ("dailyGoalMinutes" in updates) payload.daily_goal_minutes = updates.dailyGoalMinutes;
    if ("defaultActivity" in updates) payload.default_activity = updates.defaultActivity;
    const { data, error } = await supabase.from("users").update(payload).eq("id", userId).select("*").maybeSingle();
    if (error) handleSupabaseError(error, "Failed to update profile");
    return data ? mapUserRow(data) : null;
  },
  async listActivitiesByUser(userId) {
    const supabase = requireSupabaseOrFallback();
    if (!supabase) {
      const store = loadLocalStore();
      return store.activities.filter((a) => a.userId === userId).sort((a, b) => {
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        return dateDiff !== 0 ? dateDiff : b.createdAt - a.createdAt;
      });
    }
    const { data, error } = await supabase.from("activities").select("*").eq("user_id", userId).order("date", { ascending: false }).order("created_at", { ascending: false });
    if (error) handleSupabaseError(error, "Failed to load activities");
    return (data || []).map(mapActivityRow);
  },
  async createActivity(activity) {
    const supabase = requireSupabaseOrFallback();
    if (!supabase) {
      const store = loadLocalStore();
      await persistLocalStore({
        users: store.users,
        logins: store.logins,
        activities: [activity, ...store.activities]
      });
      return activity;
    }
    let includeCategory = true;
    let createdAtAsIso = false;
    let lastError = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error } = await supabase.from("activities").insert(toActivityInsertRow(activity, { includeCategory, createdAtAsIso })).select("*").single();
      if (!error) {
        const mapped = mapActivityRow(data);
        if (!includeCategory) mapped.category = activity.category || "Cardio";
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
    handleSupabaseError(lastError, "Failed to save activity");
  },
  async findActivityByIdAndUser(id, userId) {
    const supabase = requireSupabaseOrFallback();
    if (!supabase) {
      const store = loadLocalStore();
      return store.activities.find((a) => a.id === id && a.userId === userId) || null;
    }
    const { data, error } = await supabase.from("activities").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
    if (error) handleSupabaseError(error, "Failed to look up activity");
    return data ? mapActivityRow(data) : null;
  },
  async updateActivity(id, userId, updates) {
    const supabase = requireSupabaseOrFallback();
    if (!supabase) {
      const store = loadLocalStore();
      const existing = store.activities.find((a) => a.id === id && a.userId === userId);
      if (!existing) return null;
      const updated = { ...existing, ...updates };
      await persistLocalStore({
        users: store.users,
        logins: store.logins,
        activities: store.activities.map((a) => a.id === id && a.userId === userId ? updated : a)
      });
      return updated;
    }
    const payload = {};
    if ("name" in updates) payload.name = updates.name;
    if ("date" in updates) payload.date = updates.date;
    if ("durationMinutes" in updates) payload.duration_minutes = updates.durationMinutes;
    if ("status" in updates) payload.status = updates.status;
    if ("category" in updates) payload.category = updates.category;
    if ("description" in updates) payload.description = updates.description;
    let { data, error } = await supabase.from("activities").update(payload).eq("id", id).eq("user_id", userId).select("*").maybeSingle();
    if (error && "category" in payload && isMissingCategoryError(error)) {
      const { category: _omit, ...withoutCategory } = payload;
      const retry = await supabase.from("activities").update(withoutCategory).eq("id", id).eq("user_id", userId).select("*").maybeSingle();
      data = retry.data;
      error = retry.error;
    }
    if (error) handleSupabaseError(error, "Failed to update activity");
    return data ? mapActivityRow(data) : null;
  },
  async deleteActivity(id, userId) {
    const supabase = requireSupabaseOrFallback();
    if (!supabase) {
      const store = loadLocalStore();
      const existing = store.activities.find((a) => a.id === id && a.userId === userId);
      if (!existing) return false;
      await persistLocalStore({
        users: store.users,
        logins: store.logins,
        activities: store.activities.filter((a) => !(a.id === id && a.userId === userId))
      });
      return true;
    }
    const { data, error } = await supabase.from("activities").delete().eq("id", id).eq("user_id", userId).select("id");
    if (error) handleSupabaseError(error, "Failed to delete activity");
    return Array.isArray(data) && data.length > 0;
  },
  async replaceUserActivities(userId, activities) {
    const supabase = requireSupabaseOrFallback();
    if (!supabase) {
      const store = loadLocalStore();
      const otherUsersActivities = store.activities.filter((a) => a.userId !== userId);
      await persistLocalStore({
        users: store.users,
        logins: store.logins,
        activities: [...activities, ...otherUsersActivities]
      });
      return activities;
    }
    const { error: deleteError } = await supabase.from("activities").delete().eq("user_id", userId);
    if (deleteError) handleSupabaseError(deleteError, "Failed to reset user activities");
    if (activities.length === 0) return [];
    let includeCategory = true;
    let createdAtAsIso = false;
    let lastError = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const rows = activities.map(
        (a) => toActivityInsertRow(
          { ...a, userId },
          { includeCategory, createdAtAsIso }
        )
      );
      const { data, error: insertError } = await supabase.from("activities").insert(rows).select("*");
      if (!insertError) {
        return (data || []).map((row, idx) => {
          const mapped = mapActivityRow(row);
          if (!includeCategory && activities[idx]) {
            mapped.category = activities[idx].category || "Cardio";
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
    handleSupabaseError(lastError, "Failed to insert starter activities");
  },
  async syncUserProfile(user, options) {
    const supabase = requireSupabaseOrFallback();
    const meta = buildAuthUserMetadata(user);
    const now = Date.now();
    if (!supabase) {
      const store = loadLocalStore();
      const existing = store.profiles.find(
        (p) => p.appUserId === user.id || p.email.toLowerCase() === user.email.toLowerCase()
      );
      const profile = {
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
        lastLoginAt: options?.isLogin ? user.lastLoginAt || now : existing?.lastLoginAt ?? user.lastLoginAt
      };
      const nextProfiles = existing ? store.profiles.map((p) => p.id === existing.id ? profile : p) : [profile, ...store.profiles];
      await persistLocalStore({ profiles: nextProfiles });
      return profile;
    }
    const { data: profileByAppId, error: lookupByAppError } = await supabase.from("profiles").select("id").eq("app_user_id", user.id).maybeSingle();
    if (lookupByAppError) {
      handleSupabaseError(lookupByAppError, "Failed to query profiles table");
    }
    let authUserId = profileByAppId?.id || null;
    if (!authUserId) {
      const { data: profileByEmail, error: lookupByEmailError } = await supabase.from("profiles").select("id").eq("email", user.email).limit(1).maybeSingle();
      if (lookupByEmailError) {
        handleSupabaseError(lookupByEmailError, "Failed to query profiles table");
      }
      authUserId = profileByEmail?.id || null;
    }
    if (!authUserId) {
      if (options?.password) {
        const { data: createdAuth, error: createAuthError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: options.password,
          email_confirm: true,
          user_metadata: meta
        });
        if (!createAuthError && createdAuth?.user?.id) {
          authUserId = createdAuth.user.id;
        } else {
          if (createAuthError && !createAuthError.message.toLowerCase().includes("already")) {
            console.warn("Supabase Auth createUser warning:", createAuthError.message);
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
      user_metadata: meta
    });
    if (updateAuthError) {
      console.warn("Supabase Auth metadata update warning:", updateAuthError.message);
    }
    const upsertPayload = {
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
      updated_at: new Date(now).toISOString()
    };
    if (user.lastLoginAt != null) {
      upsertPayload.last_login_at = new Date(user.lastLoginAt).toISOString();
    }
    const { data: savedProfile, error: upsertError } = await supabase.from("profiles").upsert(upsertPayload, { onConflict: "id" }).select("*").single();
    if (upsertError) {
      handleSupabaseError(upsertError, "Failed to sync user profile row");
    }
    const row = savedProfile;
    return {
      id: String(row.id),
      appUserId: String(row.app_user_id || user.id),
      email: String(row.email || user.email),
      name: String(row.name || user.name),
      fullName: String(row.full_name || row.name || user.name),
      subtitle: String(row.subtitle || user.subtitle),
      presetAvatar: typeof row.preset_avatar === "string" ? row.preset_avatar : void 0,
      avatarUrl: typeof row.avatar_url === "string" ? row.avatar_url : void 0,
      dailyGoalMinutes: Number(row.daily_goal_minutes) || user.dailyGoalMinutes,
      defaultActivity: String(row.default_activity || user.defaultActivity),
      rawUserMetaData: row.raw_user_meta_data || meta,
      createdAt: parseEpochMs(row.created_at),
      updatedAt: parseEpochMs(row.updated_at),
      lastLoginAt: row.last_login_at != null ? parseEpochMs(row.last_login_at) : void 0
    };
  },
  async getProfileByUserId(userId) {
    const supabase = requireSupabaseOrFallback();
    if (!supabase) {
      const store = loadLocalStore();
      return store.profiles.find((p) => p.appUserId === userId) || null;
    }
    const { data, error } = await supabase.from("profiles").select("*").eq("app_user_id", userId).maybeSingle();
    if (error) handleSupabaseError(error, "Failed to load profile");
    if (!data) return null;
    const row = data;
    return {
      id: String(row.id),
      appUserId: String(row.app_user_id || userId),
      email: String(row.email || ""),
      name: String(row.name || ""),
      fullName: String(row.full_name || row.name || ""),
      subtitle: String(row.subtitle || ""),
      presetAvatar: typeof row.preset_avatar === "string" ? row.preset_avatar : void 0,
      avatarUrl: typeof row.avatar_url === "string" ? row.avatar_url : void 0,
      dailyGoalMinutes: Number(row.daily_goal_minutes) || 60,
      defaultActivity: String(row.default_activity || "Running"),
      rawUserMetaData: row.raw_user_meta_data || {},
      createdAt: parseEpochMs(row.created_at),
      updatedAt: parseEpochMs(row.updated_at),
      lastLoginAt: row.last_login_at != null ? parseEpochMs(row.last_login_at) : void 0
    };
  }
};

// serverApp.ts
dotenv2.config();
var app = express();
app.use(express.json({ limit: "3mb" }));
if (process.env.VERCEL && process.env.NODE_ENV !== "test") {
  verifySupabaseConnection({ log: true }).catch((err) => {
    console.error("[Supabase Diagnostic] Cold-start verification error:", err);
  });
}
var SESSION_SECRET = process.env.SESSION_SECRET || crypto2.randomBytes(32).toString("hex");
if (process.env.VERCEL && !process.env.SESSION_SECRET) {
  console.warn(
    "Warning: SESSION_SECRET is not set in Vercel environment variables. Set SESSION_SECRET so auth tokens stay valid across serverless invocations."
  );
}
var TOKEN_TTL_SECONDS = 60 * 60 * 24;
var revokedTokens = /* @__PURE__ */ new Map();
function pruneRevokedTokens() {
  const nowSec = Math.floor(Date.now() / 1e3);
  for (const [jti, exp] of revokedTokens.entries()) {
    if (exp <= nowSec) {
      revokedTokens.delete(jti);
    }
  }
}
function hashPassword(password, existingSalt) {
  return new Promise((resolve, reject) => {
    const salt = existingSalt || crypto2.randomBytes(16).toString("hex");
    crypto2.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
      if (err) return reject(err);
      resolve({ salt, hash: derivedKey.toString("hex") });
    });
  });
}
async function verifyPassword(password, salt, storedHash) {
  const { hash } = await hashPassword(password, salt);
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(storedHash, "hex");
  if (a.length !== b.length) return false;
  return crypto2.timingSafeEqual(a, b);
}
function toBase64Url(input) {
  return Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function fromBase64Url(input) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4;
  const padded = pad ? normalized + "=".repeat(4 - pad) : normalized;
  return Buffer.from(padded, "base64").toString("utf-8");
}
function signAuthToken(user) {
  const nowSec = Math.floor(Date.now() / 1e3);
  const jti = crypto2.randomUUID();
  const header = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = toBase64Url(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      jti,
      iat: nowSec,
      exp: nowSec + TOKEN_TTL_SECONDS
    })
  );
  const signingInput = `${header}.${payload}`;
  const signature = toBase64Url(
    crypto2.createHmac("sha256", SESSION_SECRET).update(signingInput).digest()
  );
  return { token: `${signingInput}.${signature}`, jti };
}
function verifyAuthToken(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts;
    const signingInput = `${headerB64}.${payloadB64}`;
    const expectedSig = toBase64Url(
      crypto2.createHmac("sha256", SESSION_SECRET).update(signingInput).digest()
    );
    const sigBuf = Buffer.from(sigB64);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length || !crypto2.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }
    const payload = JSON.parse(fromBase64Url(payloadB64));
    const nowSec = Math.floor(Date.now() / 1e3);
    if (!payload || typeof payload.sub !== "string" || typeof payload.exp !== "number" || payload.exp <= nowSec) {
      return null;
    }
    pruneRevokedTokens();
    if (typeof payload.jti === "string" && revokedTokens.has(payload.jti)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
function sanitizeUser(user) {
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
    lastLoginAt: user.lastLoginAt
  };
}
var EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
var VALID_STATUSES = /* @__PURE__ */ new Set(["Completed", "Ongoing", "Not Started"]);
var VALID_CATEGORIES = /* @__PURE__ */ new Set(["Cardio", "Strength", "Flexibility", "Sports", "Recovery", "Other"]);
function validatePasswordStrength(password) {
  if (!password) {
    return "Password is required.";
  }
  if (password.length < 8) {
    return "Password must be at least 8 characters long.";
  }
  if (password.length > 128) {
    return "Password must be 128 characters or fewer.";
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must include at least one letter and one number.";
  }
  return null;
}
function isSafeAvatarDataUrl(url) {
  return /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(url) && url.length <= 25e5;
}
function inferCategory(name) {
  const n = (name || "").toLowerCase();
  if (n.includes("run") || n.includes("cycl") || n.includes("swim") || n.includes("walk") || n.includes("cardio") || n.includes("jog")) return "Cardio";
  if (n.includes("gym") || n.includes("lift") || n.includes("strength") || n.includes("press") || n.includes("workout") || n.includes("crossfit")) return "Strength";
  if (n.includes("yoga") || n.includes("stretch") || n.includes("pilates") || n.includes("flex")) return "Flexibility";
  if (n.includes("sport") || n.includes("basket") || n.includes("soccer") || n.includes("tennis")) return "Sports";
  if (n.includes("recover") || n.includes("sauna") || n.includes("rest")) return "Recovery";
  return "Cardio";
}
function respondRouteError(res, err, fallbackMessage) {
  if (err instanceof DatabaseSetupError) {
    return res.status(503).json({ error: err.message });
  }
  console.error(fallbackMessage, err);
  return res.status(500).json({ error: fallbackMessage });
}
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    const token = authHeader.slice(7).trim();
    const decoded = verifyAuthToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Your session has expired or is invalid. Please log in again." });
    }
    const user = await db.findUserById(decoded.sub);
    if (!user) {
      return res.status(401).json({ error: "Account not found. Please log in again." });
    }
    req.user = user;
    req.tokenJti = decoded.jti;
    req.tokenExp = decoded.exp;
    return next();
  } catch (err) {
    return respondRouteError(res, err, "Unable to verify session right now.");
  }
}
app.get("/api/status", async (_req, res) => {
  try {
    const diagnostics = await verifySupabaseConnection({ log: false });
    let storage = diagnostics.urlLoaded && diagnostics.keyLoaded ? "supabase" : "unconfigured";
    let tablesReady = diagnostics.tablesReady;
    if (!diagnostics.urlLoaded && !diagnostics.keyLoaded) {
      const health = await db.checkHealth();
      storage = health.storage;
      tablesReady = health.tablesReady;
    }
    const isReady = storage === "supabase" && diagnostics.ok && diagnostics.tablesReady || storage === "local" && tablesReady;
    return res.json({
      ok: true,
      status: isReady ? "ready" : "needs_setup",
      version: "2.0.0",
      storage,
      tablesReady,
      ...diagnostics.error ? { message: diagnostics.error } : {},
      diagnostics: {
        urlLoaded: diagnostics.urlLoaded,
        keyLoaded: diagnostics.keyLoaded,
        urlSource: diagnostics.urlSource,
        keySource: diagnostics.keySource,
        resolvedUrl: diagnostics.resolvedUrl,
        keyFormat: diagnostics.keyFormat,
        connectionActive: diagnostics.connectionActive,
        authValid: diagnostics.authValid,
        missingTables: diagnostics.missingTables,
        error: diagnostics.error,
        checkedAt: diagnostics.checkedAt
      }
    });
  } catch (err) {
    return res.json({
      ok: true,
      status: "needs_setup",
      version: "2.0.0",
      storage: isSupabaseConfigured() ? "supabase" : "unconfigured",
      tablesReady: false,
      ...err instanceof DatabaseSetupError ? { message: err.message } : {}
    });
  }
});
app.post("/api/auth/signup", async (req, res) => {
  try {
    const rawName = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const rawEmail = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const rawPassword = typeof req.body?.password === "string" ? req.body.password : "";
    const fieldErrors = {};
    if (!rawName) {
      fieldErrors.name = "Full name is required.";
    } else if (rawName.length > 80) {
      fieldErrors.name = "Name must be 80 characters or fewer.";
    }
    if (!rawEmail) {
      fieldErrors.email = "Email address is required.";
    } else if (!EMAIL_REGEX.test(rawEmail) || rawEmail.length > 254) {
      fieldErrors.email = "Please enter a valid email address.";
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
        error: "An account with this email already exists.",
        fieldErrors: { email: "An account with this email already exists." }
      });
    }
    const now = Date.now();
    const { salt, hash } = await hashPassword(rawPassword);
    const newUser = {
      id: `usr_${crypto2.randomUUID()}`,
      email: rawEmail,
      name: rawName,
      subtitle: "Building a consistent routine",
      dailyGoalMinutes: 60,
      defaultActivity: "Running",
      passwordHash: hash,
      passwordSalt: salt,
      createdAt: now,
      lastLoginAt: now
    };
    const savedUser = await db.createUser(newUser);
    const { token, jti } = signAuthToken(savedUser);
    const userAgent = typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"].slice(0, 200) : void 0;
    await Promise.all([
      db.recordLogin({
        id: `lgn_${crypto2.randomUUID()}`,
        userId: savedUser.id,
        email: savedUser.email,
        eventType: "signup",
        tokenJti: jti,
        userAgent,
        loggedInAt: now
      }),
      db.syncUserProfile(savedUser, { password: rawPassword, isLogin: true })
    ]);
    return res.status(201).json({ token, user: sanitizeUser(savedUser) });
  } catch (err) {
    return respondRouteError(res, err, "Unable to create account right now. Please try again.");
  }
});
app.post("/api/auth/login", async (req, res) => {
  try {
    const rawEmail = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const rawPassword = typeof req.body?.password === "string" ? req.body.password : "";
    const fieldErrors = {};
    if (!rawEmail) {
      fieldErrors.email = "Email address is required.";
    } else if (!EMAIL_REGEX.test(rawEmail)) {
      fieldErrors.email = "Please enter a valid email address.";
    }
    if (!rawPassword) {
      fieldErrors.password = "Password is required.";
    }
    if (Object.keys(fieldErrors).length > 0) {
      return res.status(400).json({ error: Object.values(fieldErrors)[0], fieldErrors });
    }
    const user = await db.findUserByEmail(rawEmail);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    const isMatch = await verifyPassword(rawPassword, user.passwordSalt, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    const loginTime = Date.now();
    const { token, jti } = signAuthToken(user);
    const userAgent = typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"].slice(0, 200) : void 0;
    const updatedUserWithLogin = { ...user, lastLoginAt: loginTime };
    await Promise.all([
      db.updateLastLogin(user.id, loginTime),
      db.recordLogin({
        id: `lgn_${crypto2.randomUUID()}`,
        userId: user.id,
        email: user.email,
        eventType: "login",
        tokenJti: jti,
        userAgent,
        loggedInAt: loginTime
      }),
      db.syncUserProfile(updatedUserWithLogin, { password: rawPassword, isLogin: true })
    ]);
    return res.json({ token, user: sanitizeUser(updatedUserWithLogin) });
  } catch (err) {
    return respondRouteError(res, err, "Unable to log in right now. Please try again.");
  }
});
app.post("/api/auth/logout", async (req, res) => {
  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    const decoded = verifyAuthToken(token);
    if (decoded?.jti && decoded?.exp) {
      revokedTokens.set(decoded.jti, decoded.exp);
      try {
        await db.markLogout(decoded.jti, Date.now());
      } catch (err) {
        console.warn("Could not persist logout timestamp:", err.message);
      }
    }
  }
  return res.json({ success: true });
});
app.get("/api/auth/me", requireAuth, (req, res) => {
  return res.json({ user: sanitizeUser(req.user) });
});
app.get("/api/auth/logins", requireAuth, async (req, res) => {
  try {
    const logins = await db.listLoginsByUser(req.user.id, 8);
    return res.json({
      logins: logins.map((item) => ({
        id: item.id,
        eventType: item.eventType,
        userAgent: item.userAgent,
        loggedInAt: item.loggedInAt,
        loggedOutAt: item.loggedOutAt
      }))
    });
  } catch (err) {
    return respondRouteError(res, err, "Unable to load sign-in history.");
  }
});
app.put("/api/profile", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const existing = await db.findUserById(userId);
    if (!existing) {
      return res.status(404).json({ error: "User not found." });
    }
    const { name, subtitle, presetAvatar, avatarUrl, dailyGoalMinutes, defaultActivity } = req.body || {};
    let nextName = existing.name;
    if (name !== void 0) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ error: "Name cannot be empty." });
      }
      nextName = name.trim().slice(0, 80);
    }
    let nextSubtitle = existing.subtitle;
    if (subtitle !== void 0 && typeof subtitle === "string") {
      nextSubtitle = subtitle.trim().slice(0, 140) || "Stay active, stay healthy!";
    }
    let nextAvatarUrl = existing.avatarUrl;
    if (avatarUrl !== void 0) {
      if (avatarUrl === null || avatarUrl === "") {
        nextAvatarUrl = void 0;
      } else if (typeof avatarUrl === "string" && isSafeAvatarDataUrl(avatarUrl)) {
        nextAvatarUrl = avatarUrl;
      } else {
        return res.status(400).json({ error: "Invalid avatar image format or file too large." });
      }
    }
    let nextPresetAvatar = existing.presetAvatar;
    if (presetAvatar !== void 0) {
      nextPresetAvatar = typeof presetAvatar === "string" && presetAvatar.trim() ? presetAvatar.trim().slice(0, 40) : void 0;
    }
    let nextDailyGoal = existing.dailyGoalMinutes;
    if (dailyGoalMinutes !== void 0) {
      const parsed = Number(dailyGoalMinutes);
      if (isNaN(parsed) || parsed < 10 || parsed > 300) {
        return res.status(400).json({ error: "Daily goal must be between 10 and 300 minutes." });
      }
      nextDailyGoal = Math.round(parsed);
    }
    let nextDefaultActivity = existing.defaultActivity;
    if (defaultActivity !== void 0 && typeof defaultActivity === "string" && defaultActivity.trim()) {
      nextDefaultActivity = defaultActivity.trim().slice(0, 60);
    }
    const updatedUser = await db.updateUserProfile(userId, {
      name: nextName,
      subtitle: nextSubtitle,
      avatarUrl: nextAvatarUrl,
      presetAvatar: nextPresetAvatar,
      dailyGoalMinutes: nextDailyGoal,
      defaultActivity: nextDefaultActivity
    });
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found." });
    }
    await db.syncUserProfile(updatedUser);
    return res.json({ user: sanitizeUser(updatedUser) });
  } catch (err) {
    return respondRouteError(res, err, "Unable to update profile.");
  }
});
app.get("/api/activities", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userActivities = await db.listActivitiesByUser(userId);
    return res.json({ activities: userActivities });
  } catch (err) {
    return respondRouteError(res, err, "Unable to load activities.");
  }
});
app.post("/api/activities", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, date, durationMinutes, status, category, description } = req.body || {};
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Activity name is required." });
    }
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "A valid date (YYYY-MM-DD) is required." });
    }
    const parsedDuration = Number(durationMinutes);
    if (!parsedDuration || isNaN(parsedDuration) || parsedDuration <= 0 || parsedDuration > 1440) {
      return res.status(400).json({ error: "Duration must be between 1 and 1440 minutes." });
    }
    const safeStatus = VALID_STATUSES.has(status) ? status : "Not Started";
    const safeCategory = VALID_CATEGORIES.has(category) ? category : inferCategory(name);
    const newActivity = {
      id: crypto2.randomUUID(),
      userId,
      name: name.trim().slice(0, 100),
      date,
      durationMinutes: Math.round(parsedDuration),
      status: safeStatus,
      category: safeCategory,
      description: typeof description === "string" ? description.trim().slice(0, 500) : "",
      createdAt: Date.now()
    };
    const created = await db.createActivity(newActivity);
    return res.status(201).json({ activity: created });
  } catch (err) {
    return respondRouteError(res, err, "Unable to save activity.");
  }
});
app.put("/api/activities/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const existing = await db.findActivityByIdAndUser(id, userId);
    if (!existing) {
      return res.status(404).json({ error: "Activity not found." });
    }
    const { name, date, durationMinutes, status, category, description } = req.body || {};
    if (name !== void 0 && (typeof name !== "string" || !name.trim())) {
      return res.status(400).json({ error: "Activity name cannot be empty." });
    }
    if (date !== void 0 && (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date))) {
      return res.status(400).json({ error: "Invalid date format." });
    }
    if (durationMinutes !== void 0) {
      const parsedDuration = Number(durationMinutes);
      if (isNaN(parsedDuration) || parsedDuration <= 0 || parsedDuration > 1440) {
        return res.status(400).json({ error: "Duration must be between 1 and 1440 minutes." });
      }
    }
    const updated = await db.updateActivity(id, userId, {
      ...name !== void 0 && { name: name.trim().slice(0, 100) },
      ...date !== void 0 && { date },
      ...durationMinutes !== void 0 && { durationMinutes: Math.round(Number(durationMinutes)) },
      ...status !== void 0 && VALID_STATUSES.has(status) && { status },
      ...category !== void 0 && VALID_CATEGORIES.has(category) && { category },
      ...description !== void 0 && typeof description === "string" && { description: description.trim().slice(0, 500) }
    });
    if (!updated) {
      return res.status(404).json({ error: "Activity not found." });
    }
    return res.json({ activity: updated });
  } catch (err) {
    return respondRouteError(res, err, "Unable to update activity.");
  }
});
app.delete("/api/activities/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const deleted = await db.deleteActivity(id, userId);
    if (!deleted) {
      return res.status(404).json({ error: "Activity not found." });
    }
    return res.json({ success: true });
  } catch (err) {
    return respondRouteError(res, err, "Unable to delete activity.");
  }
});
app.post("/api/activities/seed", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = /* @__PURE__ */ new Date();
    const formatOffsetDate = (daysAgo) => {
      const d = new Date(today.getTime() - daysAgo * 864e5);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };
    const starterTemplates = [
      {
        name: "Morning Run",
        date: formatOffsetDate(0),
        durationMinutes: 30,
        status: "Completed",
        category: "Cardio",
        description: "Brisk 5km morning run around the park."
      },
      {
        name: "Strength Training",
        date: formatOffsetDate(1),
        durationMinutes: 50,
        status: "Completed",
        category: "Strength",
        description: "Upper body strength session with compound lifts."
      },
      {
        name: "Evening Cycling",
        date: formatOffsetDate(1),
        durationMinutes: 45,
        status: "Ongoing",
        category: "Cardio",
        description: "Steady endurance ride along the riverside trail."
      },
      {
        name: "Restorative Yoga",
        date: formatOffsetDate(2),
        durationMinutes: 40,
        status: "Not Started",
        category: "Flexibility",
        description: "Evening mobility and recovery flow."
      }
    ];
    const created = starterTemplates.map((item, idx) => ({
      ...item,
      id: crypto2.randomUUID(),
      userId,
      createdAt: Date.now() - idx * 1e3
    }));
    const inserted = await db.replaceUserActivities(userId, created);
    return res.json({ activities: inserted });
  } catch (err) {
    return respondRouteError(res, err, "Unable to load sample activities.");
  }
});
app.use("/api", (_req, res) => {
  return res.status(404).json({ error: "API endpoint not found." });
});
app.use((err, _req, res, _next) => {
  console.error("Unhandled API error:", err);
  if (res.headersSent) return;
  if (err instanceof DatabaseSetupError) {
    return res.status(503).json({ error: err.message });
  }
  return res.status(500).json({ error: "Internal server error. Please try again." });
});
export {
  app
};
