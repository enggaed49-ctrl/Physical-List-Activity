import React, { useState } from 'react';
import {
  User,
  BarChart3,
  Settings,
  Info,
  Target,
  Plus,
  Minus,
  Camera,
  Pencil,
  LogOut,
  ListFilter,
  Moon,
  Sun,
} from 'lucide-react';
import { Activity, AuthUser, UserProfile } from '../types';
import { EditProfileModal, PRESET_AVATARS } from './EditProfileModal';

interface ProfileScreenProps {
  user: AuthUser;
  activities: Activity[];
  isDarkMode: boolean;
  onToggleDarkMode: (val: boolean) => void;
  onUpdateProfile: (updated: UserProfile) => Promise<void>;
  onSetDailyGoal: (mins: number) => Promise<void>;
  onNavigateToActivities: () => void;
  onNavigateToStatistics: () => void;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
  onLogout: () => void;
}

const GOAL_PRESETS = [15, 30, 45, 60, 90, 120];

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  activities,
  isDarkMode,
  onToggleDarkMode,
  onUpdateProfile,
  onSetDailyGoal,
  onNavigateToActivities,
  onNavigateToStatistics,
  onOpenSettings,
  onOpenAbout,
  onLogout,
}) => {
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const dailyGoalMinutes = user.dailyGoalMinutes || 60;
  const totalMinutes = activities.reduce((sum, a) => sum + (a.durationMinutes || 0), 0);
  const completedCount = activities.filter((a) => a.status === 'Completed').length;
  const activePresetObj = PRESET_AVATARS.find((p) => p.id === user.presetAvatar);

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;
  const todayMinutes = activities
    .filter((a) => a.date === todayStr)
    .reduce((sum, a) => sum + (a.durationMinutes || 0), 0);

  const goalPercent = Math.min(100, Math.round((todayMinutes / dailyGoalMinutes) * 100));

  const handleAdjustGoal = (newVal: number) => {
    const clamped = Math.max(10, Math.min(300, newVal));
    onSetDailyGoal(clamped);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Account & Profile
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage your personal details, daily fitness target, and preferences
        </p>
      </div>

      {/* 2-Col Desktop / 1-Col Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Account Identity Card (4 cols desktop) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center">
          <div className="relative mb-4">
            <button
              type="button"
              onClick={() => setIsEditProfileOpen(true)}
              className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-slate-100 dark:ring-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center cursor-pointer"
              title="Edit profile photo"
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : activePresetObj ? (
                <div className={`w-full h-full bg-gradient-to-tr ${activePresetObj.bg} flex items-center justify-center text-4xl`}>
                  {activePresetObj.icon}
                </div>
              ) : (
                <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center">
                  <User className="w-10 h-10" />
                </div>
              )}
            </button>

            <button
              id="profile-avatar-edit-btn"
              type="button"
              onClick={() => setIsEditProfileOpen(true)}
              aria-label="Change profile photo"
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center border-2 border-white dark:border-slate-900 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user.name}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{user.email}</p>
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-2">{user.subtitle}</p>

          {/* Metrics Row */}
          <div className="w-full grid grid-cols-3 gap-2 py-4 my-5 border-y border-slate-100 dark:border-slate-800 text-center">
            <div>
              <p className="text-lg font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                {activities.length}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Logged</p>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                {completedCount}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Done</p>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                {totalMinutes}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Mins</p>
            </div>
          </div>

          <div className="w-full space-y-2.5">
            <button
              id="profile-edit-profile-btn"
              type="button"
              onClick={() => setIsEditProfileOpen(true)}
              className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Pencil className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>

            <button
              id="profile-logout-btn"
              type="button"
              onClick={onLogout}
              className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Right Controls & Preferences (8 cols desktop) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Daily Goal Target Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Daily Activity Goal
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                    Today: {todayMinutes} / {dailyGoalMinutes} min ({goalPercent}%)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="goal-decrease-btn"
                  type="button"
                  onClick={() => handleAdjustGoal(dailyGoalMinutes - 10)}
                  aria-label="Decrease daily goal by 10 minutes"
                  className="min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="min-w-[76px] text-center text-base font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                  {dailyGoalMinutes} min
                </span>
                <button
                  id="goal-increase-btn"
                  type="button"
                  onClick={() => handleAdjustGoal(dailyGoalMinutes + 10)}
                  aria-label="Increase daily goal by 10 minutes"
                  className="min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-300"
                style={{ width: `${goalPercent}%` }}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {GOAL_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleAdjustGoal(preset)}
                  className={`min-h-[40px] sm:min-h-[34px] px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono tabular-nums cursor-pointer ${
                    dailyGoalMinutes === preset
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {preset}m
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links & Settings */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            <button
              id="profile-menu-activities"
              type="button"
              onClick={onNavigateToActivities}
              className="w-full min-h-[64px] px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <ListFilter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">My Activities</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Browse and filter your recorded workouts</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Open</span>
            </button>

            <button
              id="profile-menu-stats"
              type="button"
              onClick={onNavigateToStatistics}
              className="w-full min-h-[64px] px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Statistics</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Weekly, monthly, and yearly breakdowns</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Open</span>
            </button>

            <div className="w-full min-h-[64px] px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                {isDarkMode ? <Moon className="w-5 h-5 text-blue-500" /> : <Sun className="w-5 h-5 text-amber-500" />}
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Appearance</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isDarkMode ? 'Dark mode enabled' : 'Light mode enabled'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onToggleDarkMode(!isDarkMode)}
                className="min-h-[40px] px-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Switch to {isDarkMode ? 'Light' : 'Dark'}
              </button>
            </div>

            <button
              id="profile-menu-settings"
              type="button"
              onClick={onOpenSettings}
              className="w-full min-h-[64px] px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <Settings className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Preferences & Data</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Quick-start defaults and starter data</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Manage</span>
            </button>

            <button
              id="profile-menu-about"
              type="button"
              onClick={onOpenAbout}
              className="w-full min-h-[64px] px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <Info className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">About Physical List</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">App overview and account privacy</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">View</span>
            </button>
          </div>
        </div>
      </div>

      {isEditProfileOpen && (
        <EditProfileModal
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          profile={{
            name: user.name,
            subtitle: user.subtitle,
            avatarUrl: user.avatarUrl,
            presetAvatar: user.presetAvatar,
          }}
          onSave={(updated) => {
            onUpdateProfile(updated);
          }}
        />
      )}
    </div>
  );
};
