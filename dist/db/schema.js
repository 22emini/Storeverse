"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stores = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.users = (0, pg_core_1.pgTable)('users', {
    // --- Identity ---
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).notNull().unique(),
    password: (0, pg_core_1.text)('password'),
    phoneNumber: (0, pg_core_1.varchar)('phone_number', { length: 15 }).unique(),
    // --- Store Info ---
    storeName: (0, pg_core_1.varchar)('store_name', { length: 255 }),
    category: (0, pg_core_1.varchar)('category', { length: 255 }),
    // --- Email Verification ---
    emailVerified: (0, pg_core_1.boolean)('email_verified').default(false).notNull(),
    emailVerifyCode: (0, pg_core_1.varchar)('email_verify_code', { length: 255 }),
    emailVerifyExpiry: (0, pg_core_1.timestamp)('email_verify_expiry'),
    // --- Login 2FA (OTP) ---
    loginOtpCode: (0, pg_core_1.varchar)('login_otp_code', { length: 255 }),
    loginOtpExpiry: (0, pg_core_1.timestamp)('login_otp_expiry'),
    // --- Timestamps ---
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.stores = (0, pg_core_1.pgTable)('stores', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.integer)('user_id').references(() => exports.users.id).notNull(),
    image: (0, pg_core_1.text)('image'),
    storeName: (0, pg_core_1.varchar)('store_name', { length: 255 }),
    category: (0, pg_core_1.varchar)('category', { length: 255 }),
    businessAddress: (0, pg_core_1.text)('business_address'),
    country: (0, pg_core_1.varchar)('country', { length: 255 }),
    currency: (0, pg_core_1.varchar)('currency', { length: 255 }),
    subDomain: (0, pg_core_1.varchar)('sub_domain', { length: 255 }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
