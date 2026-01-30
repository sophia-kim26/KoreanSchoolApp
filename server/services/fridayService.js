import { sql } from '../config/database.js';

export async function getAllFridayData() {
  const result = await sql`SELECT * FROM friday ORDER BY id`;
  return result;
}