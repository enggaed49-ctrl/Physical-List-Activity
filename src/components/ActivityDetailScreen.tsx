import React from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  FileText, 
  Pencil, 
  Trash2, 
  CheckCircle2, 
  Flame, 
  Heart,
  Share2,
  Layers
} from 'lucide-react';
import { Activity } from '../types';
import { formatDateDisplay, formatDuration } from '../data/initialActivities';
import { getActivityIcon, getStatusBadge, getCategoryBadge } from '../utils/activityIcons';

interface ActivityDetailScreenProps {
  activity: Activity;
  onBack: () => void;
  onEdit: () => void;
  onDeleteRequest: () => void;
}

export const ActivityDetailScreen: React.FC<ActivityDetailScreenProps> = ({
  activity,
  onBack,
  onEdit,
  onDeleteRequest,
}) => {
  const statusInfo = getStatusBadge(activity.status);
  const categoryInfo = getCategoryBadge(activity.category);

  // Rough estimate of calories for fun fitness realism
  const estimatedCalories = Math.round(activity.durationMinutes * 7.5);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Top App Bar */}
      <div className="px-4 pt-4 pb-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 shadow-2xs transition-colors">
        <button
          id="details-back-btn"
          onClick={onBack}
          className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold text-slate-900 dark:text-white">
          Activity Details
        </h1>
        <div className="w-8"></div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 pb-12">
        {/* Main Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center text-center relative overflow-hidden transition-colors">
          {/* Subtle Background Accent */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-50/70 dark:bg-blue-950/30 rounded-full blur-xl pointer-events-none"></div>

          {/* Activity Icon */}
          <div className="w-20 h-20 rounded-3xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 ring-8 ring-blue-50/50 dark:ring-slate-800/50 shadow-xs">
            <div className="scale-150">
              {getActivityIcon(activity.name)}
            </div>
          </div>

          {/* Activity Name */}
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {activity.name}
          </h2>

          {/* Status & Category Badges */}
          <div className="mt-2.5 flex items-center justify-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${statusInfo.bg}`}
            >
              <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`}></span>
              <span>{statusInfo.label}</span>
            </span>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${categoryInfo.bg}`}
            >
              <span className={`w-2 h-2 rounded-full ${categoryInfo.dot}`}></span>
              <span>{activity.category || 'Cardio'}</span>
            </span>
          </div>

          {/* Key Metrics Quick Row */}
          <div className="w-full grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-col items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                Duration
              </span>
              <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">
                {formatDuration(activity.durationMinutes)}
              </span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                Est. Energy
              </span>
              <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-amber-500" />
                <span>{estimatedCalories} kcal</span>
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Fields Cards */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Activity Information
          </h3>

          {/* Category Row */}
          <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-xs font-medium">
              <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Category</span>
            </div>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${categoryInfo.bg}`}>
              {activity.category || 'Cardio'}
            </span>
          </div>

          {/* Date Row */}
          <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-xs font-medium">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Date</span>
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {formatDateDisplay(activity.date)}
            </span>
          </div>

          {/* Duration Row */}
          <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-xs font-medium">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Duration</span>
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {activity.durationMinutes} minutes
            </span>
          </div>

          {/* Status Row */}
          <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Status</span>
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {activity.status}
            </span>
          </div>

          {/* Description */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-xs font-medium">
              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Description</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-3 text-xs text-slate-700 dark:text-slate-200 leading-relaxed border border-slate-100 dark:border-slate-800">
              {activity.description ? (
                activity.description
              ) : (
                <span className="text-slate-400 dark:text-slate-500 italic">No notes added for this activity.</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons: Blue "Edit" and Red "Delete" */}
        <div className="space-y-2.5 pt-2">
          {/* Blue Edit Button */}
          <button
            id="details-edit-btn"
            onClick={onEdit}
            className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Pencil className="w-4 h-4 stroke-[2.2]" />
            <span>Edit Activity</span>
          </button>

          {/* Red Delete Button */}
          <button
            id="details-delete-btn"
            onClick={onDeleteRequest}
            className="w-full py-3 px-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 active:scale-[0.99] text-rose-600 dark:text-rose-400 font-bold text-sm border border-rose-200 dark:border-rose-900/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4 stroke-[2.2]" />
            <span>Delete Activity</span>
          </button>
        </div>
      </div>
    </div>
  );
};

