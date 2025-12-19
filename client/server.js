import express from 'express';
import { neon } from '@neondatabase/serverless';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const sql = neon(process.env.DATABASE_URL);

app.use(cors());
app.use(express.json());

// Modified route - get all TAs with attendance status and total hours
app.get('/api/data', async (req, res) => {
  try {
    const result = await sql`
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
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Clock in - create a new shift
app.post('/api/attendance/clock-in', async (req, res) => {
  try {
    const { ta_id } = req.body;
    
    // Check if already clocked in today
    const existing = await sql`
      SELECT * FROM shifts 
      WHERE ta_id = ${ta_id} 
      AND DATE(clock_in) = CURRENT_DATE 
      AND clock_out IS NULL
    `;
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Already clocked in' });
    }
    
    const result = await sql`
      INSERT INTO shifts (ta_id, clock_in, was_manual)
      VALUES (${ta_id}, NOW(), true)
      RETURNING *
    `;
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clock out - update the shift
app.post('/api/attendance/clock-out/:ta_id', async (req, res) => {
  try {
    const { ta_id } = req.params;
    
    const result = await sql`
      UPDATE shifts 
      SET clock_out = NOW()
      WHERE ta_id = ${ta_id} 
      AND DATE(clock_in) = CURRENT_DATE 
      AND clock_out IS NULL
      RETURNING *
    `;
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'No active shift found' });
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Deactivate TA
app.patch('/api/ta/:id/deactivate', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await sql`
      UPDATE ta_list 
      SET is_active = false 
      WHERE id = ${id}
      RETURNING *
    `;
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all shifts with TA names
app.get('/api/shifts', async (req, res) => {
  try {
    const result = await sql`
      SELECT 
        shifts.id,
        shifts.ta_id,
        shifts.clock_in,
        shifts.clock_out,
        shifts.notes,
        ta_list.first_name,
        ta_list.last_name
      FROM shifts
      JOIN ta_list
        ON shifts.ta_id = ta_list.id
      ORDER BY shifts.clock_in DESC
    `;
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST a new shift
app.post('/api/shifts', async (req, res) => {
  try {
    const { ta_id, clock_in, clock_out, notes } = req.body;
    const result = await sql`
      INSERT INTO shifts (ta_id, clock_in, clock_out, notes)
      VALUES (${ta_id}, ${clock_in}, ${clock_out}, ${notes})
      RETURNING *
    `;
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE a shift (clock out)
app.put('/api/shifts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { clock_out } = req.body;

    console.log("Received PUT request for shift:", id);
    // console.log("Clock out value:", clock_out);
    // console.log("Clock out type:", typeof clock_out);

    const result = await sql`
      UPDATE shifts
      WHERE id = ${id}
      RETURNING *
    `;

    console.log("Update result:", result);

    if (result.length === 0) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    res.json(result[0]);
  } catch (error) {
    console.error("Error updating shift:", error);
    res.status(500).json({ error: error.message });
  }
});

// Create new TA account
app.post('/api/create-account', async (req, res) => {
  try {
    const { first_name, last_name, email, ta_code, session_day } = req.body;
    
    // Check if email already exists
    const existing = await sql`SELECT * FROM ta_list WHERE email = ${email}`;
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Account already exists with this email' });
    }
    
    // Check if ta_code already exists
    const existingCode = await sql`SELECT * FROM ta_list WHERE ta_code = ${ta_code}`;
    if (existingCode.length > 0) {
      return res.status(400).json({ error: 'PIN already exists, please try again' });
    }
    
    // Insert new TA with is_active = true by default
    const result = await sql`
      INSERT INTO ta_list (first_name, last_name, email, ta_code, session_day, is_active, created_at) 
      VALUES (${first_name}, ${last_name}, ${email}, ${ta_code}, ${session_day}, true, NOW()) 
      RETURNING *
    `;
    
    res.json({ 
      success: true, 
      ta: result[0],
      message: 'Account created successfully' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sign in with PIN
app.post('/api/signin', async (req, res) => {
  try {
    const { ta_code } = req.body;
    const result = await sql`SELECT * FROM ta_list WHERE ta_code = ${ta_code}`;
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Invalid PIN' });
    }
    
    // Check if account is active
    if (!result[0].is_active) {
      return res.status(403).json({ error: 'Account is inactive. Please contact administrator.' });
    }
    
    res.json({ 
      success: true, 
      ta: result[0] 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});