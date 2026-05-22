export interface Shift {
  id: number;
  ta_id: number;
  clock_in: string;
  clock_out: string | null;
  notes: string | null;
  attendance: string | null;
}

export interface TA {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  high_school?: string;
  grade?: string;
  age?: string;
  gender?: string;
  address?: string;
  emergency_phone?: string;
  notes?: string;
  session_day: string;
  korean_name?: string;
}

export interface Parent {
  id?: number;
  englishName?: string;
  english_name?: string;
  koreanName?: string;
  korean_name?: string;
  phone?: string;
  email?: string;
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
