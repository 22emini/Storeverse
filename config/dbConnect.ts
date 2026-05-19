// this 
import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { Request, Response } from 'express';

// Load environment variables
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ DATABASE_URL environment variable is missing!");
  process.exit(1);
}

// 1. Create the raw Neon database client
export const sql = neon(databaseUrl);

// 2. Initialize Drizzle ORM
export const db = drizzle({ client: sql });

// 3. Verify Database connection at startup
export const dbConnect = async () => {
  try {
    // Run a simple query to verify the connection
    await sql`SELECT 1`;
    console.log('⚡ Connected to Neon Database successfully using Drizzle ORM.');
  } catch (error) {
    console.error('❌ Failed to connect to Neon Database:', error);
    process.exit(1);
  }
};

// 4. Request handler for '/db-version' endpoint
export const requestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await sql`SELECT version()`;
    const dbVersion = result && result[0] ? Object.values(result[0])[0] : 'Unknown';
    res.json({
      success: true,
      message: 'Successfully connected to database!',
      version: dbVersion
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to connect to database',
      error: error.message
    });
  }
};
