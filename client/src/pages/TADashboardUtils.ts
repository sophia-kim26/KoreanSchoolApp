// Parse elapsed time string like "2hr30min" into decimal hours
export const parseElapsedToHours = (elapsed: string | null): number => {
  if (!elapsed) return 0;
  const match = elapsed.match(/(\d+)hr(\d+)min/);
  if (!match) return 0;
  return parseInt(match[1]) + parseInt(match[2]) / 60;
};

// Format a date string to MM/DD/YYYY
export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

// Format a date string to HH:MM:SS AM/PM
export const formatTime = (dateString: string | null): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

// Get auth headers for TA API requests
export const getTaAuthHeaders = (includeJson = false): HeadersInit => {
  const storedUser = localStorage.getItem('current_ta_user');
  let token: string | undefined;
  if (storedUser) {
    try {
      ({ token } = JSON.parse(storedUser));
    } catch (error) {
      console.error('Error parsing stored TA user:', error);
    }
  }
  if (!token) {
    token = localStorage.getItem('ta_token') || undefined;
  }
  if (!token) return includeJson ? { 'Content-Type': 'application/json' } : {};
  return includeJson
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { Authorization: `Bearer ${token}` };
};