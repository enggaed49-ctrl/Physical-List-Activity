import React from 'react';
import { 
  ChevronRight, 
  Calendar, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  Clock3, 
  Layers, 
  Plus, 
  TrendingUp,
  Award,
  Database,
  Timer,
  Play,
  Pause,
  Flame,
  Zap,
  Target,
  Trophy
} from 'lucide-react';
import { Activity, CloudSyncStatus, WorkoutSession, UserProfile } from '../types';
import { formatDateDisplay, formatDuration } from '../data/initialActivities';
import { getActivityIcon, getStatusBadge } from '../utils/activityIcons';
import { formatStopwatch } from './ActiveWorkoutModal';
import { PRESET_AVATARS } from './EditProfileModal';

interface HomeScreenProps {
  activities: Activity[];
  cloudStatus?: CloudSyncStatus;
  userProfile?: UserProfile;
  defaultActivity?: string;
  onSetDefaultActivity?: (name: string) => void;
  dailyGoalMinutes?: number;
  onOpenProfile?: () => void;
  activeSession?: WorkoutSession | null;
  onStartQuickWorkout?: (activityName?: string) => void;
  onResumeWorkout?: () => void;
  onOpenSupabase?: () => void;
  onViewAll: () => void;
  onSelectActivity: (activity: Activity) => void;
  onAddNew: () => void;
}

const QUICK_ACTIVITIES = ['Running', 'Gym', 'Cycling', 'Yoga', 'Walking'];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  activities,
  cloudStatus,
  userProfile,
  defaultActivity = 'Running',
  onSetDefaultActivity,
  dailyGoalMinutes = 60,
  onOpenProfile,
  activeSession,
  onStartQuickWorkout,
  onResumeWorkout,
  onOpenSupabase,
  onViewAll,
  onSelectActivity,
  onAddNew,
}) => {
  const activePresetObj = PRESET_AVATARS.find((p) => p.id === userProfile?.presetAvatar);
  const totalActivities = activities.length;
  const completedActivities = activities.filter((a) => a.status === 'Completed').length;
  const ongoingActivities = activities.filter((a) => a.status === 'Ongoing').length;
  const notStartedActivities = activities.filter((a) => a.status === 'Not Started').length;
  const isCloudSynced = cloudStatus?.connected && cloudStatus?.tableExists;

  const isSessionRunning = Boolean(activeSession && activeSession.isActive);

  // Calculate today's activities & goal progress
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  const todayActivities = activities.filter((a) => a.date === todayStr);
  const todayCompletedMinutes = todayActivities.reduce((sum, a) => sum + (a.durationMinutes || 0), 0);

  const liveMinutes = (activeSession && activeSession.isActive)
    ? Math.floor(activeSession.secondsElapsed / 60)
    : 0;

  const totalActiveToday = todayCompletedMinutes + liveMinutes;
  const goalPercent = Math.min(100, Math.round((totalActiveToday / dailyGoalMinutes) * 100));
  const remainingMinutes = Math.max(0, dailyGoalMinutes - totalActiveToday);
  const isGoalMet = totalActiveToday >= dailyGoalMinutes;

  // Most recent activities (sorted by date descending / createdAt)
  const recentActivities = [...activities]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  return (
    <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 pb-8">
      {/* Header Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold text-xs tracking-wider uppercase mb-0.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome Back</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {userProfile?.name && userProfile.name !== 'Guest User'
              ? `Hello, ${userProfile.name}!`
              : 'Good day!'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-[240px]">
            {userProfile?.subtitle || 'Every step counts toward a stronger, healthier you. Keep up the momentum!'}
          </p>
        </div>

        {/* User Icon Badge with Photo / Avatar */}
        <div 
          onClick={onOpenProfile}
          className="w-12 h-12 rounded-2xl overflow-hidden bg-gradient-to-tr from-blue-600 to-sky-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 ring-4 ring-blue-50 dark:ring-slate-800 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
          title="Open Profile"
        >
          {userProfile?.avatarUrl ? (
            <img
              src={userProfile.avatarUrl}
              alt={userProfile.name}
              className="w-full h-full object-cover"
            />
          ) : activePresetObj ? (
            <div className={`w-full h-full bg-gradient-to-tr ${activePresetObj.bg} flex items-center justify-center text-xl`}>
              {activePresetObj.icon}
            </div>
          ) : (
            <Award className="w-6 h-6 stroke-[2]" />
          )}
        </div>
      </div>

      {/* Daily Goal Progress Visualizer Card */}
      <div 
        id="home-daily-goal-visualizer"
        className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-blue-100 dark:border-slate-800 shadow-sm relative overflow-hidden transition-colors"
      >
        {/* Top Header of Goal Card */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isGoalMet 
                ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400' 
                : 'bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400'
            }`}>
              <Target className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Daily Goal Progress
              </h2>
              <p className="text-[10px] text-slate-400 dark:text-slate-400">
                Target: {dailyGoalMinutes} mins / day
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
              isGoalMet
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50'
            }`}>
              {goalPercent}%
            </span>
            {onOpenProfile && (
              <button
                onClick={onOpenProfile}
                id="home-edit-goal-btn"
                className="text-[10px] font-bold text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                title="Change Goal Target"
              >
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Big Numbers & Live Indicator */}
        <div className="flex items-baseline justify-between mb-2">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono leading-none">
              {totalActiveToday}
            </span>
            <span className="text-xs font-bold text-slate-400">
              / {dailyGoalMinutes} mins
            </span>
            {liveMinutes > 0 && (
              <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 animate-pulse ml-1.5">
                (+{liveMinutes}m live)
              </span>
            )}
          </div>

          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {todayActivities.length} {todayActivities.length === 1 ? 'activity' : 'activities'} today
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800/90 rounded-full overflow-hidden p-0.5 relative">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isGoalMet
                ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 shadow-xs shadow-emerald-500/40'
                : 'bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-500'
            }`}
            style={{ width: `${Math.max(totalActiveToday > 0 ? 5 : 0, goalPercent)}%` }}
          />
        </div>

        {/* Motivational Status Text */}
        <div className="flex items-center justify-between text-[11px] font-semibold mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5">
            {isGoalMet ? (
              <>
                <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  Daily goal achieved! Outstanding effort!
                </span>
              </>
            ) : (
              <>
                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="text-slate-500 dark:text-slate-400">
                  {remainingMinutes} mins left to complete today's goal
                </span>
              </>
            )}
          </div>

          {onOpenProfile && (
            <button
              onClick={onOpenProfile}
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 font-bold cursor-pointer text-[10px]"
            >
              <span>Goal Settings</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Start Timer Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-blue-100 dark:border-slate-800 shadow-md shadow-blue-500/5 relative overflow-hidden transition-colors">
        {/* Subtle Top Accent */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Timer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Quick Start Timer
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-full">
            <span>Default:</span>
            <span className="underline decoration-blue-400 underline-offset-2">{defaultActivity}</span>
          </div>
        </div>

        {/* If session is currently running */}
        {isSessionRunning && activeSession ? (
          <div 
            onClick={onResumeWorkout}
            id="home-active-session-banner"
            className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20 flex items-center justify-between cursor-pointer hover:opacity-95 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs relative">
                <span className="relative flex h-3 w-3">
                  {!activeSession.isPaused && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  )}
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-100">
                    {activeSession.isPaused ? 'Workout Paused' : 'Session In Progress'}
                  </span>
                </div>
                <p className="text-sm font-black text-white flex items-center gap-1">
                  <span>{activeSession.activityName}</span>
                  <span>•</span>
                  <span className="font-mono text-emerald-100">{formatStopwatch(activeSession.secondsElapsed).formatted}</span>
                </p>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onResumeWorkout && onResumeWorkout();
              }}
              className="px-3 py-1.5 rounded-xl bg-white text-emerald-700 text-xs font-bold shadow-xs hover:bg-emerald-50 active:scale-95 transition-all flex items-center gap-1"
            >
              <span>Resume</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* Main Quick Start Button */
          <div className="space-y-3">
            <button
              id="home-quick-start-timer-btn"
              onClick={() => onStartQuickWorkout && onStartQuickWorkout(defaultActivity)}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/20 text-white flex items-center justify-center backdrop-blur-xs group-hover:scale-105 transition-transform shadow-inner">
                  <Play className="w-5 h-5 fill-white translate-x-0.5" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-extrabold tracking-wider text-blue-200">
                      1-Tap Workout Session
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/20 font-bold">
                      Default
                    </span>
                  </div>
                  <p className="text-base font-extrabold text-white flex items-center gap-1.5 mt-0.5">
                    <span className="p-0.5 rounded-md bg-white/10">{getActivityIcon(defaultActivity)}</span>
                    <span>Quick Start {defaultActivity}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs font-bold bg-white text-blue-700 px-3 py-2 rounded-xl shadow-xs group-hover:bg-blue-50 group-hover:scale-105 transition-all shrink-0">
                <Zap className="w-3.5 h-3.5 fill-blue-600" />
                <span>Start</span>
              </div>
            </button>

            {/* Default Activity Selector Chips */}
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Select Activity:
              </span>
              <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                {QUICK_ACTIVITIES.map((act) => {
                  const isSelected = defaultActivity === act;
                  return (
                    <button
                      key={act}
                      id={`home-preset-${act.toLowerCase()}`}
                      onClick={() => onSetDefaultActivity && onSetDefaultActivity(act)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                      title={`Set default to ${act}`}
                    >
                      <span className="w-3 h-3 flex items-center justify-center">
                        {getActivityIcon(act)}
                      </span>
                      <span>{act}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Metric Cards */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5">
          Overview
        </h2>
        <div className="grid grid-cols-3 gap-2.5">
          {/* Total Activities Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white leading-none">
                {totalActivities}
              </span>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                Total Activities
              </p>
            </div>
            <div className="absolute top-0 right-0 w-12 h-12 bg-blue-50/50 dark:bg-blue-950/30 rounded-full -mr-3 -mt-3 pointer-events-none"></div>
          </div>

          {/* Completed Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 leading-none">
                {completedActivities}
              </span>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                Completed
              </p>
            </div>
            <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-full -mr-3 -mt-3 pointer-events-none"></div>
          </div>

          {/* Ongoing Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-sky-200 dark:hover:border-sky-800 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <Clock3 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-extrabold text-sky-600 dark:text-sky-400 leading-none">
                {ongoingActivities}
              </span>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                Ongoing
              </p>
            </div>
            <div className="absolute top-0 right-0 w-12 h-12 bg-sky-50/50 dark:bg-sky-950/30 rounded-full -mr-3 -mt-3 pointer-events-none"></div>
          </div>
        </div>
      </div>

      {/* Manual Add Quick Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-800/80 dark:to-slate-900/80 p-3.5 text-white shadow-sm flex items-center justify-between border border-slate-700/60">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
            <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
            <span>Manual Entry</span>
          </div>
          <p className="text-xs font-bold text-white">Log past or planned workout</p>
        </div>
        <button
          id="home-quick-add-btn"
          onClick={onAddNew}
          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer border border-white/15"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add Activity</span>
        </button>
      </div>

      {/* Section: Recent Activities */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Recent Activities
          </h2>
          <button
            id="home-view-all-btn"
            onClick={onViewAll}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentActivities.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 text-center border border-slate-100 dark:border-slate-800 shadow-sm">
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No recent activities found.</p>
            <button
              onClick={onAddNew}
              className="mt-3 px-4 py-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
            >
              Add First Activity
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentActivities.map((act) => {
              const statusInfo = getStatusBadge(act.status);
              return (
                <div
                  key={act.id}
                  id={`recent-act-${act.id}`}
                  onClick={() => onSelectActivity(act)}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Activity Icon */}
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      {getActivityIcon(act.name)}
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {act.name}
                      </h3>
                      <div className="flex items-center gap-2.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                          <span className="truncate">{formatDateDisplay(act.date)}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                          <span>{formatDuration(act.durationMinutes)}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge & Arrow */}
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusInfo.bg}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`}></span>
                      <span>{statusInfo.label}</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
