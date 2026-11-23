import React from 'react';
import { X, Activity, Heart, ShieldCheck, Check } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center space-y-4 transition-colors">
        <div className="w-full flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Activity className="w-8 h-8" />
        </div>

        <div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Physical List
          </h3>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            Version 2.0 • Personal Activity Workspace
          </p>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs">
          A responsive fitness tracking web application designed for both desktop multi-column analysis and ergonomic single-hand mobile logging.
        </p>

        <div className="w-full bg-slate-50 dark:bg-slate-800/80 rounded-xl p-3.5 text-left space-y-2.5 text-xs border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-200 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Private accounts with isolated personal data</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-200 font-medium">
            <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>Full activity management &amp; live workout timer</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-200 font-medium">
            <Heart className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
            <span>Weekly, monthly, and yearly progress insights</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full min-h-[48px] py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm cursor-pointer transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
