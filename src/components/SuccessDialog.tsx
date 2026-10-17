import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface SuccessDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export const SuccessDialog: React.FC<SuccessDialogProps> = ({
  isOpen,
  title,
  message,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center scale-in-95 duration-200 transition-colors">
        {/* Animated Green/Blue Check Icon */}
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 ring-8 ring-emerald-50/50 dark:ring-emerald-950/30">
          <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          {title}
        </h3>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          {message}
        </p>

        <button
          id="success-dialog-ok-btn"
          onClick={onClose}
          className="w-full mt-6 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all cursor-pointer"
        >
          OK
        </button>
      </div>
    </div>
  );
};
