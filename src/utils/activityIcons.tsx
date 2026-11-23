import React from 'react';
import {
  Flame,
  Footprints,
  Dumbbell,
  Bike,
  Waves,
  HeartPulse,
  Compass,
  Zap,
  Activity as ActivityIcon,
  CheckCircle2,
  Clock,
  CircleDashed,
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

export function getStatusMeta(status: ActivityStatus) {
  switch (status) {
    case 'Completed':
      return {
        label: 'Completed',
        textClass: 'text-emerald-700 dark:text-emerald-400',
        icon: <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />,
      };
    case 'Ongoing':
      return {
        label: 'Ongoing',
        textClass: 'text-blue-700 dark:text-blue-400',
        icon: <Clock className="w-3.5 h-3.5 shrink-0" />,
      };
    case 'Not Started':
    default:
      return {
        label: 'Not Started',
        textClass: 'text-amber-700 dark:text-amber-400',
        icon: <CircleDashed className="w-3.5 h-3.5 shrink-0" />,
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
  return 'Cardio';
}

export function getCategoryColor(category?: string): string {
  const cat = category || 'Cardio';
  switch (cat) {
    case 'Cardio':
      return 'text-orange-700 dark:text-orange-400';
    case 'Strength':
      return 'text-indigo-700 dark:text-indigo-400';
    case 'Flexibility':
      return 'text-teal-700 dark:text-teal-400';
    case 'Sports':
      return 'text-amber-700 dark:text-amber-400';
    case 'Recovery':
      return 'text-sky-700 dark:text-sky-400';
    default:
      return 'text-slate-600 dark:text-slate-400';
  }
}
