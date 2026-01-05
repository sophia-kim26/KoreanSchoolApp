import { sql } from '../config/database.js';

export const getAllTAsWithStatus = async () => {
  return await sql`
    SELECT 
      ta_list.*,
      CASE 
        WHEN shifts.id IS NOT NULL THEN 'Present'
        ELSE 'Absent'
      END as attendance,
      COALESCE(
        (SELECT SUM(
          EXTRACT(EPOCH FROM (
            COALESCE(s.clock_out, NOW()) - s.clock_in
          )) / 3600
        )
        FROM shifts s
        WHERE s.ta_id = ta_list.id
        ), 0
      ) as total_hours
    FROM ta_list
    LEFT JOIN shifts 
      ON ta_list.id = shifts.ta_id 
      AND DATE(shifts.clock_in) = CURRENT_DATE
      AND shifts.clock_out IS NULL
    ORDER BY 
      ta_list.is_active DESC,
      ta_list.id ASC
  `;
};

export const createAccount = async ({ first_name, last_name, email, ta_code, session_day }) => {
  // Check if email already exists
  const existing = await sql`SELECT * FROM ta_list WHERE email = ${email}`;
  if (existing.length > 0) {
    const error = new Error('Account already exists with this email');
    error.status = 400;
    throw error;
  }
  
  // Check if ta_code already exists
  const existingCode = await sql`SELECT * FROM ta_list WHERE ta_code = ${ta_code}`;
  if (existingCode.length > 0) {
    const error = new Error('PIN already exists, please try again');
    error.status = 400;
    throw error;
  }
  
  const result = await sql`
    INSERT INTO ta_list (first_name, last_name, email, ta_code, session_day, is_active, created_at) 
    VALUES (${first_name}, ${last_name}, ${email}, ${ta_code}, ${session_day}, true, NOW()) 
    RETURNING *
  `;
  
  return { 
    success: true, 
    ta: result[0],
    message: 'Account created successfully' 
  };
};

export const signIn = async (ta_code) => {
  const result = await sql`SELECT * FROM ta_list WHERE ta_code = ${ta_code}`;
  
  if (result.length === 0) {
    const error = new Error('Invalid PIN');
    error.status = 404;
    throw error;
  }
  
  if (!result[0].is_active) {
    const error = new Error('Account is inactive. Please contact administrator.');
    error.status = 403;
    throw error;
  }
  
  return { 
    success: true, 
    ta: result[0] 
  };
};

export const deactivateTA = async (id) => {
  return await sql`
    UPDATE ta_list 
    SET is_active = false 
    WHERE id = ${id}
    RETURNING *
  `;
};