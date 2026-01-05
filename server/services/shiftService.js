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
      shifts.notes,
      ta_list.first_name,
      ta_list.last_name
    FROM shifts
    JOIN ta_list
      ON shifts.ta_id = ta_list.id
    ORDER BY shifts.clock_in DESC
  `;
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
  const result = await sql`
    INSERT INTO shifts (ta_id, clock_in, clock_out, notes)
    VALUES (${ta_id}, ${clock_in}, ${clock_out}, ${notes})
    RETURNING *
  `;
  return result[0];
};

export const updateShift = async (id, { clock_out }) => {
  console.log("Received PUT request for shift:", id);
  
  const result = await sql`
    UPDATE shifts
    SET clock_out = ${clock_out}
    WHERE id = ${id}
    RETURNING *
  `;

  console.log("Update result:", result);

  if (result.length === 0) {
    const error = new Error('Shift not found');
    error.status = 404;
    throw error;
  }

  return result[0];
};