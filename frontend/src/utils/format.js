import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

export const formatNumber = (num) =>
  new Intl.NumberFormat('en-US').format(num || 0);

export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d, yyyy');
};

export const formatDateFull = (date) =>
  date ? format(new Date(date), 'MMMM d, yyyy') : '';

export const formatDateTime = (date) =>
  date ? format(new Date(date), 'MMM d, yyyy · h:mm a') : '';

export const formatTimeAgo = (date) =>
  date ? formatDistanceToNow(new Date(date), { addSuffix: true }) : '';

export const formatMonth = (month, year) => {
  const d = new Date(year, month - 1);
  return format(d, 'MMMM yyyy');
};

export const formatPercent = (value) => `${Math.round(value || 0)}%`;

export const getMonthName = (month) =>
  new Date(2000, month - 1).toLocaleString('default', { month: 'long' });

export const shortenCurrency = (amount) => {
  if (Math.abs(amount) >= 1_000_000)
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (Math.abs(amount) >= 1_000)
    return `$${(amount / 1_000).toFixed(1)}K`;
  return formatCurrency(amount);
};
