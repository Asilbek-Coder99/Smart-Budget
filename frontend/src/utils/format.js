import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { uz as dateFnsUz } from 'date-fns/locale/uz';
import { ru as dateFnsRu } from 'date-fns/locale/ru';
import { enUS }            from 'date-fns/locale';

// Tanlangan tilga mos date-fns locale
const getLocale = () => {
  const lang = localStorage.getItem('lang') || 'uz';
  if (lang === 'ru') return dateFnsRu;
  if (lang === 'en') return enUS;
  return dateFnsUz;
};

export const formatCurrency = (amount, currency = 'USD') => {
  const lang = localStorage.getItem('lang') || 'uz';
  const locale = lang === 'ru' ? 'ru-RU' : lang === 'uz' ? 'uz-UZ' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency', currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

export const formatNumber = (num) =>
  new Intl.NumberFormat().format(num || 0);

export const formatDate = (date) => {
  if (!date) return '';
  const lang = localStorage.getItem('lang') || 'uz';
  const d = new Date(date);
  if (isToday(d))     return lang==='uz' ? 'Bugun'  : lang==='ru' ? 'Сегодня'  : 'Today';
  if (isYesterday(d)) return lang==='uz' ? 'Kecha'   : lang==='ru' ? 'Вчера'    : 'Yesterday';
  return format(d, 'd MMM yyyy', { locale: getLocale() });
};

export const formatDateFull = (date) =>
  date ? format(new Date(date), 'd MMMM yyyy', { locale: getLocale() }) : '';

export const formatDateTime = (date) =>
  date ? format(new Date(date), 'd MMM yyyy, HH:mm', { locale: getLocale() }) : '';

export const formatTimeAgo = (date) =>
  date ? formatDistanceToNow(new Date(date), { addSuffix: true, locale: getLocale() }) : '';

export const formatMonth = (month, year) => {
  const d = new Date(year, month - 1);
  return format(d, 'MMMM yyyy', { locale: getLocale() });
};

export const formatPercent = (value) => `${Math.round(value || 0)}%`;

export const getMonthName = (month) => {
  const d = new Date(2000, month - 1);
  return format(d, 'MMMM', { locale: getLocale() });
};

export const shortenCurrency = (amount) => {
  const lang = localStorage.getItem('lang') || 'uz';
  const M = lang === 'ru' ? 'млн' : lang === 'uz' ? 'mln' : 'M';
  const K = lang === 'ru' ? 'тыс' : lang === 'uz' ? 'ming' : 'K';
  if (Math.abs(amount) >= 1_000_000) return `$${(amount/1_000_000).toFixed(1)}${M}`;
  if (Math.abs(amount) >= 1_000)     return `$${(amount/1_000).toFixed(1)}${K}`;
  return formatCurrency(amount);
};
