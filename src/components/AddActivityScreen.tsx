import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  Tag,
  AlertCircle,
  Check,
} from 'lucide-react';
import { Activity, ActivityStatus, ActivityCategory } from '../types';
import { detectCategoryFromName } from '../utils/activityIcons';
import { getTodayLocalDateString } from '../utils/formatters';

interface AddActivityScreenProps {
  onSave: (activity: Omit<Activity, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
  onCancel: () => void;
}

const PRESET_NAMES = ['Running', 'Gym', 'Cycling', 'Yoga', 'Swimming', 'Walking'];
const PRESET_DURATIONS = [15, 30, 45, 60];
const CATEGORIES: ActivityCategory[] = ['Cardio', 'Strength', 'Flexibility', 'Sports', 'Recovery', 'Other'];

export const AddActivityScreen: React.FC<AddActivityScreenProps> = ({
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState('');
  const [date, setDate] = useState(() => getTodayLocalDateString());
  const [duration, setDuration] = useState('30');
  const [status, setStatus] = useState<ActivityStatus>('Completed');
  const [category, setCategory] = useState<ActivityCategory>('Cardio');
  const [categoryOverridden, setCategoryOverridden] = useState(false);
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) {
      newErrors.name = 'Activity name is required.';
    }
    if (!date) {
      newErrors.date = 'Date is required.';
    }
    const durNumber = Number(duration);
    if (!duration || isNaN(durNumber) || durNumber <= 0 || durNumber > 1440) {
      newErrors.duration = 'Please enter a duration between 1 and 1440 minutes.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        date,
        durationMinutes: Math.round(Number(duration)),
        status,
        category,
        description: description.trim() || undefined,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Desktop Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            id="add-back-btn"
            type="button"
            onClick={onCancel}
            className="hidden md:inline-flex min-h-[40px] min-w-[40px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Log Activity
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Record a workout or scheduled fitness activity
            </p>
          </div>
        </div>
      </div>

      {/* Form Grid (2-col desktop, 1-col mobile) */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Main Fields */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <label htmlFor="activity-name-input" className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
              Activity Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="activity-name-input"
                type="text"
                value={name}
                onChange={(e) => {
                  const val = e.target.value;
                  setName(val);
                  if (!categoryOverridden && val.trim()) {
                    setCategory(detectCategoryFromName(val) as ActivityCategory);
                  }
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                }}
                placeholder="e.g. Morning Run, Gym, Yoga"
                className={`w-full h-12 pl-10 pr-4 rounded-xl border text-base sm:text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                  errors.name
                    ? 'border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-200 dark:border-slate-700 focus:border-blue-600 focus:ring-blue-600/20'
                }`}
              />
            </div>
            {errors.name && (
              <p className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.name}</span>
              </p>
            )}

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2 pt-1">
              {PRESET_NAMES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setName(item);
                    setCategory(detectCategoryFromName(item) as ActivityCategory);
                    setCategoryOverridden(false);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  className={`min-h-[40px] sm:min-h-[34px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    name === item
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
              Category
            </span>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCategory(cat);
                    setCategoryOverridden(true);
                  }}
                  className={`min-h-[44px] sm:min-h-[38px] px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                    category === cat
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="activity-date-input" className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <CalendarIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="activity-date-input"
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    if (errors.date) setErrors((prev) => ({ ...prev, date: '' }));
                  }}
                  className="w-full h-12 pl-10 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base sm:text-sm text-slate-900 dark:text-white font-mono tabular-nums focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                />
              </div>
              {errors.date && (
                <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{errors.date}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="activity-duration-input" className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                Duration (minutes) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="activity-duration-input"
                  type="number"
                  min={1}
                  max={1440}
                  value={duration}
                  onChange={(e) => {
                    setDuration(e.target.value);
                    if (errors.duration) setErrors((prev) => ({ ...prev, duration: '' }));
                  }}
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base sm:text-sm text-slate-900 dark:text-white font-mono tabular-nums focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                />
              </div>
              {errors.duration && (
                <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{errors.duration}</p>
              )}
            </div>
          </div>

          {/* Duration Quick Presets */}
          <div className="flex flex-wrap gap-2">
            {PRESET_DURATIONS.map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => {
                  setDuration(String(mins));
                  if (errors.duration) setErrors((prev) => ({ ...prev, duration: '' }));
                }}
                className={`min-h-[40px] sm:min-h-[34px] px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono tabular-nums cursor-pointer ${
                  Number(duration) === mins
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {mins} min
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Status, Notes, Save */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
          {/* Status */}
          <div className="space-y-2">
            <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
              Status
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(['Completed', 'Ongoing', 'Not Started'] as ActivityStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`min-h-[44px] px-2.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                    status === st
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label htmlFor="activity-notes-input" className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
              Notes (optional)
            </label>
            <textarea
              id="activity-notes-input"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Distance, pace, sets, or how you felt..."
              className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 resize-none"
            />
          </div>

          {/* Thumb-Friendly Primary Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row-reverse gap-3">
            <button
              id="save-activity-btn"
              type="submit"
              disabled={isSaving}
              className="w-full sm:flex-1 min-h-[48px] px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.4]" />
              <span>{isSaving ? 'Saving...' : 'Save Activity'}</span>
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto min-h-[48px] px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
