import express from "express";
import cors from "cors";
import { neon } from "@neondatabase/serverless";
import 'dotenv/config';

const app = express();
app.use(cors());

const sql = neon(process.env.DATABASE_URL);

// Example: fetch all rows from "products" table
app.get("/api/example_TA", async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM example_TA`;
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
