export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface ElapsedTime {
  hours: number;
  minutes: number;
}

export interface TADashboardProps {
  taId: number;
}

export interface Shift {
  id: number;
  ta_id: number;
  clock_in: string;
  clock_out: string | null;
  elapsed_time: number | null;
  attendance: string;
  notes: string;
}

export interface CurrentUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  classroom: string | null;
  token?: string; // necessary?
}

export interface ActiveShiftResponse {
  activeShift: {
    id: number;
    clock_in: string;
  } | null;
}

export type TabType = 'appearance' | 'navigation' | 'account' | 'privacy';
export type TextSize = 'S' | 'M' | 'L';

export const TEXT_SIZE_MAP: Record<TextSize, string> = {
  S: '13px',
  M: '16px',
  L: '20px',
};