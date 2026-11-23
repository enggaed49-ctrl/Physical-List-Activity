import React from 'react';
import { Play, Pause, Maximize2, Square } from 'lucide-react';
import { WorkoutSession } from '../types';
import { formatStopwatch } from './ActiveWorkoutModal';
import { getActivityIcon } from '../utils/activityIcons';

interface FloatingMiniTimerProps {
  session: WorkoutSession;
  onTogglePause: () => void;
  onMaximize: () => void;
  onFinishPrompt: () => void;
}

export const FloatingMiniTimer: React.FC<FloatingMiniTimerProps> = ({
  session,
  onTogglePause,
  onMaximize,
  onFinishPrompt,
}) => {
  if (!session.isActive) return null;

  const { formatted } = formatStopwatch(session.secondsElapsed);

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-80 z-40 bg-slate-900 border border-slate-700 text-white rounded-2xl p-3 shadow-2xl flex items-center justify-between">
      <div
        onClick={onMaximize}
        className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 mr-2"
      >
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center">
            {getActivityIcon(session.activityName)}
          </div>
          <span
            className={`absolute -top-1 -right-1 inline-flex rounded-full h-2.5 w-2.5 ${
              session.isPaused ? 'bg-amber-400' : 'bg-emerald-500'
            }`}
          />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-white truncate">
              {session.activityName}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              {session.isPaused ? '(Paused)' : 'Live'}
            </span>
          </div>
          <p className="font-mono tabular-nums text-sm font-bold text-blue-400 tracking-wider">
            {formatted}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePause();
          }}
          className={`min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
            session.isPaused
              ? 'bg-emerald-600 text-white hover:bg-emerald-500'
              : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
          }`}
          title={session.isPaused ? 'Resume' : 'Pause'}
          aria-label={session.isPaused ? 'Resume' : 'Pause'}
        >
          {session.isPaused ? (
            <Play className="w-4 h-4 fill-white" />
          ) : (
            <Pause className="w-4 h-4 fill-current" />
          )}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMaximize();
            onFinishPrompt();
          }}
          className="min-h-[44px] min-w-[44px] rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-colors cursor-pointer"
          title="Finish Workout"
          aria-label="Finish Workout"
        >
          <Square className="w-4 h-4 fill-white" />
        </button>

        <button
          type="button"
          onClick={onMaximize}
          className="min-h-[44px] min-w-[44px] rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          title="Open Workout Timer"
          aria-label="Open Workout Timer"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
