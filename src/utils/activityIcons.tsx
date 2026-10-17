import React from 'react';
import {
  Flame,
  Footprints,
  Dumbbell,
  Bike,
  Waves,
  HeartPulse,
  Timer,
  Compass,
  Zap,
  Activity as ActivityIcon,
  CircleDot,
  CheckCircle2,
  Clock,
  CircleSlash,
} from 'lucide-react';
import { ActivityStatus } from '../types';

export function getActivityIcon(name: string): React.ReactNode {
  const lower = (name || '').toLowerCase();

  if (lower.includes('run') || lower.includes('jog')) {
    return <Footprints className="w-5 h-5" />;
  }
  if (lower.includes('work') || lower.includes('gym') || lower.includes('lift') || lower.includes('fitness')) {
    return <Dumbbell className="w-5 h-5" />;
  }
  if (lower.includes('cycl') || lower.includes('bike') || lower.includes('ride')) {
    return <Bike className="w-5 h-5" />;
  }
  if (lower.includes('swim') || lower.includes('water') || lower.includes('pool')) {
    return <Waves className="w-5 h-5" />;
  }
  if (lower.includes('yoga') || lower.includes('stretch') || lower.includes('pilates')) {
    return <HeartPulse className="w-5 h-5" />;
  }
  if (lower.includes('walk') || lower.includes('hike') || lower.includes('trek')) {
    return <Compass className="w-5 h-5" />;
  }
  if (lower.includes('sport') || lower.includes('ball') || lower.includes('court')) {
    return <Flame className="w-5 h-5" />;
  }
  if (lower.includes('hiit') || lower.includes('cardio')) {
    return <Zap className="w-5 h-5" />;
  }
  return <ActivityIcon className="w-5 h-5" />;
}

export function getStatusBadge(status: ActivityStatus) {
  switch (status) {
    case 'Completed':
      return {
        label: 'Completed',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      };
    case 'Ongoing':
      return {
        label: 'Ongoing',
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500',
        icon: <Clock className="w-3.5 h-3.5" />,
      };
    case 'Not Started':
    default:
      return {
        label: 'Not Started',
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
        icon: <CircleSlash className="w-3.5 h-3.5" />,
      };
  }
}

export function detectCategoryFromName(name: string): string {
  const lower = (name || '').toLowerCase();
  if (lower.includes('work') || lower.includes('gym') || lower.includes('lift') || lower.includes('strength') || lower.includes('chest') || lower.includes('squat')) {
    return 'Strength';
  }
  if (lower.includes('yoga') || lower.includes('stretch') || lower.includes('pilates') || lower.includes('flex')) {
    return 'Flexibility';
  }
  if (lower.includes('sport') || lower.includes('ball') || lower.includes('tennis') || lower.includes('soccer') || lower.includes('court')) {
    return 'Sports';
  }
  if (lower.includes('recover') || lower.includes('sauna') || lower.includes('rest') || lower.includes('massage')) {
    return 'Recovery';
  }
  if (lower.includes('run') || lower.includes('cycl') || lower.includes('bike') || lower.includes('swim') || lower.includes('walk') || lower.includes('jog') || lower.includes('hiit') || lower.includes('cardio')) {
    return 'Cardio';
  }
  return 'Cardio';
}

export function getCategoryBadge(category?: string) {
  const cat = category || 'Cardio';
  switch (cat) {
    case 'Cardio':
      return {
        label: 'Cardio',
        bg: 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/80',
        dot: 'bg-orange-500',
      };
    case 'Strength':
      return {
        label: 'Strength',
        bg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/80',
        dot: 'bg-indigo-500',
      };
    case 'Flexibility':
      return {
        label: 'Flexibility',
        bg: 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/80',
        dot: 'bg-teal-500',
      };
    case 'Sports':
      return {
        label: 'Sports',
        bg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/80',
        dot: 'bg-amber-500',
      };
    case 'Recovery':
      return {
        label: 'Recovery',
        bg: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/80',
        dot: 'bg-sky-500',
      };
    case 'Other':
    default:
      return {
        label: cat,
        bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        dot: 'bg-slate-400',
      };
  }
}

