// This is the Drizzle ORM Schema for Neon Database
import { pgTable, serial, text, varchar, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  username: varchar('username', { length: 255 }).unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(), 
  phoneNumber: varchar('phone_number', { length: 15 }).unique(),
  storeName: varchar('store_name', { length: 255 }),
  category: varchar('category', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

