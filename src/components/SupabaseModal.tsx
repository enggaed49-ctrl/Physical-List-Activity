import React, { useState } from 'react';
import { X, Database, CheckCircle2, AlertCircle, Copy, Check, RefreshCw, Terminal, ExternalLink } from 'lucide-react';
import { CloudSyncStatus } from '../types';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: CloudSyncStatus;
  onRefreshStatus: () => Promise<void>;
}

export const SUPABASE_SQL_CODE = `-- 1. Create enum for activity status
DO $$ BEGIN
    CREATE TYPE activity_status AS ENUM ('Completed', 'Ongoing', 'Not Started');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create the activities table
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    date DATE NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    status activity_status NOT NULL DEFAULT 'Not Started',
    category TEXT DEFAULT 'Cardio',
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure category column exists for existing tables
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Cardio';

-- 3. Create helpful indexes
CREATE INDEX IF NOT EXISTS idx_activities_date ON public.activities(date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_status ON public.activities(status);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- 5. Create policies for OPEN ACCESS (Guest / Public user)
DROP POLICY IF EXISTS "Allow public read access" ON public.activities;
CREATE POLICY "Allow public read access"
ON public.activities FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public insert access" ON public.activities;
CREATE POLICY "Allow public insert access"
ON public.activities FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access" ON public.activities;
CREATE POLICY "Allow public update access"
ON public.activities FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete access" ON public.activities;
CREATE POLICY "Allow public delete access"
ON public.activities FOR DELETE TO public USING (true);

-- 6. Insert sample activities
INSERT INTO public.activities (name, date, duration_minutes, status, category, description)
VALUES 
  ('Morning Run', '2025-04-26', 30, 'Completed', 'Cardio', 'Brisk 5km morning run around the park. Felt energetic and refreshed!'),
  ('Workout', '2025-04-25', 60, 'Completed', 'Strength', 'Full body strength training session focusing on chest and triceps.'),
  ('Cycling', '2025-04-25', 45, 'Ongoing', 'Cardio', 'Evening ride along the scenic riverside trail. Halfway done.'),
  ('Yoga', '2025-04-23', 60, 'Not Started', 'Flexibility', 'Planned restorative Vinyasa flow for flexibility and mental calm.'),
  ('Swimming', '2025-04-22', 40, 'Not Started', 'Cardio', 'Lap swimming session scheduled at the community recreation pool.')
ON CONFLICT DO NOTHING;`;

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  status,
  onRefreshStatus,
}) => {
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCheck = async () => {
    setChecking(true);
    await onRefreshStatus();
    setChecking(false);
  };

  const isFullyConnected = status.connected && status.tableExists;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm max-h-[92%] bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col space-y-4 overflow-hidden transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Supabase Cloud Sync</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Project: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{status.projectId}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="space-y-3 overflow-y-auto pr-1 text-xs flex-1">
          {/* Status Card */}
          <div className={`p-3 rounded-2xl border ${
            isFullyConnected 
              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300' 
              : status.connected
              ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300' 
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
          }`}>
            <div className="flex items-start gap-2.5">
              {isFullyConnected ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${status.connected ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`} />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-xs">
                    {isFullyConnected 
                      ? 'Cloud Database Synced' 
                      : status.connected 
                      ? 'SQL Table Setup Needed' 
                      : 'Offline Local Mode'}
                  </p>
                  <button
                    onClick={handleCheck}
                    disabled={checking}
                    className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${checking ? 'animate-spin' : ''}`} />
                    <span>Check</span>
                  </button>
                </div>
                <p className="text-[11px] mt-1 leading-relaxed opacity-90">
                  {status.message || (isFullyConnected ? 'All activities are automatically synced in real time.' : 'Using local storage until table is ready.')}
                </p>
              </div>
            </div>
          </div>

          {/* Quick instructions if table not yet created */}
          {!isFullyConnected && (
            <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-900/50 text-blue-900 dark:text-blue-300 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-xs text-blue-800 dark:text-blue-300">
                <Terminal className="w-3.5 h-3.5" />
                <span>How to finish setup:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-blue-900/90 dark:text-blue-300/90 pl-1 leading-relaxed">
                <li>Open your <strong>Supabase Dashboard</strong>.</li>
                <li>Go to the <strong>SQL Editor</strong> tab on the left.</li>
                <li>Paste the SQL script below and click <strong>Run</strong>.</li>
                <li>Click <strong>Check</strong> above to verify connection!</li>
              </ol>
            </div>
          )}

          {/* SQL Preview Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Supabase SQL Schema</span>
              <button
                onClick={handleCopySql}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[10px] font-bold transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-700 dark:text-emerald-300">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy SQL</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-2.5 bg-slate-900 dark:bg-slate-950 text-emerald-400 font-mono text-[10px] rounded-xl overflow-x-auto max-h-36 leading-relaxed select-all border border-slate-800">
              {SUPABASE_SQL_CODE}
            </pre>
          </div>

          {/* Direct Supabase Link */}
          <a
            href={`https://supabase.com/dashboard/project/${status.projectId}/sql`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <span>Open Supabase SQL Editor</span>
            <ExternalLink className="w-3 h-3 text-slate-400 dark:text-slate-500" />
          </a>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
