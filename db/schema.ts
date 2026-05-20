import { pgTable, serial, text, varchar, timestamp, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  // --- Identity ---
  id:          serial('id').primaryKey(),
  name:        varchar('name', { length: 255 }),
  email:       varchar('email', { length: 255 }).notNull().unique(),
  password:    text('password'),
  phoneNumber: varchar('phone_number', { length: 15 }).unique(),

  // --- Store Info ---
  storeName: varchar('store_name', { length: 255 }),
  category:  varchar('category', { length: 255 }),

  // --- Email Verification ---
  emailVerified:     boolean('email_verified').default(false).notNull(),
  emailVerifyCode:   varchar('email_verify_code', { length: 255 }),
  emailVerifyExpiry: timestamp('email_verify_expiry'),

  // --- Login 2FA (OTP) ---
  loginOtpCode:   varchar('login_otp_code', { length: 255 }),
  loginOtpExpiry: timestamp('login_otp_expiry'),

  // --- Timestamps ---
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});