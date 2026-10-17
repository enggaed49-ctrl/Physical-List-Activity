import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3000;
const app = express();
app.use(express.json());

// -------------------------------------------------------------
// Supabase configuration & robust URL sanitization
// -------------------------------------------------------------
const DEFAULT_SUPABASE_PROJECT_ID = 'kfgaxqydqswciypgydde';
const DEFAULT_SUPABASE_URL = `https://${DEFAULT_SUPABASE_PROJECT_ID}.supabase.co`;
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmZ2F4cXlkcXN3Y2l5cGd5ZGRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxODgwMzEsImV4cCI6MjEwNDc2NDAzMX0.HmK1BuF9Fh_EhPdJKeAeK7Dfxww1bwyxFU_fAhns04s';

function resolveSupabaseUrl(rawUrl?: string): string {
  let cleaned = (rawUrl || '').trim();
  // Strip enclosing quotes if present (e.g. from env strings)
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  // If empty, undefined, or placeholder
  if (!cleaned || cleaned === 'undefined' || cleaned === 'null' || cleaned.toLowerCase().includes('your_supabase')) {
    return DEFAULT_SUPABASE_URL;
  }

  // Already a full http or https URL
  if (/^https?:\/\//i.test(cleaned)) {
    return cleaned.replace(/\/+$/, '');
  }

  // Domain with .supabase.co or other domain without protocol
  if (cleaned.includes('.')) {
    return `https://${cleaned.replace(/\/+$/, '')}`;
  }

  // Just project reference slug (e.g. "kfgaxqydqswciypgydde")
  return `https://${cleaned}.supabase.co`;
}

function resolveSupabaseKey(rawKey?: string): string {
  let cleaned = (rawKey || '').trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  if (!cleaned || cleaned === 'undefined' || cleaned === 'null' || cleaned.length < 20) {
    return DEFAULT_SUPABASE_KEY;
  }
  return cleaned;
}

function extractProjectId(url: string): string {
  try {
    const parsed = new URL(url);
    const hostParts = parsed.hostname.split('.');
    if (hostParts.length > 0 && hostParts[0]) {
      return hostParts[0];
    }
  } catch {
    // fallback
  }
  return DEFAULT_SUPABASE_PROJECT_ID;
}

const SUPABASE_URL = resolveSupabaseUrl(process.env.SUPABASE_URL);
const SUPABASE_KEY = resolveSupabaseKey(process.env.SUPABASE_ANON_KEY);
const PROJECT_ID = extractProjectId(SUPABASE_URL);

let supabaseClient: any = null;
let hasLoggedInit = false;

function getSupabase(): any {
  if (supabaseClient) return supabaseClient;
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;

  try {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    if (!hasLoggedInit) {
      console.log(`Supabase client initialized: project [${PROJECT_ID}] (${SUPABASE_URL})`);
      hasLoggedInit = true;
    }
  } catch (err: any) {
    if (!hasLoggedInit) {
      console.warn('Supabase initialization warning:', err?.message || err);
      hasLoggedInit = true;
    }
    supabaseClient = null;
  }
  return supabaseClient;
}

// -------------------------------------------------------------
// In-Memory Storage Fallback (instant responses when offline)
// -------------------------------------------------------------
const INITIAL_SERVER_ACTIVITIES = [
  {
    id: 'act-1',
    name: 'Morning Run',
    date: '2025-04-26',
    durationMinutes: 30,
    status: 'Completed',
    category: 'Cardio',
    description: 'Brisk 5km morning run around the park. Felt energetic and refreshed!',
    createdAt: new Date('2025-04-26T07:30:00').getTime(),
  },
  {
    id: 'act-2',
    name: 'Workout',
    date: '2025-04-25',
    durationMinutes: 60,
    status: 'Completed',
    category: 'Strength',
    description: 'Full body strength training session focusing on chest and triceps.',
    createdAt: new Date('2025-04-25T17:00:00').getTime(),
  },
  {
    id: 'act-3',
    name: 'Cycling',
    date: '2025-04-25',
    durationMinutes: 45,
    status: 'Ongoing',
    category: 'Cardio',
    description: 'Evening ride along the scenic riverside trail. Halfway done.',
    createdAt: new Date('2025-04-25T18:30:00').getTime(),
  },
  {
    id: 'act-4',
    name: 'Yoga',
    date: '2025-04-23',
    durationMinutes: 60,
    status: 'Not Started',
    category: 'Flexibility',
    description: 'Planned restorative Vinyasa flow for flexibility and mental calm.',
    createdAt: new Date('2025-04-23T08:00:00').getTime(),
  },
  {
    id: 'act-5',
    name: 'Swimming',
    date: '2025-04-22',
    durationMinutes: 40,
    status: 'Not Started',
    category: 'Cardio',
    description: 'Lap swimming session scheduled at the community recreation pool.',
    createdAt: new Date('2025-04-22T16:00:00').getTime(),
  },
];

let inMemoryActivities = [...INITIAL_SERVER_ACTIVITIES];
let lastCloudFailure = 0;
const CLOUD_FAILURE_COOLDOWN_MS = 20000;

// Helper to run promises with strict timeout to prevent slow DNS or network delays
function withTimeout(promise: any, ms = 1500): Promise<any> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
  });
  return Promise.race([
    Promise.resolve(promise).then((res) => {
      clearTimeout(timer);
      return res;
    }),
    timeoutPromise,
  ]);
}

function inferCategory(name: string): string {
  const n = (name || '').toLowerCase();
  if (n.includes('run') || n.includes('cycl') || n.includes('swim') || n.includes('walk') || n.includes('cardio') || n.includes('jog')) return 'Cardio';
  if (n.includes('gym') || n.includes('lift') || n.includes('strength') || n.includes('press') || n.includes('workout') || n.includes('crossfit')) return 'Strength';
  if (n.includes('yoga') || n.includes('stretch') || n.includes('pilates') || n.includes('flex')) return 'Flexibility';
  if (n.includes('sport') || n.includes('basket') || n.includes('soccer') || n.includes('tennis')) return 'Sports';
  return 'Cardio';
}

// Map database record to front-end Activity model
function mapDbToActivity(row: any) {
  return {
    id: String(row.id),
    name: row.name,
    date: row.date,
    durationMinutes: Number(row.duration_minutes ?? row.durationMinutes ?? 0),
    status: row.status,
    category: row.category || inferCategory(row.name),
    description: row.description || '',
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  };
}

// -------------------------------------------------------------
// API Routes
// -------------------------------------------------------------

// 1. Health & Supabase Connection Status Check
app.get('/api/status', async (_req, res) => {
  const client = getSupabase();
  if (!client) {
    return res.json({
      connected: false,
      tableExists: false,
      projectId: PROJECT_ID,
      message: 'Supabase credentials missing or invalid. Running in local storage mode.',
    });
  }

  try {
    const queryPromise = client.from('activities').select('id').limit(1);
    const { data: _data, error } = await withTimeout(queryPromise, 1800);

    if (error) {
      const isTableMissing = error.code === '42P01' || error.message?.includes('does not exist');
      lastCloudFailure = 0; // Host is reachable
      return res.json({
        connected: true,
        tableExists: !isTableMissing,
        projectId: PROJECT_ID,
        errorCode: error.code,
        message: isTableMissing
          ? "Supabase connected! The 'activities' table has not been created yet. Please execute the SQL in Supabase SQL editor."
          : `Supabase error: ${error.message}`,
      });
    }

    lastCloudFailure = 0;
    return res.json({
      connected: true,
      tableExists: true,
      projectId: PROJECT_ID,
      message: 'Connected to Supabase successfully with active activities table!',
    });
  } catch (err: any) {
    lastCloudFailure = Date.now();
    // Graceful offline fallback: do not crash or block
    return res.json({
      connected: false,
      tableExists: false,
      projectId: PROJECT_ID,
      message: 'Running in offline mode (local storage active). Supabase host unreachable or pending setup.',
    });
  }
});

// 2. GET all activities
app.get('/api/activities', async (_req, res) => {
  const isCooldown = Date.now() - lastCloudFailure < CLOUD_FAILURE_COOLDOWN_MS;
  const client = isCooldown ? null : getSupabase();

  if (client) {
    try {
      const queryPromise = client
        .from('activities')
        .select('*')
        .order('date', { ascending: false });
      const { data, error } = await withTimeout(queryPromise, 1800);

      if (!error && Array.isArray(data)) {
        const formatted = data.map(mapDbToActivity);
        inMemoryActivities = formatted; // sync in-memory cache
        lastCloudFailure = 0;
        return res.json({ activities: formatted, mode: 'cloud' });
      }
    } catch {
      lastCloudFailure = Date.now();
      // Cloud query failed or timed out; fall back seamlessly to in-memory store
    }
  }

  // Return local in-memory activities immediately
  return res.json({ activities: inMemoryActivities, mode: 'local' });
});

// 3. POST new activity
app.post('/api/activities', async (req, res) => {
  const { name, date, durationMinutes, status, category, description } = req.body;
  if (!name || !date || !durationMinutes) {
    return res.status(400).json({ error: 'Missing required activity fields (name, date, durationMinutes)' });
  }

  const isCooldown = Date.now() - lastCloudFailure < CLOUD_FAILURE_COOLDOWN_MS;
  const client = isCooldown ? null : getSupabase();
  if (client) {
    try {
      const chosenCategory = category || inferCategory(name);
      const payload: any = {
        name,
        date,
        duration_minutes: Number(durationMinutes),
        status: status || 'Not Started',
        category: chosenCategory,
        description: description || '',
      };

      let queryPromise = client
        .from('activities')
        .insert([payload])
        .select()
        .single();
      let resPromise = await withTimeout(queryPromise, 2500);

      // If remote table schema is missing the 'category' column (PGRST204), retry without it
      if (resPromise.error && (resPromise.error.code === 'PGRST204' || resPromise.error.message?.includes('category'))) {
        const payloadWithoutCategory = { ...payload };
        delete payloadWithoutCategory.category;
        queryPromise = client
          .from('activities')
          .insert([payloadWithoutCategory])
          .select()
          .single();
        resPromise = await withTimeout(queryPromise, 2500);
      }

      if (!resPromise.error && resPromise.data) {
        const activity = {
          ...mapDbToActivity(resPromise.data),
          category: chosenCategory,
        };
        inMemoryActivities.unshift(activity);
        lastCloudFailure = 0;
        return res.status(201).json({ activity, mode: 'cloud' });
      }
    } catch {
      lastCloudFailure = Date.now();
      // Fall through to local fallback
    }
  }

  // Local fallback
  const newActivity = {
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name,
    date,
    durationMinutes: Number(durationMinutes),
    status: status || 'Not Started',
    category: category || inferCategory(name),
    description: description || '',
    createdAt: Date.now(),
  };
  inMemoryActivities.unshift(newActivity);
  return res.status(201).json({ activity: newActivity, mode: 'local' });
});

// 4. PUT update activity
app.put('/api/activities/:id', async (req, res) => {
  const { id } = req.params;
  const { name, date, durationMinutes, status, category, description } = req.body;

  const isCooldown = Date.now() - lastCloudFailure < CLOUD_FAILURE_COOLDOWN_MS;
  const client = isCooldown ? null : getSupabase();
  if (client) {
    try {
      const updatePayload: any = {};
      if (name !== undefined) updatePayload.name = name;
      if (date !== undefined) updatePayload.date = date;
      if (durationMinutes !== undefined) updatePayload.duration_minutes = Number(durationMinutes);
      if (status !== undefined) updatePayload.status = status;
      if (category !== undefined) updatePayload.category = category;
      if (description !== undefined) updatePayload.description = description;

      let queryPromise = client
        .from('activities')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();
      let resPromise = await withTimeout(queryPromise, 2500);

      // If remote table schema is missing the 'category' column (PGRST204), retry without it
      if (resPromise.error && (resPromise.error.code === 'PGRST204' || resPromise.error.message?.includes('category'))) {
        const updateWithoutCategory = { ...updatePayload };
        delete updateWithoutCategory.category;
        queryPromise = client
          .from('activities')
          .update(updateWithoutCategory)
          .eq('id', id)
          .select()
          .single();
        resPromise = await withTimeout(queryPromise, 2500);
      }

      if (!resPromise.error && resPromise.data) {
        const activity = {
          ...mapDbToActivity(resPromise.data),
          category: category !== undefined ? category : mapDbToActivity(resPromise.data).category,
        };
        inMemoryActivities = inMemoryActivities.map((a) => (a.id === id ? activity : a));
        lastCloudFailure = 0;
        return res.json({ activity, mode: 'cloud' });
      }
    } catch {
      lastCloudFailure = Date.now();
      // Fall through to local
    }
  }

  // Local update
  let updatedActivity = inMemoryActivities.find((a) => a.id === id);
  if (updatedActivity) {
    updatedActivity = {
      ...updatedActivity,
      ...(name !== undefined && { name }),
      ...(date !== undefined && { date }),
      ...(durationMinutes !== undefined && { durationMinutes: Number(durationMinutes) }),
      ...(status !== undefined && { status }),
      ...(category !== undefined && { category }),
      ...(description !== undefined && { description }),
    };
    inMemoryActivities = inMemoryActivities.map((a) => (a.id === id ? updatedActivity! : a));
  } else {
    updatedActivity = {
      id,
      name: name || 'Activity',
      date: date || new Date().toISOString().split('T')[0],
      durationMinutes: Number(durationMinutes || 30),
      status: status || 'Not Started',
      category: category || 'Cardio',
      description: description || '',
      createdAt: Date.now(),
    };
    inMemoryActivities.push(updatedActivity);
  }

  return res.json({ activity: updatedActivity, mode: 'local' });
});

// 5. DELETE activity
app.delete('/api/activities/:id', async (req, res) => {
  const { id } = req.params;

  const isCooldown = Date.now() - lastCloudFailure < CLOUD_FAILURE_COOLDOWN_MS;
  const client = isCooldown ? null : getSupabase();
  if (client) {
    try {
      const queryPromise = client
        .from('activities')
        .delete()
        .eq('id', id);
      const { error } = await withTimeout(queryPromise, 1800);

      if (!error) {
        inMemoryActivities = inMemoryActivities.filter((a) => a.id !== id);
        lastCloudFailure = 0;
        return res.json({ success: true, mode: 'cloud' });
      }
    } catch {
      lastCloudFailure = Date.now();
      // Fall through to local
    }
  }

  inMemoryActivities = inMemoryActivities.filter((a) => a.id !== id);
  return res.json({ success: true, mode: 'local' });
});

// 6. POST seed sample data
app.post('/api/activities/seed', async (_req, res) => {
  const client = getSupabase();

  if (client) {
    try {
      const sampleActivities = [
        {
          name: 'Morning Run',
          date: '2025-04-26',
          duration_minutes: 30,
          status: 'Completed',
          category: 'Cardio',
          description: 'Brisk 5km morning run around the park. Felt energetic and refreshed!',
        },
        {
          name: 'Workout',
          date: '2025-04-25',
          duration_minutes: 60,
          status: 'Completed',
          category: 'Strength',
          description: 'Full body strength training session focusing on chest and triceps.',
        },
        {
          name: 'Cycling',
          date: '2025-04-25',
          duration_minutes: 45,
          status: 'Ongoing',
          category: 'Cardio',
          description: 'Evening ride along the scenic riverside trail. Halfway done.',
        },
        {
          name: 'Yoga',
          date: '2025-04-23',
          duration_minutes: 60,
          status: 'Not Started',
          category: 'Flexibility',
          description: 'Planned restorative Vinyasa flow for flexibility and mental calm.',
        },
        {
          name: 'Swimming',
          date: '2025-04-22',
          duration_minutes: 40,
          status: 'Not Started',
          category: 'Cardio',
          description: 'Lap swimming session scheduled at the community recreation pool.',
        },
      ];

      let queryPromise = client
        .from('activities')
        .insert(sampleActivities)
        .select();
      let resPromise = await withTimeout(queryPromise, 3000);

      if (resPromise.error && (resPromise.error.code === 'PGRST204' || resPromise.error.message?.includes('category'))) {
        const withoutCategory = sampleActivities.map(({ category: _, ...rest }) => rest);
        queryPromise = client
          .from('activities')
          .insert(withoutCategory)
          .select();
        resPromise = await withTimeout(queryPromise, 3000);
      }

      if (!resPromise.error && Array.isArray(resPromise.data)) {
        const formatted = resPromise.data.map(mapDbToActivity);
        inMemoryActivities = formatted;
        return res.json({ activities: formatted, mode: 'cloud' });
      }
    } catch {
      // Fall through to local
    }
  }

  inMemoryActivities = [...INITIAL_SERVER_ACTIVITIES];
  return res.json({ activities: inMemoryActivities, mode: 'local' });
});

// -------------------------------------------------------------
// Vite Middleware / Static Serving
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Physical List Activity server running on http://localhost:${PORT}`);
  });
}

startServer();
