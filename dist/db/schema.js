"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.users = (0, pg_core_1.pgTable)('users', {
    // --- Identity ---
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }),
    username: (0, pg_core_1.varchar)('username', { length: 255 }).unique(),
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
    // --- Phone Verification ---
    phoneVerified: (0, pg_core_1.boolean)('phone_verified').default(false).notNull(),
    phoneVerifyCode: (0, pg_core_1.varchar)('phone_verify_code', { length: 6 }),
    phoneVerifyExpiry: (0, pg_core_1.timestamp)('phone_verify_expiry'),
    // --- Timestamps ---
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
