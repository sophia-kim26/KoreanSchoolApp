import express from 'express';
import { neon } from '@neondatabase/serverless';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const sql = neon(process.env.DATABASE_URL);

app.use(cors());
app.use(express.json());

// Example route - get all records from table ta_list
app.get('/api/data', async (req, res) => {
  try {
    const result = await sql`SELECT * FROM ta_list ORDER BY id ASC`;
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/data', async (req, res) => {
  try {
    const { id, first_name, last_name, ta_code, email, session_day, google_id, is_active, created_at, shifts } = req.body;
    const result = await sql`
      INSERT INTO ta_list (first_name, last_name, ta_code, email, session_day, google_id, is_active, created_at) 
      VALUES (${first_name}, ${last_name}, ${ta_code}, ${email}, ${session_day}, ${google_id}, ${is_active}, ${created_at}) 
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
    
    // Check if ta_code already exists (shouldn't happen with random generation, but just in case)
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