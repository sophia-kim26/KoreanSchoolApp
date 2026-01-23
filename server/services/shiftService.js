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

export const getShiftsForTA = async (ta_id) => {
  console.log('=== GET SHIFTS FOR TA ===');
  console.log('ta_id:', ta_id);
  console.log('ta_id type:', typeof ta_id);
  
  // Convert to integer to ensure type match
  const taIdInt = parseInt(ta_id);
  console.log('ta_id as int:', taIdInt);
  
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
  
  console.log('Query result:', result);
  console.log('Number of shifts found:', result.length);
  if (result.length > 0) {
    console.log('Sample shift:', result[0]);
  }
  console.log('========================');
  
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
  console.log("=== CREATE SHIFT SERVICE ===");
  console.log("Input data:", { ta_id, clock_in, clock_out, notes });
  console.log("ta_id type:", typeof ta_id);
  
  try {
    const result = await sql`
      INSERT INTO shifts (ta_id, clock_in, clock_out, notes, was_manual)
      VALUES (${ta_id}, ${clock_in}, ${clock_out}, ${notes}, true)
      RETURNING *
    `;
    
    console.log("SQL result:", result);
    console.log("Shift created:", result[0]);
    console.log("============================");
    return result[0];
  } catch (error) {
    console.error("=== SQL ERROR ===");
    console.error("Error:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    console.error("=================");
    throw error;
  }
};

// export const updateShift = async (id, { clock_out }) => {
//   console.log("Received PUT request for shift:", id);
  
//   const result = await sql`
//     UPDATE shifts
//     SET clock_out = ${clock_out}
//     WHERE id = ${id}
//     RETURNING *
//   `;

//   console.log("Update result:", result);

//   if (result.length === 0) {
//     const error = new Error('Shift not found');
//     error.status = 404;
//     throw error;
//   }

//   return result[0];
// };

export const updateShift = async (id, { clock_in, clock_out }) => {
  console.log("Updating shift:", id, "with data:", { clock_in, clock_out });
  
  const result = await sql`
    UPDATE shifts
    SET 
      clock_in = ${clock_in},
      clock_out = ${clock_out}
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