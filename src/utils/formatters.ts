export function parseLocalDateMs(dateStr: string): number {
  if (!dateStr) return NaN;
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => isNaN(n))) {
    const fallback = new Date(dateStr).getTime();
    return fallback;
  }
  const [year, month, day] = parts;
  return new Date(year, month - 1, day).getTime();
}

export function getTodayLocalDateString(): string {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return dateStr;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '0 min';
  if (minutes === 60) return '1 hr';
  if (minutes % 60 === 0) return `${minutes / 60} hrs`;
  if (minutes > 60) {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  }
  return `${minutes} min`;
}

export function estimateActivityCalories(activityName: string, minutes: number): number {
  if (!minutes || minutes <= 0) return 0;
  const lower = (activityName || '').toLowerCase();
  let calPerMin = 7;
  if (lower.includes('run') || lower.includes('jog')) calPerMin = 11;
  else if (lower.includes('gym') || lower.includes('work') || lower.includes('lift') || lower.includes('strength')) calPerMin = 8;
  else if (lower.includes('cycl') || lower.includes('bike') || lower.includes('ride')) calPerMin = 9;
  else if (lower.includes('swim')) calPerMin = 10;
  else if (lower.includes('yoga') || lower.includes('stretch') || lower.includes('pilates')) calPerMin = 4;
  else if (lower.includes('walk') || lower.includes('hike')) calPerMin = 4.5;
  return Math.round(minutes * calPerMin);
}

export function formatDateTimeDisplay(timestampMs?: number): string {
  if (!timestampMs || isNaN(timestampMs)) return '';
  try {
    return new Date(timestampMs).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}
