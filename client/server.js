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
      INSERT INTO ta_list (id, first_name, last_name, ta_code, email, session_day, google_id, is_active, created_at, shifts) 
      VALUES (${id}, ${first_name}, ${last_name}, ${ta_code}, ${email}, ${session_day}, ${google_id}, ${is_active}, ${created_at}, ${shifts}) 
      RETURNING *
    `;
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// shifts table
app.get('/api/shifts', async (req, res) => {
  try {
    const result = await sql`SELECT * FROM shifts`;
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/shifts', async (req, res) => {
  try {
    const { id, ta_id, clock_in, clock_out, was_manual, notes, TA } = req.body;
    const result = await sql`
      INSERT INTO shifts (id, ta_id, clock_in, clock_out, was_manual, notes, TA)
      VALUES (${id}, ${ta_id}, ${clock_in}, ${clock_out}, ${was_manual}, ${notes}, ${TA})
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