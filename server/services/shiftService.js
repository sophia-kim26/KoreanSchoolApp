import { sql } from '../config/database.js';

export const clockIn = async (ta_id) => {
  // Check if already clocked in today
  const existing = await sql`
    SELECT * FROM shifts 
    WHERE ta_id = ${ta_id} 
    AND DATE(clock_in) = CURRENT_DATE 
    AND clock_out IS NULL
  `;
  
  if (existing.length > 0) {
    const error = new Error('Already clocked in');
    error.status = 400;
    throw error;
  }
  
  return await sql`
    INSERT INTO shifts (ta_id, clock_in, was_manual)
    VALUES (${ta_id}, NOW(), true)
    RETURNING *
  `;
};

export const clockOut = async (ta_id) => {
  const result = await sql`
    UPDATE shifts 
    SET clock_out = NOW()
    WHERE ta_id = ${ta_id} 
    AND DATE(clock_in) = CURRENT_DATE 
    AND clock_out IS NULL
    RETURNING *
  `;
  
  if (result.length === 0) {
    const error = new Error('No active shift found');
    error.status = 404;
    throw error;
  }
  
  return result;
};

export const getAllShifts = async () => {
  return await sql`
    SELECT 
      shifts.id,
      shifts.ta_id,
      shifts.clock_in,
      shifts.clock_out,
      shifts.elapsed_time,
      shifts.attendance,
      shifts.notes,
      ta_list.first_name,
      ta_list.last_name
    FROM shifts
    JOIN ta_list
      ON shifts.ta_id = ta_list.id
    ORDER BY shifts.clock_in DESC
  `;
};

export const getShiftsForTA = async (ta_id) => {
  const taIdInt = parseInt(ta_id);
  
  const result = await sql`
    SELECT 
      shifts.*,
      ta_list.first_name,
      ta_list.last_name,
      ta_list.email
    FROM shifts
    INNER JOIN ta_list ON ta_list.id = shifts.ta_id
    WHERE shifts.ta_id = ${taIdInt}
    ORDER BY shifts.clock_in DESC
  `;

  return result;
};

export const getActiveShift = async (ta_id) => {
  const result = await sql`
    SELECT * FROM shifts
    WHERE ta_id = ${ta_id} AND clock_out IS NULL
    ORDER BY clock_in DESC
    LIMIT 1
  `;
  
  return { activeShift: result.length > 0 ? result[0] : null };
};

export const createShift = async ({ ta_id, clock_in, clock_out, notes }) => {
  try {
    const result = await sql`
      INSERT INTO shifts (ta_id, clock_in, clock_out, notes, attendance, was_manual)
      VALUES (${ta_id}, ${clock_in}, ${clock_out}, ${notes}, 'Present', true)
      RETURNING *
    `;
    
    return result[0];
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

export const updateShift = async (id, updateData) => {
  try {
    // First get the current shift data
    const current = await sql`SELECT * FROM shifts WHERE id = ${id}`;
    
    if (current.length === 0) {
      const error = new Error('Shift not found');
      error.status = 404;
      throw error;
    }
    
    // Merge current data with updates
    const merged = {
      clock_in: updateData.clock_in !== undefined ? updateData.clock_in : current[0].clock_in,
      clock_out: updateData.clock_out !== undefined ? updateData.clock_out : current[0].clock_out,
      notes: updateData.notes !== undefined ? updateData.notes : current[0].notes,
      elapsed_time: updateData.elapsed_time !== undefined ? updateData.elapsed_time : current[0].elapsed_time,
      attendance: updateData.attendance !== undefined ? updateData.attendance : current[0].attendance
    };

    console.log("=== UPDATING SHIFT ===");
    console.log("Shift ID:", id);
    console.log("Merged data:", merged);
        
    // Now update with all fields
    const result = await sql`
      UPDATE shifts
      SET 
        clock_in = ${merged.clock_in},
        clock_out = ${merged.clock_out},
        notes = ${merged.notes},
        elapsed_time = ${merged.elapsed_time},
        attendance = ${merged.attendance}
      WHERE id = ${id}
      RETURNING *
    `;

    console.log("=== UPDATE RESULT ===");
    console.log(result[0]);
    console.log("=====================");

    return result[0];
  } catch (error) {
    console.error("=== UPDATE ERROR ===");
    console.error("Error:", error);
    console.error("====================");
    throw error;
  }
};