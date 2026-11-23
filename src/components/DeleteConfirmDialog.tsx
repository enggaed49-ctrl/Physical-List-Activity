import React from 'react';
import { Trash2 } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center transition-colors">
        <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
          <Trash2 className="w-6 h-6 stroke-[2]" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Delete Activity
        </h3>

        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            &lsquo;{activityName}&rsquo;
          </span>
          ? This action cannot be undone.
        </p>

        <div className="w-full mt-6 space-y-2.5">
          <button
            id="delete-confirm-btn"
            type="button"
            onClick={onConfirm}
            className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Activity</span>
          </button>

          <button
            id="delete-cancel-btn"
            type="button"
            onClick={onCancel}
            className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-[0.99] text-slate-700 dark:text-slate-200 font-semibold text-sm border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
