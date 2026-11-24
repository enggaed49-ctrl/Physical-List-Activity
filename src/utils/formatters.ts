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
