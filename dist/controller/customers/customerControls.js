"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCustomer = exports.getCustomerById = exports.getAllCustomers = exports.exportCustomers = exports.importCustomers = exports.addCustomer = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../../db/schema");
const dbConnect_1 = require("../../config/dbConnect");
const customerImportParser_1 = require("../../utils/customerImportParser");
const CUSTOMER_FIELDS = [
    'firstName',
    'lastName',
    'email',
    'phone',
    'address',
    'tags',
    'notes',
    'preferedCurrency',
    'preferedLanguage',
    'emailMarketing',
    'smsMarketing',
];
const parseId = (raw) => {
    const parsed = typeof raw === 'number' ? raw : parseInt(String(raw ?? ''), 10);
    return isNaN(parsed) ? null : parsed;
};
const parseBool = (raw) => {
    if (raw === undefined || raw === null || raw === '')
        return undefined;
    if (typeof raw === 'boolean')
        return raw;
    const s = String(raw).toLowerCase();
    if (s === 'true' || s === '1' || s === 'yes')
        return true;
    if (s === 'false' || s === '0' || s === 'no')
        return false;
    return undefined;
};
const ensureStoreExists = async (storeId) => {
    const result = await dbConnect_1.db.select({ id: schema_1.stores.id }).from(schema_1.stores).where((0, drizzle_orm_1.eq)(schema_1.stores.id, storeId)).limit(1);
    return result.length > 0;
};
const mapRowToValues = (row, storeId) => {
    const email = row.email;
    if (email !== undefined && email !== null && email !== '') {
        if (typeof email !== 'string' || !email.trim()) {
            return { error: 'Invalid email' };
        }
    }
    const values = { storeId };
    for (const field of CUSTOMER_FIELDS) {
        if (field === 'emailMarketing' || field === 'smsMarketing') {
            const parsed = parseBool(row[field]);
            if (parsed !== undefined)
                values[field] = parsed;
            continue;
        }
        const val = row[field];
        if (val !== undefined && val !== null && val !== '') {
            values[field] = typeof val === 'string' ? val.trim() : String(val);
        }
    }
    return values;
};
const addCustomer = async (req, res) => {
    try {
        const { storeId, ...row } = req.body;
        const parsedStoreId = parseId(storeId);
        if (parsedStoreId === null) {
            return res.status(400).json({ message: 'Valid storeId is required' });
        }
        if (!(await ensureStoreExists(parsedStoreId))) {
            return res.status(404).json({ message: "Store Id can't be found" });
        }
        const mapped = mapRowToValues(row, parsedStoreId);
        if ('error' in mapped) {
            return res.status(400).json({ message: mapped.error });
        }
        const [addData] = await dbConnect_1.db.insert(schema_1.customers).values(mapped).returning();
        return res.status(201).json({ message: 'Customer added successfully', customer: addData });
    }
    catch (error) {
        console.error('addCustomer error:', error);
        if (error?.code === '23505') {
            return res.status(409).json({ message: 'A customer with this email already exists' });
        }
        return res.status(500).json({ message: 'An error has occurred', error: error.message });
    }
};
exports.addCustomer = addCustomer;
const importCustomers = async (req, res) => {
    try {
        const file = req.file;
        let customerList = null;
        let storeIdFromFile;
        if (file) {
            const parsed = await (0, customerImportParser_1.parseCustomerImportFile)(file);
            if ('error' in parsed) {
                return res.status(400).json({ message: parsed.error });
            }
            customerList = parsed.rows;
            storeIdFromFile = parsed.storeIdFromFile;
        }
        else {
            const payload = req.body;
            const storeIdInBody = parseId(payload?.storeId);
            if (storeIdInBody !== null)
                storeIdFromFile = storeIdInBody;
            customerList = Array.isArray(payload)
                ? payload
                : Array.isArray(payload?.customers)
                    ? payload.customers
                    : null;
        }
        const storeId = parseId(storeIdFromFile ?? req.body.storeId);
        if (storeId === null) {
            return res.status(400).json({
                message: 'Valid storeId is required (JSON body field or form field when uploading CSV/Excel/PDF)',
            });
        }
        if (!customerList || customerList.length === 0) {
            return res.status(400).json({
                message: 'Provide customers in the body, or upload JSON, CSV, Excel (.xlsx/.xls), or PDF via POST /import/upload',
            });
        }
        if (!(await ensureStoreExists(storeId))) {
            return res.status(404).json({ message: 'Store not found' });
        }
        const rows = [];
        const errors = [];
        customerList.forEach((item, index) => {
            if (!item || typeof item !== 'object') {
                errors.push({ index, message: 'Item must be an object' });
                return;
            }
            const normalized = (0, customerImportParser_1.normalizeCustomerRow)(item);
            const mapped = mapRowToValues(normalized, storeId);
            if ('error' in mapped) {
                errors.push({ index, message: mapped.error });
                return;
            }
            rows.push(mapped);
        });
        if (errors.length > 0) {
            return res.status(400).json({
                message: 'Some customers failed validation',
                errors,
                validCount: rows.length,
                totalCount: customerList.length,
            });
        }
        const inserted = await dbConnect_1.db.insert(schema_1.customers).values(rows).returning();
        return res.status(201).json({
            message: `${inserted.length} customer(s) imported successfully`,
            count: inserted.length,
            customers: inserted,
        });
    }
    catch (error) {
        console.error('importCustomers error:', error);
        if (error?.code === '23505') {
            return res.status(409).json({ message: 'Duplicate email in import batch or database' });
        }
        return res.status(500).json({ message: 'Failed to import customers', error: error.message });
    }
};
exports.importCustomers = importCustomers;
const exportCustomers = async (req, res) => {
    try {
        const storeId = parseId(req.params.storeId);
        if (storeId === null) {
            return res.status(400).json({ message: 'Valid storeId is required' });
        }
        if (!(await ensureStoreExists(storeId))) {
            return res.status(404).json({ message: 'Store not found' });
        }
        const list = await dbConnect_1.db.select().from(schema_1.customers).where((0, drizzle_orm_1.eq)(schema_1.customers.storeId, storeId));
        const exportPayload = {
            exportedAt: new Date().toISOString(),
            storeId,
            count: list.length,
            customers: list,
        };
        const asDownload = req.query.download === 'true' || req.query.download === '1';
        if (asDownload) {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="customers-store-${storeId}.json"`);
        }
        return res.status(200).json(exportPayload);
    }
    catch (error) {
        console.error('exportCustomers error:', error);
        return res.status(500).json({ message: 'Failed to export customers', error: error.message });
    }
};
exports.exportCustomers = exportCustomers;
const getAllCustomers = async (req, res) => {
    try {
        const storeId = parseId(req.params.storeId);
        if (storeId === null) {
            return res.status(400).json({ message: 'Valid storeId is required' });
        }
        if (!(await ensureStoreExists(storeId))) {
            return res.status(404).json({ message: 'Store not found' });
        }
        const list = await dbConnect_1.db.select().from(schema_1.customers).where((0, drizzle_orm_1.eq)(schema_1.customers.storeId, storeId));
        return res.status(200).json({
            message: 'Customers fetched successfully',
            count: list.length,
            customers: list,
        });
    }
    catch (error) {
        console.error('getAllCustomers error:', error);
        return res.status(500).json({ message: 'Failed to fetch customers', error: error.message });
    }
};
exports.getAllCustomers = getAllCustomers;
const getCustomerById = async (req, res) => {
    try {
        const customerId = parseId(req.params.id);
        if (customerId === null) {
            return res.status(400).json({ message: 'Valid customer ID is required' });
        }
        const [customer] = await dbConnect_1.db
            .select()
            .from(schema_1.customers)
            .where((0, drizzle_orm_1.eq)(schema_1.customers.customerId, customerId))
            .limit(1);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        return res.status(200).json({ message: 'Customer fetched successfully', customer });
    }
    catch (error) {
        console.error('getCustomerById error:', error);
        return res.status(500).json({ message: 'Failed to fetch customer', error: error.message });
    }
};
exports.getCustomerById = getCustomerById;
const updateCustomer = async (req, res) => {
    try {
        const customerId = parseId(req.params.id);
        if (customerId === null) {
            return res.status(400).json({ message: 'Valid customer ID is required' });
        }
        const existing = await dbConnect_1.db
            .select()
            .from(schema_1.customers)
            .where((0, drizzle_orm_1.eq)(schema_1.customers.customerId, customerId))
            .limit(1);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        const body = req.body;
        const updateData = {};
        for (const field of CUSTOMER_FIELDS) {
            if (body[field] === undefined)
                continue;
            if (field === 'emailMarketing' || field === 'smsMarketing') {
                const parsed = parseBool(body[field]);
                if (parsed === undefined) {
                    return res.status(400).json({ message: `Invalid value for ${field}` });
                }
                updateData[field] = parsed;
                continue;
            }
            const val = body[field];
            if (val === null || val === '') {
                updateData[field] = null;
            }
            else {
                updateData[field] = typeof val === 'string' ? val.trim() : String(val);
            }
        }
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'No valid fields provided to update' });
        }
        updateData.updatedAt = new Date();
        await dbConnect_1.db
            .update(schema_1.customers)
            .set(updateData)
            .where((0, drizzle_orm_1.eq)(schema_1.customers.customerId, customerId));
        const [updated] = await dbConnect_1.db
            .select()
            .from(schema_1.customers)
            .where((0, drizzle_orm_1.eq)(schema_1.customers.customerId, customerId))
            .limit(1);
        return res.status(200).json({ message: 'Customer updated successfully', customer: updated });
    }
    catch (error) {
        console.error('updateCustomer error:', error);
        if (error?.code === '23505') {
            return res.status(409).json({ message: 'A customer with this email already exists' });
        }
        return res.status(500).json({ message: 'Failed to update customer', error: error.message });
    }
};
exports.updateCustomer = updateCustomer;
