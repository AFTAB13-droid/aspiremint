/**
 * DIWALI LAUNCH COUNTDOWN & FEATURE LOCK HELPER
 * Target Launch: Sunday, Nov 8, 2026 at 10:00:00 AM IST
 */

export const DIWALI_LAUNCH_DATE_STR = "2026-11-08T10:00:00+05:30";

export interface DiwaliCountdownState {
  isLive: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
}

export function getDiwaliTimeRemaining(): DiwaliCountdownState {
  const target = new Date(DIWALI_LAUNCH_DATE_STR).getTime();
  const now = new Date().getTime();
  const diff = target - now;

  if (diff <= 0) {
    return {
      isLive: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      formatted: "00:00:00",
    };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const formatted = `${days > 0 ? `${days}d ` : ""}${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;

  return {
    isLive: false,
    days,
    hours,
    minutes,
    seconds,
    formatted,
  };
}
