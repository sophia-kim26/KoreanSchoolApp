import { sql } from '../config/database.js';

export const getAllFridayData = async () => {
  
  try {
    const calendarDates = await sql`SELECT date FROM calendar_dates ORDER BY date`;
    
    if (calendarDates.length === 0) {
      return [];
    }
    
    // Get Friday data with attendance counts calculated
    const allData = await sql`
      SELECT 
        f.*,
        COALESCE(COUNT(CASE WHEN s.clock_out IS NOT NULL THEN 1 END), 0) as attendance_count,
        COALESCE(COUNT(CASE WHEN s.clock_out IS NULL AND s.clock_in IS NOT NULL THEN 1 END), 0) as absence_count,
      FROM friday f
      LEFT JOIN shifts s ON f.id = s.ta_id
      GROUP BY f.id
      ORDER BY f.id
    `;
    
    if (allData.length === 0) {
      return [];
    }
    
    const selectedDates = calendarDates.map(row => row.date.replace(/-/g, '_'));
    
    const sampleRow = allData[0];
    const existingColumns = Object.keys(sampleRow);
    
    const dateRegex = /^\d{4}_\d{2}_\d{2}$/;
    
    const nonDateColumns = existingColumns.filter(col => !dateRegex.test(col));
    
    const filteredData = allData.map(row => {
      const filteredRow = {};
      
      for (const col of nonDateColumns) {
        filteredRow[col] = row[col];
      }
      
      for (const selectedDate of selectedDates) {
        if (row.hasOwnProperty(selectedDate)) {
          filteredRow[selectedDate] = row[selectedDate];
        } else {
          filteredRow[selectedDate] = null;
        }
      }
      
      return filteredRow;
    });
    
    return filteredData;
    
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
    await sql`DELETE FROM calendar_dates`;

    if (dates && dates.length > 0) {
      for (const date of dates) {
        await sql`INSERT INTO calendar_dates (date) VALUES (${date})`;
      }
    };

    return { 
      success: true, 
      count: dates.length 
    };
  } catch (error) {
    console.error('Error in saveCalendarDates:', error);
    throw error;
  }
};