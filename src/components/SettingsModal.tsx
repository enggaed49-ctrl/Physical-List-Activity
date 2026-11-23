import React, { useState } from 'react';
import { X, RotateCcw, Moon, Sun, Timer } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetData: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: (val: boolean) => void;
  defaultActivity?: string;
  onSetDefaultActivity?: (activity: string) => void;
}

const DEFAULT_ACTIVITY_CHOICES = ['Running', 'Gym', 'Cycling', 'Yoga', 'Swimming', 'Walking'];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onResetData,
  isDarkMode,
  onToggleDarkMode,
  defaultActivity = 'Running',
  onSetDefaultActivity,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Preferences</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preferences"
            className="min-h-[44px] min-w-[44px] -mr-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center gap-3">
              {isDarkMode ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Dark Mode</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isDarkMode ? 'Dark surface active' : 'Light surface active'}
                </p>
              </div>
            </div>
            <button
              id="settings-dark-mode-toggle"
              type="button"
              onClick={() => onToggleDarkMode(!isDarkMode)}
              className={`min-h-[40px] px-3.5 rounded-lg text-xs font-semibold cursor-pointer ${
                isDarkMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200'
              }`}
            >
              {isDarkMode ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Quick Start Default Activity */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center gap-2.5">
              <Timer className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Quick Start Activity</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Default workout for your live timer</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {DEFAULT_ACTIVITY_CHOICES.map((act) => (
                <button
                  key={act}
                  type="button"
                  onClick={() => onSetDefaultActivity && onSetDefaultActivity(act)}
                  className={`min-h-[40px] px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    defaultActivity === act
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
                  }`}
                >
                  {act}
                </button>
              ))}
            </div>
          </div>

          {/* Load Starter Activities */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80">
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="w-full min-h-[40px] flex items-center justify-between text-sm font-semibold text-rose-600 dark:text-rose-400 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  <span>Load Starter Sample Activities</span>
                </span>
                <span className="text-xs underline">Replace list</span>
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Replace your current activity list with 4 starter sample records?
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onResetData();
                      setConfirmReset(false);
                      onClose();
                    }}
                    className="flex-1 min-h-[44px] bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold text-xs cursor-pointer"
                  >
                    Confirm Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="min-h-[44px] px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full min-h-[48px] bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
};
