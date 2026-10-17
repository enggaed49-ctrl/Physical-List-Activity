import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  Clock, 
  FileText, 
  Tag, 
  CheckCircle2, 
  AlertCircle,
  Layers
} from 'lucide-react';
import { Activity, ActivityStatus, ActivityCategory } from '../types';
import { detectCategoryFromName } from '../utils/activityIcons';
import { SuccessDialog } from './SuccessDialog';

interface EditActivityScreenProps {
  activity: Activity;
  onUpdate: (updated: Activity) => void;
  onCancel: () => void;
}

const PRESET_NAMES = ['Running', 'Gym', 'Cycling', 'Yoga', 'Swimming', 'Walking'];
const PRESET_DURATIONS = [15, 30, 45, 60];
const CATEGORIES: ActivityCategory[] = ['Cardio', 'Strength', 'Flexibility', 'Sports', 'Recovery', 'Other'];

export const EditActivityScreen: React.FC<EditActivityScreenProps> = ({
  activity,
  onUpdate,
  onCancel,
}) => {
  // Pre-fill fields from activity
  const [name, setName] = useState(activity.name);
  const [date, setDate] = useState(activity.date);
  const [duration, setDuration] = useState(String(activity.durationMinutes));
  const [status, setStatus] = useState<ActivityStatus>(activity.status);
  const [category, setCategory] = useState<ActivityCategory>(
    (activity.category as ActivityCategory) || (detectCategoryFromName(activity.name) as ActivityCategory) || 'Cardio'
  );
  const [description, setDescription] = useState(activity.description || '');

  // Validation States
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Activity Name is required.';
    }

    if (!date) {
      newErrors.date = 'Date is required.';
    }

    const durNumber = Number(duration);
    if (!duration || isNaN(durNumber) || durNumber <= 0) {
      newErrors.duration = 'Please enter a valid duration in minutes.';
    }

    if (!status) {
      newErrors.status = 'Status is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setShowSuccessDialog(true);
  };

  const handleConfirmSuccess = () => {
    setShowSuccessDialog(false);
    onUpdate({
      ...activity,
      name: name.trim(),
      date,
      durationMinutes: Number(duration),
      status,
      category,
      description: description.trim() || undefined,
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900 transition-colors">
      {/* Top App Bar */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
        <button
          id="edit-back-btn"
          onClick={onCancel}
          className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold text-slate-900 dark:text-white">
          Edit Activity
        </h1>
        <div className="w-8"></div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Activity Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Activity Name</span>
            <span className="text-rose-500">*</span>
          </label>
          <input
            id="edit-activity-name-input"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
            }}
            placeholder="e.g. Running, Gym, Yoga"
            className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
              errors.name
                ? 'border-rose-400 focus:ring-rose-200 dark:focus:ring-rose-900/30'
                : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500/20 focus:border-blue-500'
            }`}
          />
          {errors.name && (
            <p className="text-[11px] text-rose-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>{errors.name}</span>
            </p>
          )}

          {/* Quick Preset Pills */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mr-0.5">Quick:</span>
            {PRESET_NAMES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setName(item);
                  setCategory(detectCategoryFromName(item) as ActivityCategory);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                }}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                  name.toLowerCase() === item.toLowerCase()
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Category Selection Dropdown */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Category</span>
              <span className="text-rose-500">*</span>
            </label>
            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
              {category}
            </span>
          </div>

          <div className="relative">
            <select
              id="edit-activity-category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value as ActivityCategory)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
            >
              <option value="Cardio" className="dark:bg-slate-800 dark:text-white">Cardio (Running, Cycling, Swimming, Walking)</option>
              <option value="Strength" className="dark:bg-slate-800 dark:text-white">Strength (Gym, Weights, Calisthenics)</option>
              <option value="Flexibility" className="dark:bg-slate-800 dark:text-white">Flexibility (Yoga, Pilates, Stretching)</option>
              <option value="Sports" className="dark:bg-slate-800 dark:text-white">Sports (Basketball, Tennis, Football)</option>
              <option value="Recovery" className="dark:bg-slate-800 dark:text-white">Recovery (Sauna, Foam Rolling, Mobility)</option>
              <option value="Other" className="dark:bg-slate-800 dark:text-white">Other</option>
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 text-xs">
              ▼
            </div>
          </div>

          {/* Category Quick Chips */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  id={`edit-cat-chip-${cat.toLowerCase()}`}
                  onClick={() => setCategory(cat)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all cursor-pointer font-medium ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-xs'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Date */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <CalendarIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Date</span>
            <span className="text-rose-500">*</span>
          </label>
          <input
            id="edit-activity-date-input"
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              if (errors.date) setErrors((prev) => ({ ...prev, date: '' }));
            }}
            className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all ${
              errors.date
                ? 'border-rose-400 focus:ring-rose-200 dark:focus:ring-rose-900/30'
                : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500/20 focus:border-blue-500'
            }`}
          />
          {errors.date && (
            <p className="text-[11px] text-rose-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>{errors.date}</span>
            </p>
          )}
        </div>

        {/* Duration (minutes) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Duration (minutes)</span>
            <span className="text-rose-500">*</span>
          </label>
          <input
            id="edit-activity-duration-input"
            type="number"
            min="1"
            max="1440"
            value={duration}
            onChange={(e) => {
              setDuration(e.target.value);
              if (errors.duration) setErrors((prev) => ({ ...prev, duration: '' }));
            }}
            className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all ${
              errors.duration
                ? 'border-rose-400 focus:ring-rose-200 dark:focus:ring-rose-900/30'
                : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500/20 focus:border-blue-500'
            }`}
          />
          {errors.duration && (
            <p className="text-[11px] text-rose-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>{errors.duration}</span>
            </p>
          )}

          {/* Quick Duration Pills */}
          <div className="flex items-center gap-2 pt-1">
            {PRESET_DURATIONS.map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => {
                  setDuration(String(mins));
                  if (errors.duration) setErrors((prev) => ({ ...prev, duration: '' }));
                }}
                className={`text-[11px] px-3 py-1 rounded-full border transition-all cursor-pointer ${
                  duration === String(mins)
                    ? 'bg-blue-600 border-blue-600 text-white font-bold'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                }`}
              >
                {mins} min
              </button>
            ))}
          </div>
        </div>

        {/* Status Dropdown */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Status</span>
            <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <select
              id="edit-activity-status-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as ActivityStatus)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
            >
              <option value="Completed" className="dark:bg-slate-800 dark:text-white">Completed</option>
              <option value="Ongoing" className="dark:bg-slate-800 dark:text-white">Ongoing</option>
              <option value="Not Started" className="dark:bg-slate-800 dark:text-white">Not Started</option>
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 text-xs">
              ▼
            </div>
          </div>
        </div>

        {/* Description (optional) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>Description (optional)</span>
          </label>
          <textarea
            id="edit-activity-description-input"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a short note..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
          />
        </div>

        {/* Blue "Update" Button */}
        <div className="pt-2 pb-6">
          <button
            type="submit"
            id="update-activity-btn"
            className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Update</span>
          </button>
        </div>
      </form>

      {/* Success Confirmation Dialog */}
      <SuccessDialog
        isOpen={showSuccessDialog}
        title="Activity Updated!"
        message="Your activity details have been updated successfully."
        onClose={handleConfirmSuccess}
      />
    </div>
  );
};
