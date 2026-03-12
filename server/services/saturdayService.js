import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

const sql = neon(process.env.DATABASE_URL);

export const getAllSaturdayData = async () => {
  try {
    const calendarDates = await sql`SELECT date FROM calendar_dates ORDER BY date`;
    
    if (calendarDates.length === 0) return [];
    
    // Use a subquery to get counts so we don't have to list 20 columns in GROUP BY
    const allData = await sql`
      SELECT 
        f.*,
        COALESCE(counts.attendance_count, 0) as attendance_count,
        COALESCE(counts.absence_count, 0) as absence_count
      FROM saturday f
      LEFT JOIN (
        SELECT 
          ta_id,
          COUNT(CASE WHEN clock_out IS NOT NULL THEN 1 END) as attendance_count,
          COUNT(CASE WHEN clock_out IS NULL AND clock_in IS NOT NULL THEN 1 END) as absence_count
        FROM shifts
        GROUP BY ta_id
      ) counts ON f.id = counts.ta_id
      ORDER BY f.id
    `;
    
    if (allData.length === 0) return [];
    
    const selectedDates = calendarDates.map(row => row.date.replace(/-/g, '_'));
    const dateRegex = /^\d{4}_\d{2}_\d{2}$/;

    return allData.map(row => {
      const filteredRow = {};
      
      Object.keys(row).forEach(col => {
        if (!dateRegex.test(col)) {
          filteredRow[col] = row[col];
        }
      });
      
      selectedDates.forEach(dateKey => {
        filteredRow[dateKey] = row.hasOwnProperty(dateKey) ? row[dateKey] : null;
      });
      
      return filteredRow;
    });
    
  } catch (error) {
    console.error('Error in getAllSaturdayData:', error);
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
    // Just insert new dates, ignore duplicates
    if (dates && dates.length > 0) {
      for (const date of dates) {
        await sql`INSERT INTO calendar_dates (date) VALUES (${date}) ON CONFLICT DO NOTHING`;
      }
    }

    return { success: true, count: dates?.length ?? 0 };
  } catch (error) {
    console.error('Error in saveCalendarDates:', error);
    throw error;
  }
};