"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customers = exports.inventoryStatus = exports.inventory = exports.warehouses = exports.Product = exports.Region = exports.StoreAnylytics = exports.Staff = exports.stores = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).notNull().unique(),
    password: (0, pg_core_1.text)('password'),
    phoneNumber: (0, pg_core_1.varchar)('phone_number', { length: 15 }).unique(),
    storeName: (0, pg_core_1.varchar)('store_name', { length: 255 }),
    category: (0, pg_core_1.varchar)('category', { length: 255 }),
    emailVerified: (0, pg_core_1.boolean)('email_verified').default(false).notNull(),
    emailVerifyCode: (0, pg_core_1.varchar)('email_verify_code', { length: 255 }),
    emailVerifyExpiry: (0, pg_core_1.timestamp)('email_verify_expiry'),
    loginOtpCode: (0, pg_core_1.varchar)('login_otp_code', { length: 255 }),
    loginOtpExpiry: (0, pg_core_1.timestamp)('login_otp_expiry'),
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
    isActive: (0, pg_core_1.boolean)('is_active').default(true).notNull(),
    sslEnabled: (0, pg_core_1.boolean)('ssl_enabled').default(false).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.Staff = (0, pg_core_1.pgTable)('staff', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    storeId: (0, pg_core_1.integer)('store_id').references(() => exports.stores.id).notNull(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).notNull().unique(),
    status: (0, pg_core_1.varchar)('status', { length: 255 }),
    role: (0, pg_core_1.varchar)('role', { length: 255 }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.StoreAnylytics = (0, pg_core_1.pgTable)('storeAnalytics', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    storeId: (0, pg_core_1.integer)('store_id').references(() => exports.stores.id).notNull(),
    totalSales: (0, pg_core_1.integer)('total_sales').default(0).notNull(),
    orders: (0, pg_core_1.integer)('orders').default(0).notNull(),
    visitors: (0, pg_core_1.integer)('visitors').default(0).notNull(),
    activeProducts: (0, pg_core_1.integer)('active_product').default(0).notNull(),
});
exports.Region = (0, pg_core_1.pgTable)('region', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    storeId: (0, pg_core_1.integer)('store_id').references(() => exports.stores.id).notNull(),
    country: (0, pg_core_1.varchar)('country', { length: 255 }),
    code: (0, pg_core_1.varchar)('code', { length: 3 }),
    taxRate: (0, pg_core_1.varchar)('taxRate', { length: 255 }),
    shippingZone: (0, pg_core_1.varchar)('shippingZone', { length: 225 }),
    status: (0, pg_core_1.varchar)('status', { length: 255 }),
});
exports.Product = (0, pg_core_1.pgTable)('product', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    storeId: (0, pg_core_1.integer)('store_id').references(() => exports.stores.id).notNull(),
    image: (0, pg_core_1.text)('image'),
    name: (0, pg_core_1.varchar)('name', { length: 255 }),
    description: (0, pg_core_1.text)('description'),
    category: (0, pg_core_1.varchar)('category', { length: 255 }),
    price: (0, pg_core_1.varchar)('price', { length: 255 }),
    stock: (0, pg_core_1.integer)('stock'),
    sku: (0, pg_core_1.varchar)('sku', { length: 255 }),
    barcode: (0, pg_core_1.varchar)('barcode', { length: 255 }),
    status: (0, pg_core_1.varchar)('status', { length: 255 }),
    variants: (0, pg_core_1.varchar)('variants', { length: 255 }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
/** Warehouse / storage location (e.g. Main Warehouse). */
exports.warehouses = (0, pg_core_1.pgTable)('inventoryStatus', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    storeId: (0, pg_core_1.integer)('store_id').references(() => exports.stores.id).notNull(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
/** Stock level for a product at a specific warehouse. */
exports.inventory = (0, pg_core_1.pgTable)('inventory', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    storeId: (0, pg_core_1.integer)('store_id').references(() => exports.stores.id).notNull(),
    productId: (0, pg_core_1.integer)('product_id').references(() => exports.Product.id).notNull(),
    warehouseId: (0, pg_core_1.integer)('warehouse_id').references(() => exports.warehouses.id).notNull(),
    quantity: (0, pg_core_1.integer)('quantity').default(0).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
}, (table) => ({
    productWarehouseUnique: (0, pg_core_1.unique)('inventory_product_warehouse_unique').on(table.productId, table.warehouseId),
}));
/** @deprecated Use `warehouses` — kept for backward compatibility. */
exports.inventoryStatus = exports.warehouses;
exports.customers = (0, pg_core_1.pgTable)('customer', {
    customerId: (0, pg_core_1.serial)('custid').primaryKey(),
    storeId: (0, pg_core_1.integer)('store_id').references(() => exports.stores.id).notNull(),
    firstName: (0, pg_core_1.varchar)('first_name', { length: 255 }),
    lastName: (0, pg_core_1.varchar)('last_name', { length: 255 }),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).unique(),
    phone: (0, pg_core_1.varchar)('phone', { length: 255 }),
    address: (0, pg_core_1.varchar)('address', { length: 255 }),
    preferedLanguage: (0, pg_core_1.varchar)('preferedLanguage', { length: 255 }),
    preferedCurrency: (0, pg_core_1.varchar)('preferedCurrency', { length: 255 }),
    tags: (0, pg_core_1.varchar)('tags', { length: 255 }),
    notes: (0, pg_core_1.varchar)('notes', { length: 255 }),
    //Market Consent
    emailMarketing: (0, pg_core_1.boolean)('email_marketing').default(false).notNull(),
    smsMarketing: (0, pg_core_1.boolean)('sms_marketing').default(false).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
