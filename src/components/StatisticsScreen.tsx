import React, { useState, useMemo } from 'react';
import { ArrowLeft, CheckCircle2, Clock, Flame, Layers } from 'lucide-react';
import { Activity, StatPeriod } from '../types';
import { getActivityIcon } from '../utils/activityIcons';
import {
  estimateActivityCalories,
  formatDuration,
  parseLocalDateMs,
} from '../utils/formatters';

interface StatisticsScreenProps {
  activities: Activity[];
  onBack: () => void;
}

export const StatisticsScreen: React.FC<StatisticsScreenProps> = ({
  activities,
  onBack,
}) => {
  const [period, setPeriod] = useState<StatPeriod>('Monthly');

  const filteredActivities = useMemo(() => {
    if (activities.length === 0) return [];
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    const hasRecentActivity = activities.some((a) => {
      const t = parseLocalDateMs(a.date);
      return !isNaN(t) && Math.abs(now - t) <= 60 * oneDay;
    });

    const newestTime = Math.max(
      ...activities.map((a) => {
        const t = parseLocalDateMs(a.date);
        return isNaN(t) ? 0 : t;
      })
    );

    const baseTime = hasRecentActivity ? now : newestTime > 0 ? newestTime : now;

    return activities.filter((act) => {
      const actTime = parseLocalDateMs(act.date);
      if (isNaN(actTime)) return true;
      const diff = baseTime - actTime;
      if (period === 'Weekly') {
        return diff >= -oneDay && diff <= 14 * oneDay;
      } else if (period === 'Monthly') {
        return diff >= -oneDay && diff <= 45 * oneDay;
      }
      return true;
    });
  }, [activities, period]);

  const totalCount = filteredActivities.length;
  const completedCount = filteredActivities.filter((a) => a.status === 'Completed').length;
  const ongoingCount = filteredActivities.filter((a) => a.status === 'Ongoing').length;
  const notStartedCount = filteredActivities.filter((a) => a.status === 'Not Started').length;

  const totalMinutes = filteredActivities.reduce((acc, a) => acc + (a.durationMinutes || 0), 0);
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const totalCalories = filteredActivities.reduce(
    (acc, a) => acc + estimateActivityCalories(a.name, a.durationMinutes || 0),
    0
  );

  const typeMap = useMemo(() => {
    const map: { [key: string]: { count: number; minutes: number } } = {};
    filteredActivities.forEach((act) => {
      const key = act.name.trim();
      if (!map[key]) {
        map[key] = { count: 0, minutes: 0 };
      }
      map[key].count += 1;
      map[key].minutes += act.durationMinutes || 0;
    });
    return Object.entries(map).sort((a, b) => b[1].minutes - a[1].minutes);
  }, [filteredActivities]);

  return (
    <div className="space-y-6">
      {/* Header + Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            id="stats-back-btn"
            type="button"
            onClick={onBack}
            className="hidden md:inline-flex min-h-[40px] min-w-[40px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Activity Statistics
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Personal performance metrics across your recorded sessions
            </p>
          </div>
        </div>

        {/* Period Segmented Buttons */}
        <div className="grid grid-cols-3 sm:inline-flex p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl">
          {(['Weekly', 'Monthly', 'Yearly'] as StatPeriod[]).map((p) => {
            const isActive = period === p;
            return (
              <button
                key={p}
                id={`stats-period-${p.toLowerCase()}`}
                type="button"
                onClick={() => setPeriod(p)}
                className={`min-h-[40px] sm:min-h-[34px] px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4-column Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Sessions</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2 font-mono tabular-nums">
            {totalCount}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Total Time</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2 font-mono tabular-nums">
            {totalMinutes} <span className="text-sm font-normal text-slate-500">min</span>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Completed</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2 font-mono tabular-nums">
            {completedCount}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Est. Energy</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2 font-mono tabular-nums">
            {totalCalories} <span className="text-sm font-normal text-slate-500">kcal</span>
          </p>
        </div>
      </div>

      {/* 2-Col Desktop / 1-Col Mobile Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Completion Ring & Status Distribution */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-5">
            <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100 dark:text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-blue-600 dark:text-blue-500 transition-all duration-500"
                  strokeDasharray={`${completionRate}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-lg font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                {completionRate}%
              </span>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Completion Rate
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {completedCount} of {totalCount} activities finished in this {period.toLowerCase()} window.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
            {[
              { label: 'Completed', count: completedCount, barClass: 'bg-emerald-600' },
              { label: 'Ongoing', count: ongoingCount, barClass: 'bg-blue-600' },
              { label: 'Not Started', count: notStartedCount, barClass: 'bg-amber-500' },
            ].map((row) => {
              const pct = totalCount > 0 ? Math.round((row.count / totalCount) * 100) : 0;
              return (
                <div key={row.label} className="space-y-1.5">
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-slate-700 dark:text-slate-300">{row.label}</span>
                    <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
                      {row.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${row.barClass} transition-all duration-300`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity Breakdown by Name */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Breakdown by Activity
          </h2>

          {typeMap.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              No activities recorded for this timeframe yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {typeMap.map(([name, stats]) => {
                const sharePct = totalMinutes > 0 ? Math.round((stats.minutes / totalMinutes) * 100) : 0;
                return (
                  <div key={name} className="py-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                          {getActivityIcon(name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                            {stats.count} {stats.count === 1 ? 'session' : 'sessions'} · {formatDuration(stats.minutes)}
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono tabular-nums shrink-0">
                        {sharePct}%
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${sharePct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
