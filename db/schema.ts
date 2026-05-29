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
  storeId: integer('store_id').references(() => stores.id).notNull(),
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


/** Warehouse / storage location (e.g. Main Warehouse). */
export const warehouses = pgTable('inventoryStatus', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/** Stock level for a product at a specific warehouse. */
export const inventory = pgTable(
  'inventory',
  {
    id: serial('id').primaryKey(),
    storeId: integer('store_id').references(() => stores.id).notNull(),
    productId: integer('product_id').references(() => Product.id).notNull(),
    warehouseId: integer('warehouse_id').references(() => warehouses.id).notNull(),
    quantity: integer('quantity').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    productWarehouseUnique: unique('inventory_product_warehouse_unique').on(
      table.productId,
      table.warehouseId
    ),
  })
);

/** @deprecated Use `warehouses` — kept for backward compatibility. */
export const inventoryStatus = warehouses;

export const  customers = pgTable('customer',{
  customerId:serial('custid').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  firstName:varchar('first_name',{length: 255}),
  lastName:varchar('last_name',{length:255}),
  email:varchar('email',{length:255}).unique(),
  phone:varchar('phone',{length:255}),
  status:varchar('status', {length:255}),
  address:varchar('address',{length:255}),
 preferedLanguage:varchar('preferedLanguage',{length:255}),
 preferedCurrency:varchar('preferedCurrency',{length:255}),
 tags:varchar('tags',{length:255}),
 notes:varchar('notes',{length:255}),
 orderCount:integer('orderCount' ),
 totalSpent:integer('totalSpent' ),

 //Market Consent
 emailMarketing: boolean('email_marketing').default(false).notNull(),
 smsMarketing: boolean('sms_marketing').default(false).notNull(),
 createdAt: timestamp('created_at').defaultNow().notNull(),
updatedAt: timestamp('updated_at').defaultNow().notNull(),

})