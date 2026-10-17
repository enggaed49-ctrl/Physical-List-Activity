import React, { useState } from 'react';
import { X, Copy, Check, FileText, Sparkles, Clock, CheckCircle2 } from 'lucide-react';

interface DemoScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DEMO_SCRIPT_SECTIONS = [
  {
    step: '1',
    duration: '1 min',
    title: 'Introduction & Problem Statement',
    cue: 'Show Welcome Splash / Home Header',
    notes: 'Welcome the audience. Introduce "Physical List Activity" as a modern, distraction-free fitness and habit tracker that solves the issue of bloated apps and poor offline capability.'
  },
  {
    step: '2',
    duration: '1.5 min',
    title: 'Home Dashboard & Today’s Highlights',
    cue: 'Show Home Screen on mobile frame',
    notes: 'Walk through today’s active streak, daily goal progress ring, total minutes summary, and color-coded status badges (Green = Completed, Amber = Ongoing, Slate = Not Started).'
  },
  {
    step: '3',
    duration: '1.5 min',
    title: 'Live Workout Stopwatch & Mini-Timer',
    cue: 'Tap Play on an activity card',
    notes: 'Start live workout session. Demonstrate real-time stopwatch, record a split lap, minimize to floating bottom mini-timer, browse other screens, and tap "Finish Workout" to trigger victory confetti!'
  },
  {
    step: '4',
    duration: '1.5 min',
    title: 'Activity Management (Search, Filters, CRUD)',
    cue: 'Navigate to "Activities" tab',
    notes: 'Demonstrate live search by name, filter chips by category (Cardio, Strength, Flexibility), create a new workout via "+", edit notes or duration, and show delete confirmation.'
  },
  {
    step: '5',
    duration: '1 min',
    title: 'Visual Analytics & Charts',
    cue: 'Navigate to "Stats" tab',
    notes: 'Show weekly activity bar chart, category distribution breakdown, average daily duration, and completion rate metrics.'
  },
  {
    step: '6',
    duration: '1 min',
    title: 'User Profile, Avatar Image & Settings',
    cue: 'Navigate to "Profile" tab',
    notes: 'Tap profile photo to show image upload or preset avatar selection. Adjust daily goal minute slider. Toggle dark/light theme in settings.'
  },
  {
    step: '7',
    duration: '1 min',
    title: 'Cloud Sync & Offline-First Architecture',
    cue: 'Open Cloud Database icon / modal',
    notes: 'Explain seamless Supabase PostgreSQL synchronization when online and uninterrupted local persistence when offline.'
  }
];

export const FULL_SCRIPT_TEXT = `# Physical List Activity – Demo Script

1. Intro (1 min):
"Welcome everyone! Today we present Physical List Activity—a mobile-responsive fitness and wellness tracker designed to make staying active effortless, motivating, and beautifully visual."

2. Home Dashboard (1.5 min):
"Here on the Home Dashboard, users get an instant snapshot of today's streak, goal progress, and scheduled activities categorized by status."

3. Live Workout Mode (1.5 min):
"Standout feature: The interactive stopwatch mode tracks active workouts with split laps and can be docked as a floating mini-timer while navigating the app."

4. Activity Management (1.5 min):
"Under My Activities, users can quickly search, filter by category or status, and create or edit activities in real time."

5. Statistics & Analytics (1 min):
"The Stats screen visualizes weekly activity trends, workout category splits, and daily completion metrics."

6. Profile & Customization (1 min):
"Users can upload custom profile photos or choose athletic avatars, set daily minute targets, and switch themes."

7. Cloud Sync & Architecture (1 min):
"Built with an offline-first architecture powered by Supabase and local caching for uninterrupted tracking anytime, anywhere."`;

export const DemoScriptModal: React.FC<DemoScriptModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(FULL_SCRIPT_TEXT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm max-h-[92%] bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col space-y-4 overflow-hidden transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Presentation Demo Script</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Step-by-step presentation walkthrough</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action button to copy */}
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Target: ~5-7 minutes</span>
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[10px] font-bold transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-300">Copied Script!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy Full Script</span>
              </>
            )}
          </button>
        </div>

        {/* Scrollable Script Steps */}
        <div className="space-y-2.5 overflow-y-auto pr-1 text-xs flex-1">
          {DEMO_SCRIPT_SECTIONS.map((sec) => (
            <div
              key={sec.step}
              className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                    {sec.step}
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-[11px]">
                    {sec.title}
                  </span>
                </div>
                <span className="text-[9px] font-medium text-slate-400 dark:text-slate-400 flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {sec.duration}
                </span>
              </div>

              <div className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold bg-blue-50/80 dark:bg-blue-950/40 px-2 py-0.5 rounded-md inline-block">
                🎬 Cue: {sec.cue}
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed pt-0.5">
                {sec.notes}
              </p>
            </div>
          ))}

          {/* Quick Tip Box */}
          <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-300 space-y-1">
            <div className="flex items-center gap-1 font-bold text-[11px] text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Presenter Pro-Tip:</span>
            </div>
            <p className="text-[10px] text-emerald-800/90 dark:text-emerald-300/90 leading-relaxed">
              Show the live workout stopwatch, minimize it to the floating mini-timer, and then finish it to reveal the confetti celebration—judges love interactive UI details!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 cursor-pointer"
          >
            Close Script
          </button>
        </div>
      </div>
    </div>
  );
};
