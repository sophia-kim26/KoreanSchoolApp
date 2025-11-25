import express from 'express';
import { neon } from '@neondatabase/serverless';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const sql = neon(process.env.DATABASE_URL);

app.use(cors());
app.use(express.json());

// Example route - get all records from a table
app.get('/api/data', async (req, res) => {
  try {
    const result = await sql`SELECT * FROM ta_list`;
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Example route - create a record
app.post('/api/data', async (req, res) => {
  try {
    const { TA_id, fri_sat_both } = req.body;
    const result = await sql`
      INSERT INTO ta_list (ta_id, fri_sat_both) 
      VALUES (${TA_id}, ${fri_sat_both}) 
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