import { sql } from '../config/database.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

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

export const createAccount = async ({ first_name, last_name, email, ta_code, session_day, korean_name }) => {
  // Check if email already exists
  const existing = await sql`SELECT * FROM ta_list WHERE email = ${email}`;
  if (existing.length > 0) {
    const error = new Error('Account already exists with this email');
    error.status = 400;
    throw error;
  }

  // Hash the PIN before storing
  const hashedPin = await bcrypt.hash(ta_code, SALT_ROUNDS);

  const result = await sql`
    INSERT INTO ta_list (first_name, last_name, email, ta_code, session_day, korean_name, is_active, created_at) 
    VALUES (${first_name}, ${last_name}, ${email}, ${hashedPin}, ${session_day}, ${korean_name || null}, true, NOW()) 
    RETURNING id, first_name, last_name, email, session_day, korean_name, is_active, created_at
  `;

  return { 
    success: true, 
    ta: result[0],
    unhashed_pin: ta_code, // Return unhashed PIN for display to VP
    message: 'Account created successfully' 
  };
};

export const signIn = async (ta_code) => {
  // Get all active TAs
  const allTAs = await sql`SELECT * FROM ta_list WHERE is_active = true`;
  
  if (allTAs.length === 0) {
    const error = new Error('Invalid PIN');
    error.status = 404;
    throw error;
  }

  // Check each TA's hashed PIN
  for (const ta of allTAs) {
    const isMatch = await bcrypt.compare(ta_code, ta.ta_code);
    if (isMatch) {
      // Return TA data without the hashed PIN
      const { ta_code: _, ...taData } = ta;
      return { 
        success: true, 
        ta: taData 
      };
    }
  }

  // No match found
  const error = new Error('Invalid PIN');
  error.status = 404;
  throw error;
};

export const deactivateTA = async (id) => {
  return await sql`
    UPDATE ta_list 
    SET is_active = false 
    WHERE id = ${id}
    RETURNING *
  `;
};