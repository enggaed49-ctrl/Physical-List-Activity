export type ActivityStatus = 'Completed' | 'Ongoing' | 'Not Started';

export type ActivityCategory =
  | 'Cardio'
  | 'Strength'
  | 'Flexibility'
  | 'Sports'
  | 'Recovery'
  | 'Other';

export interface Activity {
  id: string;
  userId?: string;
  name: string;
  date: string; // YYYY-MM-DD format
  durationMinutes: number;
  status: ActivityStatus;
  category?: ActivityCategory | string;
  description?: string;
  createdAt: number;
}

export type Screen =
  | 'login'
  | 'signup'
  | 'dashboard'
  | 'list'
  | 'add'
  | 'details'
  | 'edit'
  | 'profile'
  | 'statistics';

export type BottomNavTab = 'dashboard' | 'add' | 'list' | 'profile';

export type ActivityFilter = 'All' | 'Completed' | 'Ongoing' | 'Not Started';

export type StatPeriod = 'Weekly' | 'Monthly' | 'Yearly';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  subtitle: string;
  avatarUrl?: string;
  presetAvatar?: string;
  dailyGoalMinutes: number;
  defaultActivity: string;
  createdAt: number;
}

export interface UserProfile {
  name: string;
  subtitle: string;
  avatarUrl?: string;
  presetAvatar?: string;
}

export interface WorkoutLap {
  lapNumber: number;
  timeSeconds: number;
  splitSeconds: number;
}

export interface WorkoutSession {
  isActive: boolean;
  isPaused: boolean;
  activityName: string;
  secondsElapsed: number;
  startedAt: number;
  laps: WorkoutLap[];
}
