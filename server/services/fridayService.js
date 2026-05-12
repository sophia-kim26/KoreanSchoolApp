import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

const sql = neon(process.env.DATABASE_URL);

export const getAllFridayData = async () => {
  console.log('NEW getAllFridayData running');
  try {
    const calendarDates = await sql`SELECT date FROM calendar_dates ORDER BY date`;
    if (calendarDates.length === 0) return [];

    const allTAs = await sql`SELECT id, first_name, last_name, email, korean_name, classroom, session_day FROM ta_list WHERE is_active = true AND (session_day = 'Friday' OR session_day = 'Both') ORDER BY id`;
    if (allTAs.length === 0) return [];

    const shifts = await sql`
      SELECT 
        s.ta_id,
        TO_CHAR(s.clock_in AT TIME ZONE 'America/New_York', 'YYYY_MM_DD') as shift_date,
        (s.clock_out IS NOT NULL) as completed
      FROM shifts s
      INNER JOIN ta_list t ON s.ta_id = t.id
      WHERE s.clock_in IS NOT NULL AND t.is_active = true AND (t.session_day = 'Friday' OR t.session_day = 'Both')
    `;

    const shiftMap = {};
    for (const shift of shifts) {
      if (!shiftMap[shift.ta_id]) shiftMap[shift.ta_id] = {};
      shiftMap[shift.ta_id][shift.shift_date] = shift.completed;
    }

    const selectedDates = calendarDates.map(row => row.date.replace(/-/g, '_'));

    return allTAs.map(row => {
      const taShifts = shiftMap[row.id] || {};
      const attendanceDates = selectedDates.filter(d => taShifts[d] === true);
      const absenceDates = selectedDates.filter(d => taShifts[d] === false);

      const dateColumns = {};
      selectedDates.forEach(dateKey => {
        dateColumns[dateKey] = taShifts[dateKey] ?? null;
      });

      return {
        ...row,
        attendance_count: attendanceDates.length,
        absence_count: absenceDates.length,
        ...dateColumns,
      };
    });

  } catch (error) {
    console.error('Error in getAllFridayData:', error);
    throw error;
  }
};

export const getCalendarDates = async () => {
  try {
    const result = await sql`SELECT date FROM calendar_dates ORDER BY date`;
    return { dates: result.map(row => row.date) };
  } catch (error) {
    console.error('Error in getCalendarDates:', error);
    return { dates: [] };
  }
};

export const saveCalendarDates = async (dates) => {
  try {
    // Delete all existing dates first
    await sql`DELETE FROM calendar_dates`;

    // Then insert the new dates
    if (dates && dates.length > 0) {
      for (const date of dates) {
        await sql`INSERT INTO calendar_dates (date) VALUES (${date})`;
      }
    }

    return { success: true, count: dates?.length ?? 0 };
  } catch (error) {
    console.error('Error in saveCalendarDates:', error);
    throw error;
  }
};