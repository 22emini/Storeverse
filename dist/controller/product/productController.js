"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductsByUser = exports.updateProduct = exports.getProductsByStore = exports.getProduct = exports.bulkUploadProducts = exports.addProduct = void 0;
const dbConnect_1 = require("../../config/dbConnect");
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const PRODUCT_FIELDS = [
    'image',
    'name',
    'description',
    'category',
    'price',
    'stock',
    'sku',
    'barcode',
    'status',
    'variants',
];
const parseId = (raw) => {
    const parsed = typeof raw === 'number' ? raw : parseInt(String(raw ?? ''), 10);
    return isNaN(parsed) ? null : parsed;
};
const resolveName = (row) => {
    const name = row.name ?? row.product;
    if (typeof name !== 'string' || !name.trim()) {
        return null;
    }
    return name.trim();
};
const mapRowToValues = (row, storeId) => {
    const name = resolveName(row);
    if (!name) {
        return { error: 'Each product requires a name (or legacy field "product")' };
    }
    const stockRaw = row.stock;
    let stock;
    if (stockRaw !== undefined && stockRaw !== null && stockRaw !== '') {
        stock = typeof stockRaw === 'number' ? stockRaw : parseInt(String(stockRaw), 10);
        if (isNaN(stock)) {
            return { error: `Invalid stock value for "${name}"` };
        }
    }
    const values = { storeId, name };
    if (stock !== undefined)
        values.stock = stock;
    for (const field of PRODUCT_FIELDS) {
        if (field === 'name' || field === 'stock')
            continue;
        const val = row[field];
        if (val !== undefined && val !== null && val !== '') {
            values[field] = typeof val === 'string' ? val : String(val);
        }
    }
    return values;
};
const ensureStoreExists = async (storeId) => {
    const result = await dbConnect_1.db.select({ id: schema_1.stores.id }).from(schema_1.stores).where((0, drizzle_orm_1.eq)(schema_1.stores.id, storeId)).limit(1);
    return result.length > 0;
};
const addProduct = async (req, res) => {
    try {
        const { storeId, ...row } = req.body;
        const parsedStoreId = parseId(storeId);
        if (parsedStoreId === null) {
            return res.status(400).json({ message: 'Valid storeId is required' });
        }
        if (!(await ensureStoreExists(parsedStoreId))) {
            return res.status(404).json({ message: 'Store not found' });
        }
        const mapped = mapRowToValues(row, parsedStoreId);
        if ('error' in mapped) {
            return res.status(400).json({ message: mapped.error });
        }
        const [created] = await dbConnect_1.db
            .insert(schema_1.Product)
            .values(mapped)
            .returning();
        return res.status(201).json({ message: 'Product added successfully', product: created });
    }
    catch (error) {
        console.error('addProduct error:', error);
        return res.status(500).json({ message: 'Failed to add product', error: error.message });
    }
};
exports.addProduct = addProduct;
const bulkUploadProducts = async (req, res) => {
    try {
        let payload = req.body;
        const file = req.file;
        if (file) {
            const text = file.buffer.toString('utf-8');
            try {
                payload = JSON.parse(text);
            }
            catch {
                return res.status(400).json({
                    message: 'Uploaded file must be valid JSON (array of products or { storeId, products })',
                });
            }
        }
        const storeId = parseId(payload.storeId ?? req.body.storeId);
        const products = Array.isArray(payload)
            ? payload
            : Array.isArray(payload.products)
                ? payload.products
                : null;
        if (storeId === null) {
            return res.status(400).json({ message: 'Valid storeId is required' });
        }
        if (!products || products.length === 0) {
            return res.status(400).json({
                message: 'Provide a non-empty products array in the body or upload a JSON file',
            });
        }
        if (!(await ensureStoreExists(storeId))) {
            return res.status(404).json({ message: 'Store not found' });
        }
        const rows = [];
        const errors = [];
        products.forEach((item, index) => {
            if (!item || typeof item !== 'object') {
                errors.push({ index, message: 'Item must be an object' });
                return;
            }
            const mapped = mapRowToValues(item, storeId);
            if ('error' in mapped && typeof mapped.error === 'string') {
                errors.push({ index, message: mapped.error });
                return;
            }
            rows.push(mapped);
        });
        if (errors.length > 0) {
            return res.status(400).json({
                message: 'Some products failed validation',
                errors,
                validCount: rows.length,
                totalCount: products.length,
            });
        }
        const inserted = await dbConnect_1.db.insert(schema_1.Product).values(rows).returning();
        return res.status(201).json({
            message: `${inserted.length} product(s) uploaded successfully`,
            count: inserted.length,
            products: inserted,
        });
    }
    catch (error) {
        console.error('bulkUploadProducts error:', error);
        return res.status(500).json({ message: 'Failed to bulk upload products', error: error.message });
    }
};
exports.bulkUploadProducts = bulkUploadProducts;
const getProduct = async (req, res) => {
    try {
        const productId = parseId(req.params.id);
        if (productId === null) {
            return res.status(400).json({ message: 'Valid product ID is required' });
        }
        const [product] = await dbConnect_1.db.select().from(schema_1.Product).where((0, drizzle_orm_1.eq)(schema_1.Product.id, productId)).limit(1);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        return res.status(200).json({ message: 'Product fetched successfully', product });
    }
    catch (error) {
        console.error('getProduct error:', error);
        return res.status(500).json({ message: 'Failed to fetch product', error: error.message });
    }
};
exports.getProduct = getProduct;
const getProductsByStore = async (req, res) => {
    try {
        const storeId = parseId(req.params.storeId);
        if (storeId === null) {
            return res.status(400).json({ message: 'Valid storeId is required' });
        }
        if (!(await ensureStoreExists(storeId))) {
            return res.status(404).json({ message: 'Store not found' });
        }
        const products = await dbConnect_1.db.select().from(schema_1.Product).where((0, drizzle_orm_1.eq)(schema_1.Product.storeId, storeId));
        return res.status(200).json({
            message: 'Products fetched successfully',
            count: products.length,
            products,
        });
    }
    catch (error) {
        console.error('getProductsByStore error:', error);
        return res.status(500).json({ message: 'Failed to fetch products', error: error.message });
    }
};
exports.getProductsByStore = getProductsByStore;
const updateProduct = async (req, res) => {
    try {
        const productId = parseId(req.params.id);
        if (productId === null) {
            return res.status(400).json({ message: 'Valid product ID is required' });
        }
        const existing = await dbConnect_1.db.select().from(schema_1.Product).where((0, drizzle_orm_1.eq)(schema_1.Product.id, productId)).limit(1);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        const body = req.body;
        const updateData = {};
        if (body.name !== undefined || body.product !== undefined) {
            const name = resolveName(body);
            if (!name) {
                return res.status(400).json({ message: 'Product name cannot be empty' });
            }
            updateData.name = name;
        }
        if (body.stock !== undefined) {
            const stock = typeof body.stock === 'number' ? body.stock : parseInt(String(body.stock), 10);
            if (isNaN(stock)) {
                return res.status(400).json({ message: 'Invalid stock value' });
            }
            updateData.stock = stock;
        }
        for (const field of PRODUCT_FIELDS) {
            if (field === 'name' || field === 'stock')
                continue;
            if (body[field] !== undefined && body[field] !== null && body[field] !== '') {
                updateData[field] = body[field];
            }
        }
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'No valid fields provided to update' });
        }
        updateData.updatedAt = new Date();
        await dbConnect_1.db
            .update(schema_1.Product)
            .set(updateData)
            .where((0, drizzle_orm_1.eq)(schema_1.Product.id, productId));
        const [updated] = await dbConnect_1.db.select().from(schema_1.Product).where((0, drizzle_orm_1.eq)(schema_1.Product.id, productId)).limit(1);
        return res.status(200).json({ message: 'Product updated successfully', product: updated });
    }
    catch (error) {
        console.error('updateProduct error:', error);
        return res.status(500).json({ message: 'Failed to update product', error: error.message });
    }
};
exports.updateProduct = updateProduct;
/** @deprecated Use getProductsByStore */
exports.getProductsByUser = exports.getProductsByStore;
