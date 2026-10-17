import React, { useState } from 'react';
import { X, RotateCcw, Volume2, Bell, Smartphone, Moon, Sun, Timer } from 'lucide-react';

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
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Settings</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-3 text-xs">
          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/80 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                {isDarkMode ? (
                  <Moon className="w-4 h-4 fill-blue-500/20" />
                ) : (
                  <Sun className="w-4 h-4" />
                )}
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-100">Dark Mode</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-400">
                  {isDarkMode ? 'Dark theme active' : 'Light theme active'}
                </p>
              </div>
            </div>
            <button
              id="settings-dark-mode-toggle"
              onClick={() => onToggleDarkMode(!isDarkMode)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                isDarkMode ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
              aria-label="Toggle Dark Mode"
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  isDarkMode ? 'left-6' : 'left-1'
                }`}
              ></div>
            </button>
          </div>

          {/* Default Quick Start Activity */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/80 transition-colors space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Timer className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-100">Quick Start Default</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-400">Default workout for 1-tap timer</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-lg">
                {defaultActivity}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {DEFAULT_ACTIVITY_CHOICES.map((act) => (
                <button
                  key={act}
                  onClick={() => onSetDefaultActivity && onSetDefaultActivity(act)}
                  className={`py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                    defaultActivity === act
                      ? 'bg-blue-600 text-white shadow-xs scale-[1.02]'
                      : 'bg-white dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {act}
                </button>
              ))}
            </div>
          </div>

          {/* Sound & Haptics */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/80 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-100">Sound & Effects</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-400">Play celebratory effects on save</p>
              </div>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                soundEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  soundEnabled ? 'left-6' : 'left-1'
                }`}
              ></div>
            </button>
          </div>

          {/* Daily Reminders */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/80 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-100">Daily Reminders</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-400">Prompt for daily activity entry</p>
              </div>
            </div>
            <button
              onClick={() => setReminders(!reminders)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                reminders ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  reminders ? 'left-6' : 'left-1'
                }`}
              ></div>
            </button>
          </div>

          {/* Measurement Units */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/80 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-100">Measurement Unit</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-400">Distance & energy formats</p>
              </div>
            </div>
            <div className="flex bg-slate-200 dark:bg-slate-700 p-0.5 rounded-xl">
              <button
                onClick={() => setUnit('metric')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                  unit === 'metric'
                    ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Metric (km)
              </button>
              <button
                onClick={() => setUnit('imperial')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                  unit === 'imperial'
                    ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Miles
              </button>
            </div>
          </div>

          {/* Reset Sample Activities */}
          <div className="p-3 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
            {!confirmReset ? (
              <button
                onClick={() => setConfirmReset(true)}
                className="w-full flex items-center justify-between text-rose-600 dark:text-rose-400 font-bold"
              >
                <span className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  <span>Restore Sample Activities</span>
                </span>
                <span className="text-[10px] underline">Reset</span>
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-rose-700 dark:text-rose-300 font-medium">
                  Reset activities list back to default sample records?
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onResetData();
                      setConfirmReset(false);
                      onClose();
                    }}
                    className="flex-1 py-1.5 bg-rose-600 text-white rounded-xl font-bold text-xs hover:bg-rose-700"
                  >
                    Confirm Reset
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Done Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20"
        >
          Close
        </button>
      </div>
    </div>
  );
};

