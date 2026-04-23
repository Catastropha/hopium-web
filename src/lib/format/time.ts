/**
 * Time / countdown formatting. All inputs are ISO 8601 strings from the API.
 * Outputs: "2d 4h", "48m", "5 min ago", etc.
 */

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** Short countdown: "2d 4h", "3h 12m", "45m", "20s", or "ended". */
export function formatCountdown(deadline: string, now: number = Date.now()): string {
  const diff = Date.parse(deadline) - now;
  if (!Number.isFinite(diff)) return '—';
  if (diff <= 0) return 'ended';

  const days = Math.floor(diff / DAY);
  const hours = Math.floor((diff % DAY) / HOUR);
  const minutes = Math.floor((diff % HOUR) / MIN);
  const seconds = Math.floor((diff % MIN) / 1000);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

/** Relative past: "5 min ago", "2h ago", "3d ago", "just now". */
export function formatRelativePast(iso: string, now: number = Date.now()): string {
  const diff = now - Date.parse(iso);
  if (!Number.isFinite(diff) || diff < 0) return 'just now';
  if (diff < MIN) return 'just now';
  if (diff < HOUR) return `${Math.floor(diff / MIN)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  return `${Math.floor(diff / DAY)}d ago`;
}

/** Fixed date: "Apr 23" (short) or "Apr 23 · 14:30" (withTime). */
export function formatDate(iso: string, opts: { withTime?: boolean } = {}): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  if (!opts.withTime) return dateStr;
  const timeStr = date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${dateStr} · ${timeStr}`;
}
