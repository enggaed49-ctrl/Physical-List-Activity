import React from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  activityName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  activityName,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center transition-colors">
        {/* Warning Icon */}
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 ring-8 ring-rose-50/50 dark:ring-rose-950/30">
          <Trash2 className="w-7 h-7 stroke-[2]" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Delete Activity
        </h3>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          Are you sure you want to delete <span className="font-semibold text-slate-800 dark:text-slate-200">‘{activityName}’</span>?
        </p>

        <div className="w-full mt-6 space-y-2">
          {/* Red Delete Button */}
          <button
            id="delete-confirm-btn"
            onClick={onConfirm}
            className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-rose-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>

          {/* White / Outlined Cancel Button */}
          <button
            id="delete-cancel-btn"
            onClick={onCancel}
            className="w-full py-2.5 px-4 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 active:scale-[0.98] text-slate-700 dark:text-slate-200 font-semibold text-sm border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
