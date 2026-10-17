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
    <div className="absolute top-9 left-3 right-3 z-45 bg-slate-900/95 dark:bg-slate-900/95 border border-blue-500/40 text-white rounded-2xl p-2.5 shadow-xl backdrop-blur-md flex items-center justify-between animate-in slide-in-from-top-3 duration-200">
      {/* Clickable Area to Expand */}
      <div 
        onClick={onMaximize}
        className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0 mr-2"
      >
        <div className="relative">
          <div className="w-8 h-8 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center">
            {getActivityIcon(session.activityName)}
          </div>
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            {!session.isPaused && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${session.isPaused ? 'bg-amber-400' : 'bg-emerald-500'}`}></span>
          </span>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-white truncate">
              {session.activityName}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {session.isPaused ? '(Paused)' : '• Live'}
            </span>
          </div>
          <p className="font-mono text-xs font-bold text-blue-400 tracking-wider">
            {formatted}
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePause();
          }}
          className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
            session.isPaused 
              ? 'bg-emerald-600 text-white hover:bg-emerald-500' 
              : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
          }`}
          title={session.isPaused ? 'Resume' : 'Pause'}
        >
          {session.isPaused ? <Play className="w-3.5 h-3.5 fill-white" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onMaximize();
            onFinishPrompt();
          }}
          className="p-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
          title="Finish Workout"
        >
          <Square className="w-3.5 h-3.5 fill-white" />
        </button>

        <button
          onClick={onMaximize}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="Open Fullscreen Workout"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
