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
    // Run the delete + batch insert atomically in a single transaction.
    // If anything fails mid-way, Postgres rolls back and no data is lost.
    await sql.begin(async (tx) => {
      // 1. Clear existing dates
      await tx`DELETE FROM calendar_dates`;

      if (dates && dates.length > 0) {
        // 2. Batch insert all dates in ONE round trip instead of N.
        //    sql`INSERT ... VALUES ${sql(rows)}` expands the array into
        //    a single multi-row VALUES clause.
        const rows = dates.map(date => ({ date }));
        await tx`INSERT INTO calendar_dates ${tx(rows, 'date')}`;
      }
    });

    // 3. ADD DYNAMIC COLUMNS TO FRIDAY TABLE (outside the transaction —
    //    DDL like ALTER TABLE auto-commits in Postgres anyway, and running
    //    it outside keeps the transactional delete+insert clean).
    //    Each ALTER is still idempotent thanks to the IF NOT EXISTS guard.
    if (dates && dates.length > 0) {
      for (const date of dates) {
        const columnName = date.replace(/-/g, '_');
        await sql.unsafe(`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_name = 'friday' AND column_name = '${columnName}'
            ) THEN
              ALTER TABLE friday ADD COLUMN "${columnName}" BOOLEAN DEFAULT FALSE;
            END IF;
          END $$;
        `);
      }
    }

    return { success: true, count: dates?.length ?? 0 };
  } catch (error) {
    console.error('Error in saveCalendarDates:', error);
    throw error;
  }
};