import { double } from 'drizzle-orm/mysql-core';
import { pgTable, serial, text, varchar, timestamp, boolean, integer, unique } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id:serial('id').primaryKey(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password:text('password'),
  phoneNumber: varchar('phone_number', { length: 15 }).unique(),
  storeName: varchar('store_name', { length: 255 }),
  category:  varchar('category', { length: 255 }),
  emailVerified:     boolean('email_verified').default(false).notNull(),
  emailVerifyCode:   varchar('email_verify_code', { length: 255 }),
  emailVerifyExpiry: timestamp('email_verify_expiry'),
  loginOtpCode:   varchar('login_otp_code', { length: 255 }),
  loginOtpExpiry: timestamp('login_otp_expiry'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const stores = pgTable('stores', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  image: text('image'),
  storeName: varchar('store_name', { length: 255 }),
  category: varchar('category', { length: 255 }),
  businessAddress: text('business_address'),
  country: varchar('country', { length: 255 }),
  currency: varchar('currency', { length: 255 }),
  subDomain: varchar('sub_domain', { length: 255 }),
  isActive:    boolean('is_active').default(true).notNull(),
  sslEnabled:  boolean('ssl_enabled').default(false).notNull(),
   createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),


});

export const Staff= pgTable('staff',{
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  status: varchar('status', { length: 255 }),
  role: varchar('role', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),

});


export const StoreAnylytics = pgTable('storeAnalytics',{
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  totalSales: integer('total_sales').default(0).notNull(),
  orders: integer('orders').default(0).notNull(),
  visitors: integer('visitors').default(0).notNull(),
  activeProducts: integer('active_product').default(0).notNull(),
});

export const Region = pgTable('region',{
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  country: varchar('country',{ length:255}),
  code:varchar('code',{length:3}),
  taxRate:varchar('taxRate', {length:255 }),
  shippingZone:varchar('shippingZone',{length:225}),
  status:varchar('status', {length:255 }),
})

export const Product = pgTable('product', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  image: text('image'),
  name: varchar('name', { length: 255 }),
  description:text('description'),
  category: varchar('category', { length: 255 }),
  price: varchar('price', { length: 255 }),
  stock: integer('stock'),
  sku: varchar('sku', { length: 255 }),
  barcode:varchar('barcode', { length: 255 }),
  status: varchar('status', { length: 255 }),
  variants: varchar('variants', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
