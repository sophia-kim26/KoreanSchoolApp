import { sql } from '../config/database.js';

export const getAllFridayData = async () => {
  console.log('getAllFridayData called');
  
  try {
    const calendarDates = await sql`SELECT date FROM calendar_dates ORDER BY date`;
    
    if (calendarDates.length === 0) {
      console.log('No calendar dates selected, returning empty array');
      return [];
    }
    
    const allData = await sql`SELECT * FROM friday ORDER BY id`;
    
    if (allData.length === 0) {
      console.log('No data in friday table');
      return [];
    }
    
    const selectedDates = calendarDates.map(row => row.date.replace(/-/g, '_'));
    console.log('Selected dates (converted to underscore format):', selectedDates);
    
    const sampleRow = allData[0];
    const existingColumns = Object.keys(sampleRow);
    
    const dateRegex = /^\d{4}_\d{2}_\d{2}$/;
    
    const nonDateColumns = existingColumns.filter(col => !dateRegex.test(col));
    console.log('Non-date columns:', nonDateColumns);
    
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
    
    console.log(`Returning ${filteredData.length} rows`);
    if (filteredData.length > 0) {
      console.log('Sample row columns:', Object.keys(filteredData[0]));
      console.log('Sample row:', filteredData[0]);
    }
    
    return filteredData;
    
  } catch (error) {
    console.error('Error in getAllFridayData:', error);
    throw error;
  }
};

export const getCalendarDates = async () => {
  console.log('getCalendarDates called');
  try {
    const result = await sql`SELECT date FROM calendar_dates ORDER BY date`;
    return { dates: result.map(row => row.date) };
  } catch (error) {
    console.error('Error in getCalendarDates:', error);
    return { dates: [] };
  }
};

export const saveCalendarDates = async (dates) => {
  console.log('saveCalendarDates called with:', dates);

  if (!Array.isArray(dates)) {
    throw new Error('dates must be an array');
  }

  try {
    await sql.begin(async (tx) => {
      console.log('Deleting existing dates...');
      await tx`DELETE FROM calendar_dates`;

      if (dates.length > 0) {
        console.log(`Batch inserting ${dates.length} dates...`);

        await tx`
          INSERT INTO calendar_dates (date)
          SELECT * FROM UNNEST(${dates}::date[])
        `;
      }
    });

    console.log('Save completed successfully');

    return {
      success: true,
      count: dates.length
    };
  } catch (error) {
    console.error('Error in saveCalendarDates:', error);
    throw error;
  }
};