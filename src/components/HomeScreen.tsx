import React from 'react';
import {
  ChevronRight,
  Plus,
  Play,
  Timer,
  Flame,
  Target,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Activity, AuthUser, WorkoutSession } from '../types';
import {
  formatDateDisplay,
  formatDuration,
  getTodayLocalDateString,
  parseLocalDateMs,
} from '../utils/formatters';
import { getActivityIcon, getStatusMeta, getCategoryColor } from '../utils/activityIcons';
import { formatStopwatch } from './ActiveWorkoutModal';
import { PRESET_AVATARS } from './EditProfileModal';

interface HomeScreenProps {
  user: AuthUser;
  activities: Activity[];
  isLoadingActivities: boolean;
  onSetDefaultActivity: (name: string) => void;
  onOpenProfile: () => void;
  activeSession: WorkoutSession | null;
  onStartQuickWorkout: (activityName?: string) => void;
  onResumeWorkout: () => void;
  onViewAll: () => void;
  onSelectActivity: (activity: Activity) => void;
  onAddNew: () => void;
  onLoadSampleData: () => void;
}

const QUICK_ACTIVITIES = ['Running', 'Gym', 'Cycling', 'Yoga', 'Walking'];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  activities,
  isLoadingActivities,
  onSetDefaultActivity,
  onOpenProfile,
  activeSession,
  onStartQuickWorkout,
  onResumeWorkout,
  onViewAll,
  onSelectActivity,
  onAddNew,
  onLoadSampleData,
}) => {
  const dailyGoalMinutes = user.dailyGoalMinutes || 60;
  const defaultActivity = user.defaultActivity || 'Running';
  const activePresetObj = PRESET_AVATARS.find((p) => p.id === user.presetAvatar);

  const totalActivities = activities.length;
  const completedActivities = activities.filter((a) => a.status === 'Completed').length;
  const ongoingActivities = activities.filter((a) => a.status === 'Ongoing').length;
  const notStartedActivities = activities.filter((a) => a.status === 'Not Started').length;
  const totalMinutesAll = activities.reduce((sum, a) => sum + (a.durationMinutes || 0), 0);
  const completionRate = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;

  const todayStr = getTodayLocalDateString();

  const todayActivities = activities.filter((a) => a.date === todayStr);
  const todayCompletedMinutes = todayActivities.reduce((sum, a) => sum + (a.durationMinutes || 0), 0);
  const liveMinutes = activeSession?.isActive ? Math.floor(activeSession.secondsElapsed / 60) : 0;
  const totalActiveToday = todayCompletedMinutes + liveMinutes;
  const goalPercent = Math.min(100, Math.round((totalActiveToday / dailyGoalMinutes) * 100));
  const remainingMinutes = Math.max(0, dailyGoalMinutes - totalActiveToday);
  const isGoalMet = totalActiveToday >= dailyGoalMinutes;

  const recentActivities = [...activities]
    .sort((a, b) => {
      const dateDiff = parseLocalDateMs(b.date) - parseLocalDateMs(a.date);
      return !isNaN(dateDiff) && dateDiff !== 0 ? dateDiff : b.createdAt - a.createdAt;
    })
    .slice(0, 5);

  const firstName = user.name.split(' ')[0] || user.name;

  return (
    <div className="space-y-6">
      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight text-balance">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {user.subtitle || 'Track your daily sessions and stay consistent.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onAddNew}
            className="hidden md:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Entry</span>
          </button>

          <button
            type="button"
            onClick={onOpenProfile}
            className="hidden sm:flex items-center gap-2.5 p-1.5 pr-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer"
            title="View Profile"
          >
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : activePresetObj ? (
                <span className="text-base">{activePresetObj.icon}</span>
              ) : (
                <span>{user.name.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">
              {user.name}
            </span>
          </button>
        </div>
      </div>

      {/* 4-Column Desktop / 2x2 Mobile KPI Strip */}
      <section aria-label="Summary metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Activities</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1.5 font-mono tabular-nums">
            {totalActivities}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {completedActivities} completed
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Minutes</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1.5 font-mono tabular-nums">
            {totalMinutesAll}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Total minutes logged
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Completion Rate</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1.5 font-mono tabular-nums">
            {completionRate}%
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {ongoingActivities} ongoing
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Today's Goal</p>
          <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1.5 font-mono tabular-nums">
            {goalPercent}%
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
            {totalActiveToday}/{dailyGoalMinutes} min
          </p>
        </div>
      </section>

      {/* Main Content: 2 Columns on Desktop (8/4), Single Column on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Main Workspace (8 cols desktop) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Quick Start Live Timer Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {activeSession?.isActive ? 'Workout Session In Progress' : 'Start a Live Workout'}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                  {activeSession?.isActive
                    ? `${activeSession.activityName} · ${formatStopwatch(activeSession.secondsElapsed).formatted}`
                    : `Track elapsed time and log directly to your personal list.`}
                </p>
              </div>

              {activeSession?.isActive ? (
                <button
                  type="button"
                  onClick={onResumeWorkout}
                  className="w-full sm:w-auto min-h-[48px] px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Timer className="w-4 h-4" />
                  <span>Open Live Timer</span>
                </button>
              ) : (
                <button
                  id="quick-start-workout-btn"
                  type="button"
                  onClick={() => onStartQuickWorkout(defaultActivity)}
                  className="w-full sm:w-auto min-h-[48px] px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start {defaultActivity}</span>
                </button>
              )}
            </div>

            {!activeSession?.isActive && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap mr-1">
                  Quick preset:
                </span>
                {QUICK_ACTIVITIES.map((act) => {
                  const isActive = defaultActivity === act;
                  return (
                    <button
                      key={act}
                      type="button"
                      onClick={() => onSetDefaultActivity(act)}
                      className={`min-h-[40px] sm:min-h-[34px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {act}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Activities Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Recent Activities
              </h2>
              {activities.length > 0 && (
                <button
                  id="home-view-all-btn"
                  type="button"
                  onClick={onViewAll}
                  className="min-h-[44px] sm:min-h-0 px-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <span>View all</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {isLoadingActivities ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                ))}
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-base font-semibold text-slate-900 dark:text-white">
                  No activities recorded yet
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Your private workspace is ready. Log your first workout or load starter examples to explore.
                </p>
                <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={onAddNew}
                    className="w-full sm:w-auto min-h-[48px] px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Log First Activity</span>
                  </button>
                  <button
                    type="button"
                    onClick={onLoadSampleData}
                    className="w-full sm:w-auto min-h-[48px] px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Load Starter Examples</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentActivities.map((act) => {
                  const statusMeta = getStatusMeta(act.status);
                  return (
                    <button
                      key={act.id}
                      id={`recent-act-${act.id}`}
                      type="button"
                      onClick={() => onSelectActivity(act)}
                      className="w-full min-h-[68px] px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                          {getActivityIcon(act.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {act.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                            <span className={`font-medium ${getCategoryColor(act.category)}`}>
                              {act.category || 'Cardio'}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{formatDateDisplay(act.date)}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">{formatDuration(act.durationMinutes)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold ${statusMeta.textClass}`}>
                          {statusMeta.icon}
                          <span>{statusMeta.label}</span>
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side Column (4 cols desktop, stacks below on mobile) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Daily Goal Progress Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Daily Goal</h2>
              </div>
              <button
                type="button"
                onClick={onOpenProfile}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer min-h-[44px] sm:min-h-0 px-1"
              >
                Adjust target
              </button>
            </div>

            <div className="flex items-center gap-5">
              <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100 dark:text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={`${isGoalMet ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-500'} transition-all duration-500`}
                    strokeDasharray={`${goalPercent}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-sm font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                  {goalPercent}%
                </span>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white font-mono tabular-nums">
                  {totalActiveToday} / {dailyGoalMinutes} min
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {isGoalMet
                    ? 'Daily target reached. Great consistency today.'
                    : `${remainingMinutes} minutes remaining to hit today's target.`}
                </p>
              </div>
            </div>
          </div>

          {/* Status Breakdown Summary */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Session Status</h2>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              <div className="py-2.5 flex items-center justify-between">
                <span className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Completed</span>
                </span>
                <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                  {completedActivities}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-medium">
                  <Clock className="w-4 h-4" />
                  <span>Ongoing</span>
                </span>
                <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                  {ongoingActivities}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium">
                  <Flame className="w-4 h-4" />
                  <span>Not Started</span>
                </span>
                <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                  {notStartedActivities}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
