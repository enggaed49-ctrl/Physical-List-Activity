import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Pencil,
  Trash2,
  Flame,
  Layers,
} from 'lucide-react';
import { Activity, ActivityStatus } from '../types';
import {
  estimateActivityCalories,
  formatDateDisplay,
  formatDuration,
} from '../utils/formatters';
import { getActivityIcon, getStatusMeta, getCategoryColor } from '../utils/activityIcons';

interface ActivityDetailScreenProps {
  activity: Activity;
  onBack: () => void;
  onEdit: () => void;
  onDeleteRequest: () => void;
  onChangeStatus?: (status: ActivityStatus) => Promise<void>;
}

const STATUS_OPTIONS: ActivityStatus[] = ['Completed', 'Ongoing', 'Not Started'];

export const ActivityDetailScreen: React.FC<ActivityDetailScreenProps> = ({
  activity,
  onBack,
  onEdit,
  onDeleteRequest,
  onChangeStatus,
}) => {
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const statusMeta = getStatusMeta(activity.status);
  const estimatedCalories = estimateActivityCalories(activity.name, activity.durationMinutes);

  const handleQuickStatus = async (nextStatus: ActivityStatus) => {
    if (!onChangeStatus || nextStatus === activity.status || updatingStatus) return;
    setUpdatingStatus(true);
    try {
      await onChangeStatus(nextStatus);
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          id="details-back-btn"
          type="button"
          onClick={onBack}
          className="hidden md:inline-flex min-h-[40px] min-w-[40px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Activity Details
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Session overview and recorded notes
          </p>
        </div>
      </div>

      {/* Responsive 2-col desktop / 1-col mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Main Card */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              {getActivityIcon(activity.name)}
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {activity.name}
              </h2>
              <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400 mt-1 flex-wrap">
                <span className={`font-semibold ${getCategoryColor(activity.category)}`}>
                  {activity.category || 'Cardio'}
                </span>
                <span aria-hidden="true">·</span>
                <span>{formatDateDisplay(activity.date)}</span>
                <span aria-hidden="true">·</span>
                <span className={`inline-flex items-center gap-1.5 font-semibold ${statusMeta.textClass}`}>
                  {statusMeta.icon}
                  <span>{statusMeta.label}</span>
                </span>
              </div>
            </div>
          </div>

          {onChangeStatus && (
            <div className="pt-5 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Update Status
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {STATUS_OPTIONS.map((st) => {
                  const isActive = activity.status === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleQuickStatus(st)}
                      className={`min-h-[44px] sm:min-h-[38px] px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer disabled:opacity-60 ${
                        isActive
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-5 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Notes
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {activity.description ? activity.description : 'No notes added for this activity.'}
            </p>
          </div>
        </div>

        {/* Right Sidebar: Metrics + Actions */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Session Summary
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              <div className="py-2.5 flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Clock className="w-4 h-4" />
                  <span>Duration</span>
                </span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono tabular-nums">
                  {formatDuration(activity.durationMinutes)}
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>Est. Energy</span>
                </span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono tabular-nums">
                  {estimatedCalories} kcal
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Layers className="w-4 h-4" />
                  <span>Category</span>
                </span>
                <span className={`font-semibold ${getCategoryColor(activity.category)}`}>
                  {activity.category || 'Cardio'}
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Calendar className="w-4 h-4" />
                  <span>Date</span>
                </span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono tabular-nums">
                  {formatDateDisplay(activity.date)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              id="details-edit-btn"
              type="button"
              onClick={onEdit}
              className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Pencil className="w-4 h-4" />
              <span>Edit Activity</span>
            </button>
            <button
              id="details-delete-btn"
              type="button"
              onClick={onDeleteRequest}
              className="w-full min-h-[48px] px-5 py-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Activity</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
