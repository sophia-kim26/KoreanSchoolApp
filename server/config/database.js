import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load from client/.env (going up two levels from server/config/ to root, then into client)
dotenv.config({ path: join(__dirname, '..', '..', 'client', '.env') });

console.log('Loading .env from:', join(__dirname, '..', '..', 'client', '.env'));
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

export const sql = neon(process.env.DATABASE_URL);