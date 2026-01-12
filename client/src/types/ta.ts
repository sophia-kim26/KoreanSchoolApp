// types/ta.ts

interface TA {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  session_day: 'Friday' | 'Saturday' | 'Both';
  is_active: boolean;
  created_at: Date;
}

interface Shift {
  id: number;
  ta_id: number;
  clock_in: Date;
  clock_out: Date | null;
  was_manual: boolean;
  notes: string | null;
}