import React, { useState } from 'react';
import {
  Play,
  Pause,
  Square,
  Flag,
  Minimize2,
  X,
  Flame,
  Check,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { WorkoutSession } from '../types';
import { getActivityIcon } from '../utils/activityIcons';

interface ActiveWorkoutModalProps {
  session: WorkoutSession;
  isOpen: boolean;
  isMinimized: boolean;
  onTogglePause: () => void;
  onRecordLap: () => void;
  onFinish: (notes?: string, customName?: string) => void;
  onDiscard: () => void;
  onToggleMinimize: () => void;
  onChangeActivityName: (name: string) => void;
}

const ACTIVITY_OPTIONS = ['Running', 'Gym', 'Cycling', 'Yoga', 'Swimming', 'Walking'];

function estimateCalories(activityName: string, seconds: number): number {
  const mins = seconds / 60;
  const lower = activityName.toLowerCase();
  let calPerMin = 7;
  if (lower.includes('run')) calPerMin = 11;
  else if (lower.includes('gym') || lower.includes('work') || lower.includes('lift')) calPerMin = 8;
  else if (lower.includes('cycl') || lower.includes('bike')) calPerMin = 9;
  else if (lower.includes('swim')) calPerMin = 10;
  else if (lower.includes('yoga') || lower.includes('stretch')) calPerMin = 4;
  else if (lower.includes('walk')) calPerMin = 4.5;
  return Math.round(mins * calPerMin);
}

export function formatStopwatch(totalSeconds: number): {
  formatted: string;
  hours?: string;
  minutes: string;
  seconds: string;
} {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');

  if (hrs > 0) {
    const hh = String(hrs).padStart(2, '0');
    return { formatted: `${hh}:${mm}:${ss}`, hours: hh, minutes: mm, seconds: ss };
  }
  return { formatted: `${mm}:${ss}`, minutes: mm, seconds: ss };
}

export const ActiveWorkoutModal: React.FC<ActiveWorkoutModalProps> = ({
  session,
  isOpen,
  isMinimized,
  onTogglePause,
  onRecordLap,
  onFinish,
  onDiscard,
  onToggleMinimize,
  onChangeActivityName,
}) => {
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [notes, setNotes] = useState('');
  const [isChangingType, setIsChangingType] = useState(false);

  if (!isOpen || isMinimized) return null;

  const { minutes, seconds, hours } = formatStopwatch(session.secondsElapsed);
  const estCalories = estimateCalories(session.activityName, session.secondsElapsed);
  const durationMinutes = Math.max(1, Math.round(session.secondsElapsed / 60));

  const handleFinishSave = () => {
    onFinish(notes.trim() || undefined, session.activityName);
    setShowFinishConfirm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center md:p-6 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full h-full md:h-auto md:max-h-[90vh] md:max-w-lg md:rounded-3xl md:border md:border-slate-800 bg-slate-950 text-white flex flex-col overflow-hidden shadow-2xl">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex rounded-full h-2.5 w-2.5 ${
                session.isPaused ? 'bg-amber-400' : 'bg-emerald-500'
              }`}
            />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {session.isPaused ? 'Workout Paused' : 'Live Workout Session'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleMinimize}
              title="Minimize Timer"
              aria-label="Minimize Timer"
              className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowDiscardConfirm(true)}
              title="Discard Workout"
              aria-label="Discard Workout"
              className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col items-center justify-between px-6 py-6 overflow-y-auto">
          <div className="w-full flex flex-col items-center">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsChangingType(!isChangingType)}
                className="min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-200 hover:bg-blue-600/30 transition-all cursor-pointer"
              >
                <span className="p-1 rounded-lg bg-blue-500/30 text-blue-200">
                  {getActivityIcon(session.activityName)}
                </span>
                <span className="font-bold text-sm text-white tracking-wide">
                  {session.activityName}
                </span>
                <ChevronDown className="w-4 h-4 text-blue-300" />
              </button>

              {isChangingType && (
                <div className="absolute top-13 left-1/2 -translate-x-1/2 z-20 w-48 bg-slate-900 border border-slate-700 rounded-2xl p-1.5 shadow-2xl">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2.5 py-1.5">
                    Change Activity
                  </p>
                  <div className="space-y-0.5">
                    {ACTIVITY_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          onChangeActivityName(opt);
                          setIsChangingType(false);
                        }}
                        className={`w-full min-h-[40px] flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                          session.activityName === opt
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span className="w-4 h-4 flex items-center justify-center">
                          {getActivityIcon(opt)}
                        </span>
                        <span>{opt}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-400 mt-2 font-medium">
              Quick Workout Session
            </p>
          </div>

          {/* Circular Display */}
          <div className="relative my-5 flex items-center justify-center">
            <div className="w-60 h-60 rounded-full border-4 border-slate-800 bg-slate-900/90 shadow-2xl flex flex-col items-center justify-center relative p-6">
              <span className="text-[11px] font-bold tracking-widest uppercase text-blue-400 mb-1">
                Elapsed Time
              </span>

              <div className="flex items-baseline font-mono tabular-nums text-white tracking-tight">
                {hours && (
                  <>
                    <span className="text-4xl font-black">{hours}</span>
                    <span className="text-2xl font-bold text-slate-500 mx-1">:</span>
                  </>
                )}
                <span className="text-5xl font-black">{minutes}</span>
                <span className="text-3xl font-bold text-slate-500 mx-1">:</span>
                <span className="text-5xl font-black">{seconds}</span>
              </div>

              <span className="mt-2 text-xs font-semibold text-slate-300">
                {session.isPaused ? 'Paused' : 'Recording'}
              </span>

              <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-300 font-semibold">
                <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="tabular-nums">~{estCalories} kcal burned</span>
              </div>
            </div>
          </div>

          {/* Metrics Bar */}
          <div className="w-full grid grid-cols-3 gap-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-3 text-center">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Duration</p>
              <p className="text-base font-extrabold tabular-nums text-white mt-0.5">
                {durationMinutes} <span className="text-xs font-normal text-slate-400">min</span>
              </p>
            </div>
            <div className="border-x border-slate-800">
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Calories</p>
              <p className="text-base font-extrabold tabular-nums text-amber-400 mt-0.5">
                {estCalories} <span className="text-xs font-normal text-slate-400">kcal</span>
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Laps</p>
              <p className="text-base font-extrabold tabular-nums text-sky-400 mt-0.5">
                {session.laps.length}
              </p>
            </div>
          </div>

          {session.laps.length > 0 && (
            <div className="w-full mt-3 max-h-24 overflow-y-auto bg-slate-900/50 rounded-xl p-2 border border-slate-800 space-y-1 text-xs">
              {session.laps
                .slice()
                .reverse()
                .map((lap) => (
                  <div
                    key={lap.lapNumber}
                    className="flex items-center justify-between text-slate-300 px-2 py-0.5 tabular-nums"
                  >
                    <span className="font-semibold text-slate-400">Lap {lap.lapNumber}</span>
                    <span className="font-mono">{formatStopwatch(lap.splitSeconds).formatted}</span>
                    <span className="font-mono text-slate-500">
                      +{formatStopwatch(lap.timeSeconds).formatted}
                    </span>
                  </div>
                ))}
            </div>
          )}

          {/* Bottom Control Buttons */}
          <div className="w-full space-y-3 pt-5">
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={onRecordLap}
                disabled={session.isPaused}
                className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all ${
                  session.isPaused
                    ? 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
                    : 'bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 cursor-pointer shadow-md'
                }`}
              >
                <Flag className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase">Lap</span>
              </button>

              <button
                id="workout-pause-resume-btn"
                type="button"
                onClick={onTogglePause}
                className={`w-20 h-20 rounded-3xl flex flex-col items-center justify-center gap-1 font-bold text-white shadow-xl active:scale-95 transition-all cursor-pointer ${
                  session.isPaused
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-amber-500 hover:bg-amber-400'
                }`}
              >
                {session.isPaused ? (
                  <>
                    <Play className="w-7 h-7 fill-white translate-x-0.5" />
                    <span className="text-[10px] uppercase tracking-wider">Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-7 h-7 fill-white" />
                    <span className="text-[10px] uppercase tracking-wider">Pause</span>
                  </>
                )}
              </button>

              <button
                id="workout-finish-btn"
                type="button"
                onClick={() => setShowFinishConfirm(true)}
                className="w-16 h-16 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white flex flex-col items-center justify-center gap-0.5 shadow-md cursor-pointer transition-all"
              >
                <Square className="w-5 h-5 fill-white" />
                <span className="text-[10px] font-bold uppercase">Finish</span>
              </button>
            </div>
          </div>
        </div>

        {/* Finish & Save Confirmation Dialog */}
        {showFinishConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl text-white space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Check className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Complete Workout?</h3>
                  <p className="text-xs text-slate-400">Ready to record and log this session</p>
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Activity</span>
                  <span className="font-bold text-white flex items-center gap-1.5">
                    {getActivityIcon(session.activityName)}
                    <span>{session.activityName}</span>
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Duration</span>
                  <span className="font-bold text-emerald-400 font-mono tabular-nums">
                    {formatStopwatch(session.secondsElapsed).formatted} ({durationMinutes} mins)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Est. Calories</span>
                  <span className="font-bold text-amber-300 tabular-nums">~{estCalories} kcal</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Workout Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Great pace, felt strong!"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-11 px-3.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleFinishSave}
                  className="flex-1 min-h-[48px] py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Save Activity</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowFinishConfirm(false)}
                  className="min-h-[48px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-colors cursor-pointer"
                >
                  Resume
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Discard Confirmation Dialog */}
        {showDiscardConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl text-white space-y-4">
              <h3 className="text-base font-bold text-rose-400">Discard Workout?</h3>
              <p className="text-sm text-slate-300">
                Stop and discard this session? Elapsed time ({formatStopwatch(session.secondsElapsed).formatted}) will not be saved.
              </p>
              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowDiscardConfirm(false);
                    onDiscard();
                  }}
                  className="flex-1 min-h-[48px] py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm transition-colors cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={() => setShowDiscardConfirm(false)}
                  className="flex-1 min-h-[48px] py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
