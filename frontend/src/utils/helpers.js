import { clsx } from 'clsx';

export const cn = (...classes) => clsx(classes);

export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export const getInitials = (firstName = '', lastName = '') =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

export const getAvatarUrl = (avatar) => {
  if (!avatar) return null;
  if (avatar.startsWith('http')) return avatar;
  return `http://localhost:5000${avatar}`;
};

export const getBudgetColor = (percentage) => {
  if (percentage >= 100) return 'text-red-500';
  if (percentage >= 80)  return 'text-amber-500';
  return 'text-emerald-500';
};

export const getBudgetBgColor = (percentage) => {
  if (percentage >= 100) return 'bg-red-500';
  if (percentage >= 80)  return 'bg-amber-500';
  return 'bg-emerald-500';
};

export const getCurrentMonthYear = () => {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
};

export const truncate = (str, n = 30) =>
  str?.length > n ? `${str.slice(0, n)}…` : str;
