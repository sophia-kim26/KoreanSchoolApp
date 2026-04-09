export const DATE_REGEX = /^\d{4}_\d{2}_\d{2}$/;

export const generatePIN = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const formatDateKey = (year: number, month: number, day: number): string => {
  const m = (month + 1).toString().padStart(2, '0');
  const d = day.toString().padStart(2, '0');
  return `${year}-${m}-${d}`;
};

export const isDateInPast = (dateKey: string): boolean => {
  const [year, month, day] = dateKey.split('_').map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

export const getDaysInMonth = (date: Date): { daysInMonth: number; startingDayOfWeek: number } => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  return { daysInMonth: lastDay.getDate(), startingDayOfWeek: firstDay.getDay() };
};

export const MONTH_NAMES: string[] = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];