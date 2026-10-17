import React, { useState } from 'react';
import { 
  User, 
  ListFilter, 
  BarChart3, 
  Settings, 
  Info, 
  ChevronRight, 
  Sparkles, 
  ShieldCheck, 
  Flame, 
  Trophy, 
  RotateCcw, 
  Database,
  Target,
  Plus,
  Minus,
  CheckCircle2,
  Camera,
  Pencil
} from 'lucide-react';
import { Activity, CloudSyncStatus, UserProfile } from '../types';
import { EditProfileModal, PRESET_AVATARS } from './EditProfileModal';

interface ProfileScreenProps {
  activities: Activity[];
  cloudStatus: CloudSyncStatus;
  userProfile?: UserProfile;
  onUpdateProfile?: (updated: UserProfile) => void;
  dailyGoalMinutes?: number;
  onSetDailyGoal?: (mins: number) => void;
  onNavigateToActivities: () => void;
  onNavigateToStatistics: () => void;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
  onOpenWelcome: () => void;
  onOpenSupabase: () => void;
}

const GOAL_PRESETS = [15, 30, 45, 60, 90, 120];

const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Guest User',
  subtitle: 'Stay active, stay healthy!',
};

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  activities,
  cloudStatus,
  userProfile = DEFAULT_USER_PROFILE,
  onUpdateProfile,
  dailyGoalMinutes = 60,
  onSetDailyGoal,
  onNavigateToActivities,
  onNavigateToStatistics,
  onOpenSettings,
  onOpenAbout,
  onOpenWelcome,
  onOpenSupabase,
}) => {
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const totalMinutes = activities.reduce((sum, a) => sum + (a.durationMinutes || 0), 0);
  const completedCount = activities.filter((a) => a.status === 'Completed').length;
  const isCloudSynced = cloudStatus.connected && cloudStatus.tableExists;

  const activePresetObj = PRESET_AVATARS.find((p) => p.id === userProfile.presetAvatar);

  // Calculate today's active minutes
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
    if (onSetDailyGoal) {
      onSetDailyGoal(clamped);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5 pb-12 bg-slate-50/50 dark:bg-slate-950 transition-colors">
      {/* Profile Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center text-center relative overflow-hidden transition-colors">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/60 dark:bg-blue-950/30 rounded-full blur-2xl pointer-events-none"></div>

        {/* User Avatar with Photo / Preset / Upload Trigger */}
        <div className="relative mb-3 group">
          <div 
            onClick={() => setIsEditProfileOpen(true)}
            className="w-20 h-20 rounded-full overflow-hidden shadow-lg shadow-blue-500/20 ring-4 ring-blue-50 dark:ring-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
            title="Click to change profile photo"
          >
            {userProfile.avatarUrl ? (
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.name}
                className="w-full h-full object-cover"
              />
            ) : activePresetObj ? (
              <div className={`w-full h-full bg-gradient-to-tr ${activePresetObj.bg} flex items-center justify-center text-3xl shadow-inner`}>
                {activePresetObj.icon}
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-sky-400 text-white flex items-center justify-center">
                <User className="w-10 h-10 stroke-[2]" />
              </div>
            )}
          </div>

          {/* Quick Edit Camera Button */}
          <button
            id="profile-avatar-edit-btn"
            onClick={() => setIsEditProfileOpen(true)}
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-md cursor-pointer transition-all"
            title="Change Profile Photo"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Name & Subtitle */}
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {userProfile.name}
        </h2>
        <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
          {userProfile.subtitle}
        </p>

        {/* Edit Profile Button */}
        <button
          id="profile-edit-profile-btn"
          onClick={() => setIsEditProfileOpen(true)}
          className="mt-2.5 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 dark:hover:text-blue-400 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
        >
          <Pencil className="w-3 h-3 stroke-[2.2]" />
          <span>Edit Profile & Photo</span>
        </button>

        {/* Badges */}
        <div className="flex items-center gap-2 mt-3">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50">
            <ShieldCheck className="w-3 h-3" />
            <span>Open Access Mode</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-900/50">
            <Trophy className="w-3 h-3" />
            <span>Fitness Explorer</span>
          </span>
        </div>

        {/* Quick Highlights */}
        <div className="w-full grid grid-cols-2 gap-2.5 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-2.5 text-center">
            <span className="text-xs text-slate-400 dark:text-slate-400 font-medium">Completed</span>
            <p className="text-base font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">
              {completedCount} / {activities.length}
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-2.5 text-center">
            <span className="text-xs text-slate-400 dark:text-slate-400 font-medium">Active Time</span>
            <p className="text-base font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">
              {Math.round(totalMinutes / 60 * 10) / 10} hrs
            </p>
          </div>
        </div>
      </div>

      {/* Daily Goal Setting Section */}
      <div 
        id="profile-daily-goal-card"
        className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-blue-100 dark:border-slate-800 shadow-sm space-y-4 transition-colors"
      >
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Target className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Daily Goal Target</h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-400">Target active minutes per day</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
              {dailyGoalMinutes}
            </span>
            <span className="text-[11px] font-bold text-slate-400 ml-1">mins</span>
          </div>
        </div>

        {/* Stepper & Slider Controls */}
        <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center justify-between gap-3">
            <button
              id="profile-goal-decrease-btn"
              onClick={() => handleAdjustGoal(dailyGoalMinutes - 5)}
              disabled={dailyGoalMinutes <= 10}
              className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-600 active:scale-95 disabled:opacity-40 transition-all cursor-pointer shadow-xs"
              title="Decrease by 5 mins"
            >
              <Minus className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Slider */}
            <input
              id="profile-goal-slider"
              type="range"
              min="10"
              max="180"
              step="5"
              value={dailyGoalMinutes}
              onChange={(e) => handleAdjustGoal(Number(e.target.value))}
              className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />

            <button
              id="profile-goal-increase-btn"
              onClick={() => handleAdjustGoal(dailyGoalMinutes + 5)}
              disabled={dailyGoalMinutes >= 300}
              className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-600 active:scale-95 disabled:opacity-40 transition-all cursor-pointer shadow-xs"
              title="Increase by 5 mins"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-0.5">
            <span>10m</span>
            <span>60m (Default)</span>
            <span>120m</span>
            <span>180m</span>
          </div>
        </div>

        {/* Quick Presets */}
        <div>
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            Quick Presets
          </p>
          <div className="grid grid-cols-6 gap-1.5">
            {GOAL_PRESETS.map((mins) => {
              const isSelected = dailyGoalMinutes === mins;
              return (
                <button
                  key={mins}
                  id={`profile-goal-preset-${mins}`}
                  onClick={() => handleAdjustGoal(mins)}
                  className={`py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs scale-[1.03]'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {mins}m
                </button>
              );
            })}
          </div>
        </div>

        {/* Today's Goal Progress Preview */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Today's Progress</span>
            <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
              {todayMinutes} / {dailyGoalMinutes} mins ({goalPercent}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                goalPercent >= 100
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-blue-600 to-sky-400'
              }`}
              style={{ width: `${goalPercent}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">
            {goalPercent >= 100
              ? '🎉 Daily goal met for today! Great dedication!'
              : `${Math.max(0, dailyGoalMinutes - todayMinutes)} mins remaining today to hit your goal.`}
          </p>
        </div>
      </div>

      {/* Menu Options Group */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-2 border border-slate-100 dark:border-slate-800 shadow-sm space-y-1 transition-colors">
        {/* Menu item 1: My Activities */}
        <button
          id="profile-menu-activities"
          onClick={onNavigateToActivities}
          className="w-full p-3.5 rounded-2xl flex items-center justify-between hover:bg-blue-50/60 dark:hover:bg-slate-800/70 active:bg-blue-50 dark:active:bg-slate-800 transition-colors group text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <ListFilter className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">My Activities</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-400">View and manage all recorded items</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
        </button>

        {/* Menu item 2: Statistics */}
        <button
          id="profile-menu-stats"
          onClick={onNavigateToStatistics}
          className="w-full p-3.5 rounded-2xl flex items-center justify-between hover:bg-blue-50/60 dark:hover:bg-slate-800/70 active:bg-blue-50 dark:active:bg-slate-800 transition-colors group text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Statistics</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-400">Activity breakdown and metrics</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
        </button>

        {/* Menu item 3: Settings */}
        <button
          id="profile-menu-settings"
          onClick={onOpenSettings}
          className="w-full p-3.5 rounded-2xl flex items-center justify-between hover:bg-blue-50/60 dark:hover:bg-slate-800/70 active:bg-blue-50 dark:active:bg-slate-800 transition-colors group text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center group-hover:bg-slate-700 dark:group-hover:bg-slate-600 group-hover:text-white transition-colors">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Settings</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-400">App preferences & dark mode</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
        </button>

        {/* Menu item 5: About */}
        <button
          id="profile-menu-about"
          onClick={onOpenAbout}
          className="w-full p-3.5 rounded-2xl flex items-center justify-between hover:bg-blue-50/60 dark:hover:bg-slate-800/70 active:bg-blue-50 dark:active:bg-slate-800 transition-colors group text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">About</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-400">App information and version</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
        </button>
      </div>

      {/* Secondary utility: Re-visit Splash screen */}
      <div className="pt-1 text-center">
        <button
          onClick={onOpenWelcome}
          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>View Welcome Screen</span>
        </button>
      </div>

      {/* Edit Profile & Photo Modal */}
      {isEditProfileOpen && (
        <EditProfileModal
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          profile={userProfile}
          onSave={(updated) => {
            if (onUpdateProfile) {
              onUpdateProfile(updated);
            }
          }}
        />
      )}
    </div>
  );
};
