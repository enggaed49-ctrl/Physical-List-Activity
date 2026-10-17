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
  name: string;
  date: string; // YYYY-MM-DD format for storage/picker
  durationMinutes: number;
  status: ActivityStatus;
  category?: ActivityCategory | string;
  description?: string;
  createdAt: number;
}

export type Screen = 
  | 'welcome'
  | 'home'
  | 'list'
  | 'add'
  | 'details'
  | 'edit'
  | 'profile'
  | 'statistics';

export type BottomNavTab = 'home' | 'add' | 'list' | 'profile';

export type ActivityFilter = 'All' | 'Completed' | 'Ongoing' | 'Not Started';

export type StatPeriod = 'Weekly' | 'Monthly' | 'Yearly';

export interface CloudSyncStatus {
  connected: boolean;
  tableExists: boolean;
  projectId: string;
  message: string;
  mode: 'cloud' | 'local';
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

export interface UserProfile {
  name: string;
  subtitle: string;
  avatarUrl?: string;
  presetAvatar?: string;
}
