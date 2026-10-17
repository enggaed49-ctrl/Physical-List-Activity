import React from 'react';
import { X, Activity, Heart, ShieldCheck, Check } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center space-y-4 transition-colors">
        {/* Close Button */}
        <div className="w-full flex justify-end">
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Icon */}
        <div className="w-16 h-16 rounded-3xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 ring-8 ring-blue-50 dark:ring-blue-950/40">
          <Activity className="w-9 h-9" />
        </div>

        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            Physical List Activity System
          </h3>
          <span className="inline-block mt-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50">
            Version 1.0.0
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
          A modern, accessible Android fitness activity tracking system designed to help users record, track, manage, and complete their daily physical workouts with ease.
        </p>

        <div className="w-full bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-3 text-left space-y-2 text-xs border border-slate-100 dark:border-slate-750">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Open To All Users (No Login Required)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium">
            <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>Complete CRUD (Add, View, Edit, Delete)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium">
            <Heart className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
            <span>Local persistence & Instant access</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 cursor-pointer"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
