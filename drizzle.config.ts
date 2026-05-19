// This is for Neon Database Connection 
// Very Important don't  mess with this file
import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.warn("⚠️ DATABASE_URL is not defined in environment variables. Drizzle Kit might fail.");
}

export default defineConfig({
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || '',
  },
});
