import { sql } from '../config/database.js';

export const getAllFridayData = async () => {
  try {
    const calendarDates = await sql`SELECT date FROM calendar_dates ORDER BY date`;
    
    if (calendarDates.length === 0) return [];
    
    // Use a subquery to get counts so we don't have to list 20 columns in GROUP BY
    const allData = await sql`
      SELECT 
        f.*,
        COALESCE(counts.attendance_count, 0) as attendance_count,
        COALESCE(counts.absence_count, 0) as absence_count
      FROM friday f
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
      
      // Keep all columns from the database (including the ones seen in your screenshot)
      Object.keys(row).forEach(col => {
        if (!dateRegex.test(col)) {
          filteredRow[col] = row[col];
        }
      });
      
      // Map the dynamic date columns (e.g., 2024_04_04 from your image)
      selectedDates.forEach(dateKey => {
        // row[dateKey] will now be found because the columns exist in your screenshot
        filteredRow[dateKey] = row.hasOwnProperty(dateKey) ? row[dateKey] : null;
      });
      
      return filteredRow;
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
    // 1. Clear and save the dates to the reference table
    await sql`DELETE FROM calendar_dates`;
    if (dates && dates.length > 0) {
      for (const date of dates) {
        await sql`INSERT INTO calendar_dates (date) VALUES (${date})`;
        
        // 2. DYNAMICALLY ADD COLUMN TO FRIDAY TABLE
        // SQL columns can't have dashes, so we use underscores (e.g., 2026_02_17)
        const columnName = date.replace(/-/g, '_');
        
        // This check prevents errors if the column already exists
        await sql.unsafe(`
          DO $$ 
          BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name='friday' AND column_name='${columnName}') THEN
              ALTER TABLE friday ADD COLUMN "${columnName}" BOOLEAN DEFAULT FALSE;
            END IF;
          END $$;
        `);
      }
    }

    return { success: true, count: dates.length };
  } catch (error) {
    console.error('Error in saveCalendarDates:', error);
    throw error;
  }
};