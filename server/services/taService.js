import { sql } from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendTACredentials } from './emailService.js'; // add this

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
            ) as total_hours,
            COALESCE(
                (SELECT COUNT(*)
                FROM shifts s
                WHERE s.ta_id = ta_list.id
                AND s.clock_out IS NOT NULL
                AND DATE(s.clock_in) IN (SELECT date::date FROM calendar_dates)
                ), 0
            ) as attendance_count,
            COALESCE(
                (SELECT COUNT(*)
                FROM shifts s
                WHERE s.ta_id = ta_list.id
                AND DATE(s.clock_in) IN (SELECT date::date FROM calendar_dates)
                AND NOT EXISTS (
                    SELECT 1 FROM shifts s2 
                    WHERE s2.ta_id = ta_list.id 
                    AND DATE(s2.clock_in) = DATE(s.clock_in)
                    AND s2.clock_out IS NOT NULL
                )
                ), 0
            ) as absence_count
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

export const createAccount = async ({ first_name, last_name, email, ta_code, session_day, korean_name, classroom }) => {
    // Check if email already exists
    const existing = await sql`SELECT * FROM ta_list WHERE email = ${email}`;
    if (existing.length > 0) {
        const error = new Error('Account with that email already exists');
        error.status = 400;
        throw error;
    }

    // Hash the PIN before storing
    const hashedPin = await bcrypt.hash(ta_code, SALT_ROUNDS);

    const result = await sql`
        INSERT INTO ta_list (first_name, last_name, email, ta_code, session_day, korean_name, classroom, is_active, created_at) 
        VALUES (
            ${first_name},
            ${last_name},
            ${email},
            ${hashedPin},
            ${session_day},
            ${korean_name || null},
            ${classroom || null},
            true,
            NOW()
        ) 
        RETURNING id, first_name, last_name, email, session_day, korean_name, classroom, is_active, created_at
    `;
    // after the INSERT, before the return:
    sendTACredentials({ first_name, email, pin: ta_code }).catch(err => {
        console.error('Failed to send welcome email:', err);
    });
    return {
        success: true,
        ta: result[0],
        unhashed_pin: ta_code,
        message: 'Account created successfully'
    };
};

export const signIn = async (email, ta_code) => {
    // Query for a single TA by email
    const tas = await sql`SELECT * FROM ta_list WHERE email = ${email} AND is_active = true`;

    if (tas.length === 0) {
        const error = new Error('Invalid email or PIN');
        error.status = 401;
        throw error;
    }

    const ta = tas[0];

    // Perform bcrypt comparison
    const isMatch = await bcrypt.compare(ta_code, ta.ta_code);
    if (!isMatch) {
        const error = new Error('Invalid email or PIN');
        error.status = 401;
        throw error;
    }

    // After verifying the TA, sign a token
    const token = jwt.sign(
        { sub: ta.id, ta_id: ta.id, email: ta.email, role: 'ta' },
        process.env.TA_JWT_SECRET,
        { expiresIn: '8h' }
    );
    
    const { ta_code: _, ...taData } = ta;
    return { success: true, ta: taData, token };

    // // Return TA data without the hashed PIN
    // const { ta_code: _, ...taData } = ta;
    // return {
    //     success: true,
    //     ta: taData
    // };

};

export const deactivateTA = async (id) => {
    return await sql`
        UPDATE ta_list 
        SET is_active = false 
        WHERE id = ${id}
        RETURNING *
    `;
};

export const resetPin = async (id) => {
    // Generate new 6-digit PIN
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the new PIN
    const hashedPin = await bcrypt.hash(newPin, SALT_ROUNDS);

    // Update the database
    const result = await sql`
        UPDATE ta_list 
        SET ta_code = ${hashedPin}
        WHERE id = ${id}
        RETURNING id, first_name, last_name, email
    `;

    if (result.length === 0) {
        const error = new Error('TA not found');
        error.status = 404;
        throw error;
    }

    return {
        success: true,
        ta: result[0],
        unhashed_pin: newPin,
        message: 'PIN reset successfully'
    };
};

export const updateClassroom = async (id, classroom) => {
    const result = await sql`
        UPDATE ta_list 
        SET classroom = ${classroom}
        WHERE id = ${id}
        RETURNING *
    `;

    if (result.length === 0) {
        const error = new Error('TA not found');
        error.status = 404;
        throw error;
    }

    return {
        success: true,
        ta: result[0],
        message: 'Classroom updated successfully'
    };
};

export const getTAById = async (id) => {
  const result = await sql`SELECT * FROM ta_list WHERE id = ${id}`;
  return result[0] || null;
};
