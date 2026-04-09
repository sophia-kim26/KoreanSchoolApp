export interface Shift {
  id: number;
  ta_id: number;
  clock_in: string;
  clock_out: string | null;
}

export interface TA {
  id: number;
  first_name: string;
  last_name: string;
  session_day: string; // 'Friday' | 'Saturday' | 'Both'
}

export interface EditedShift {
  clock_in: string;
  clock_out: string;
}

export interface NewShift {
  clock_in: string;
  clock_out: string;
}

export type RouteParams = Record<string, string | undefined> & {
  ta_id: string;
};