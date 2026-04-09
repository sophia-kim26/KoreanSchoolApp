export const parseDateLocal = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const calculateHours = (clockIn: string | null, clockOut: string | null): string => {
  if (!clockIn || !clockOut) return '0';
  const start = new Date(clockIn);
  const end = new Date(clockOut);
  const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  return hours > 0 ? hours.toFixed(2) : '0';
};

export const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear().toString().slice(2)}`;
};

export const formatDateTimeLocal = (dateString: string | null): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const localToISO = (localDateTimeString: string): string | null => {
  if (!localDateTimeString) return null;
  const withSeconds = localDateTimeString.includes(':') && localDateTimeString.split(':').length === 2
    ? `${localDateTimeString}:00`
    : localDateTimeString;
  const date = new Date(withSeconds);
  return date.toISOString();
};