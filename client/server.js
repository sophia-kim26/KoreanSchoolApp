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
    const result = await sql`SELECT * FROM ta_list`;
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
        shifts.was_manual,
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
    const { ta_id, clock_in, clock_out, was_manual, notes } = req.body;
    const result = await sql`
      INSERT INTO shifts (ta_id, clock_in, clock_out, was_manual, notes)
      VALUES (${ta_id}, ${clock_in}, ${clock_out}, ${was_manual}, ${notes})
      RETURNING *
    `;
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});