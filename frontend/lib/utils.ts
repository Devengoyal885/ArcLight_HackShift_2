import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function daysUntil(dateString: string): number {
  const now = new Date();
  const target = new Date(dateString);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function formatDeadline(dateString: string): string {
  const days = daysUntil(dateString);
  if (days < 0) return 'Overdue';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days <= 7) return `${days} days`;
  return formatDate(dateString);
}

export function getScoreColor(score: number): string {
  if (score >= 85) return 'text-emerald-400';
  if (score >= 70) return 'text-blue-400';
  if (score >= 55) return 'text-amber-400';
  return 'text-red-400';
}

export function getScoreBg(score: number): string {
  if (score >= 85) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  if (score >= 70) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  if (score >= 55) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  return 'bg-red-500/20 text-red-400 border-red-500/30';
}

export function getTrendIcon(trend: string): string {
  if (trend === 'rising') return '↑';
  if (trend === 'declining') return '↓';
  return '→';
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
