import React from 'react';
import { ArrowRight, Activity, Zap, ShieldCheck, Sparkles } from 'lucide-react';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted }) => {
  return (
    <div className="flex-1 flex flex-col justify-between p-6 bg-gradient-to-b from-blue-50/70 via-white to-blue-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 overflow-y-auto transition-colors">
      {/* Top Brand Tag */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold tracking-wider text-blue-700 dark:text-blue-400 uppercase">
            Activity Track
          </span>
        </div>
        <div className="px-2.5 py-1 rounded-full bg-blue-100/70 dark:bg-blue-950/60 text-[11px] font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1 border border-transparent dark:border-blue-800/50">
          <Sparkles className="w-3 h-3" />
          <span>Open to All</span>
        </div>
      </div>

      {/* Hero Illustration / Icon Area */}
      <div className="my-auto py-6 flex flex-col items-center text-center">
        {/* Modern Vector Graphic */}
        <div className="relative w-64 h-64 flex items-center justify-center mb-6">
          {/* Decorative soft circles */}
          <div className="absolute inset-0 rounded-full bg-blue-100/50 dark:bg-blue-950/30 blur-2xl animate-pulse"></div>
          <div className="absolute w-52 h-52 rounded-full border-2 border-dashed border-blue-200/80 dark:border-blue-800/50 animate-[spin_30s_linear_infinite]"></div>
          <div className="absolute w-40 h-40 rounded-3xl bg-blue-600/5 dark:bg-blue-400/5 rotate-12"></div>
          <div className="absolute w-40 h-40 rounded-3xl bg-blue-500/10 dark:bg-blue-400/10 -rotate-6"></div>

          {/* Central Fitness Vector Badge */}
          <div className="relative z-10 w-36 h-36 rounded-3xl bg-gradient-to-tr from-blue-600 to-sky-500 flex flex-col items-center justify-center text-white shadow-xl shadow-blue-500/25 ring-8 ring-blue-50 dark:ring-slate-800">
            {/* SVG Runner & Activity silhouette */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-16 h-16"
            >
              <circle cx="12" cy="5" r="2" />
              <path d="M16 11l-2-2-3 1-3-2-2 3" />
              <path d="M12 14v4l-3 3" />
              <path d="M12 14l3 3 3-1" />
            </svg>
            <span className="text-[11px] font-bold mt-1 tracking-wider uppercase opacity-90">
              Active Life
            </span>
          </div>

          {/* Floating Pill Badges */}
          <div className="absolute -top-1 right-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-2xl shadow-md border border-blue-100 dark:border-slate-700 flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 animate-bounce">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Stay Fit</span>
          </div>

          <div className="absolute -bottom-2 left-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-2xl shadow-md border border-blue-100 dark:border-slate-700 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>100% Free</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
          Physical List <br />
          <span className="text-blue-600 dark:text-blue-400">Activity System</span>
        </h1>
      </div>

      {/* Bottom Action Area */}
      <div className="w-full pb-4">
        <button
          id="welcome-get-started-btn"
          onClick={onGetStarted}
          className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-base shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all group cursor-pointer"
        >
          <span>Get Started</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
