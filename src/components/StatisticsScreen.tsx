import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  Layers, 
  PieChart, 
  TrendingUp, 
  Calendar,
  Flame
} from 'lucide-react';
import { Activity, StatPeriod } from '../types';
import { getActivityIcon } from '../utils/activityIcons';

interface StatisticsScreenProps {
  activities: Activity[];
  onBack: () => void;
}

export const StatisticsScreen: React.FC<StatisticsScreenProps> = ({
  activities,
  onBack,
}) => {
  const [period, setPeriod] = useState<StatPeriod>('Monthly');

  // Filter activities by period
  const filteredActivities = useMemo(() => {
    if (activities.length === 0) return [];

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    // Check if any activity is within the last 60 days of real current time
    const hasRecentActivity = activities.some((a) => {
      const t = new Date(a.date).getTime();
      return !isNaN(t) && Math.abs(now - t) <= 60 * oneDay;
    });

    // Reference base time: real time if user has recent activities, or the newest activity's date
    const newestTime = Math.max(...activities.map((a) => {
      const t = new Date(a.date).getTime();
      return isNaN(t) ? 0 : t;
    }));

    const baseTime = hasRecentActivity ? now : (newestTime > 0 ? newestTime : now);

    return activities.filter((act) => {
      const actTime = new Date(act.date).getTime();
      if (isNaN(actTime)) return true;
      const diff = baseTime - actTime;
      if (period === 'Weekly') {
        // Last 14 days from baseTime
        return diff >= -oneDay && diff <= 14 * oneDay;
      } else if (period === 'Monthly') {
        // Last 45 days from baseTime
        return diff >= -oneDay && diff <= 45 * oneDay;
      }
      // Yearly: all
      return true;
    });
  }, [activities, period]);

  // Calculations
  const totalCount = filteredActivities.length;
  const completedCount = filteredActivities.filter((a) => a.status === 'Completed').length;
  const ongoingCount = filteredActivities.filter((a) => a.status === 'Ongoing').length;
  const notStartedCount = filteredActivities.filter((a) => a.status === 'Not Started').length;

  const totalMinutes = filteredActivities.reduce((acc, a) => acc + (a.durationMinutes || 0), 0);
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const totalCalories = Math.round(totalMinutes * 7.5);

  // Group by activity name/type
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
    return Object.entries(map).sort((a, b) => b[1].count - a[1].count);
  }, [filteredActivities]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Top App Bar */}
      <div className="px-4 pt-4 pb-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 shadow-2xs transition-colors">
        <button
          id="stats-back-btn"
          onClick={onBack}
          className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold text-slate-900 dark:text-white">
          Statistics
        </h1>
        <div className="w-8"></div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 pb-12">
        {/* Filter Period Tabs */}
        <div className="flex bg-slate-200/70 dark:bg-slate-800 p-1 rounded-2xl">
          {(['Weekly', 'Monthly', 'Yearly'] as StatPeriod[]).map((p) => {
            const isActive = period === p;
            return (
              <button
                key={p}
                id={`stats-period-${p.toLowerCase()}`}
                onClick={() => setPeriod(p)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Circular Progress & Overall Completion Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-colors">
          {/* SVG Circular Progress Indicator */}
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              {/* Background circle */}
              <path
                className="text-blue-50 dark:text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              {/* Foreground progress circle */}
              <path
                className="text-blue-600 dark:text-blue-500 transition-all duration-700 ease-out"
                strokeDasharray={`${completionRate}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-xl font-extrabold text-slate-900 dark:text-white leading-none">
                {completionRate}%
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                Completed
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              {period} Summary
            </span>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 leading-tight">
              {completedCount} of {totalCount} done
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
              Total of {Math.round(totalMinutes / 60 * 10) / 10} hours logged with ~{totalCalories} kcal burned.
            </p>
          </div>
        </div>

        {/* 4 Summary Cards Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Total Activities */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Activities</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{totalCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          {/* Completed */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
            <div>
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Completed</span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{completedCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          {/* Ongoing */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
            <div>
              <span className="text-xs text-sky-700 dark:text-sky-400 font-medium">Ongoing</span>
              <p className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-0.5">{ongoingCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          {/* Not Started */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
            <div>
              <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">Not Started</span>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{notStartedCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-slate-800 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Activity Type Statistics */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Activity Type Statistics
            </h3>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
              {typeMap.length} types
            </span>
          </div>

          {typeMap.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 py-3 text-center">
              No activity records in this period.
            </p>
          ) : (
            <div className="space-y-3.5">
              {typeMap.map(([name, data]) => {
                const percentage = totalCount > 0 ? Math.round((data.count / totalCount) * 100) : 0;
                return (
                  <div key={name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                        <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                          {getActivityIcon(name)}
                        </div>
                        <span>{name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
                        <span>{data.minutes} mins</span>
                        <span>•</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">{data.count} ({percentage}%)</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
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
