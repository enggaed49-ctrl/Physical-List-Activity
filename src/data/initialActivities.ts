import { Activity } from '../types';

export const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: 'act-1',
    name: 'Morning Run',
    date: '2025-04-26',
    durationMinutes: 30,
    status: 'Completed',
    category: 'Cardio',
    description: 'Brisk 5km morning run around the park. Felt energetic and refreshed!',
    createdAt: new Date('2025-04-26T07:30:00').getTime(),
  },
  {
    id: 'act-2',
    name: 'Workout',
    date: '2025-04-25',
    durationMinutes: 60,
    status: 'Completed',
    category: 'Strength',
    description: 'Full body strength training session focusing on chest and triceps.',
    createdAt: new Date('2025-04-25T17:00:00').getTime(),
  },
  {
    id: 'act-3',
    name: 'Cycling',
    date: '2025-04-25',
    durationMinutes: 45,
    status: 'Ongoing',
    category: 'Cardio',
    description: 'Evening ride along the scenic riverside trail. Halfway done.',
    createdAt: new Date('2025-04-25T18:30:00').getTime(),
  },
  {
    id: 'act-4',
    name: 'Yoga',
    date: '2025-04-23',
    durationMinutes: 60,
    status: 'Not Started',
    category: 'Flexibility',
    description: 'Planned restorative Vinyasa flow for flexibility and mental calm.',
    createdAt: new Date('2025-04-23T08:00:00').getTime(),
  },
  {
    id: 'act-5',
    name: 'Swimming',
    date: '2025-04-22',
    durationMinutes: 40,
    status: 'Not Started',
    category: 'Cardio',
    description: 'Lap swimming session scheduled at the community recreation pool.',
    createdAt: new Date('2025-04-22T16:00:00').getTime(),
  },
];

export const STORAGE_KEY = 'physical_list_activities_v1';
export const WELCOME_SEEN_KEY = 'physical_list_welcome_seen_v1';

export function loadStoredActivities(): Activity[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load activities from storage:', err);
  }
  return INITIAL_ACTIVITIES;
}

export function saveStoredActivities(activities: Activity[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
  } catch (err) {
    console.error('Failed to save activities to storage:', err);
  }
}

export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return dateStr;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '0 mins';
  if (minutes === 60) return '1 hour';
  if (minutes % 60 === 0) return `${minutes / 60} hours`;
  if (minutes > 60) {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs} hr ${mins} mins`;
  }
  return `${minutes} minutes`;
}
