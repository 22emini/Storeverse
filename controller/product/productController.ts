import { Request, Response } from 'express';
import { db } from '../../config/dbConnect';
import { Product, users } from '../../db/schema';
import { eq } from 'drizzle-orm';

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
] as const;

type ProductField = (typeof PRODUCT_FIELDS)[number];

const parseId = (raw: unknown): number | null => {
  const parsed = typeof raw === 'number' ? raw : parseInt(String(raw ?? ''), 10);
  return isNaN(parsed) ? null : parsed;
};

const resolveName = (row: Record<string, unknown>): string | null => {
  const name = row.name ?? row.product;
  if (typeof name !== 'string' || !name.trim()) {
    return null;
  }
  return name.trim();
};

const mapRowToValues = (
  row: Record<string, unknown>,
  userId: number
): Record<string, unknown> | { error: string; name?: never } => {
  const name = resolveName(row);
  if (!name) {
    return { error: 'Each product requires a name (or legacy field "product")' };
  }

  const stockRaw = row.stock;
  let stock: number | undefined;
  if (stockRaw !== undefined && stockRaw !== null && stockRaw !== '') {
    stock = typeof stockRaw === 'number' ? stockRaw : parseInt(String(stockRaw), 10);
    if (isNaN(stock)) {
      return { error: `Invalid stock value for "${name}"` };
    }
  }

  const values: Record<string, unknown> = { userId, name };
  if (stock !== undefined) values.stock = stock;

  for (const field of PRODUCT_FIELDS) {
    if (field === 'name' || field === 'stock') continue;
    const val = row[field];
    if (val !== undefined && val !== null && val !== '') {
      values[field] = typeof val === 'string' ? val : String(val);
    }
  }

  return values;
};

const ensureUserExists = async (userId: number): Promise<boolean> => {
  const result = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0;
};

export const addProduct = async (req: Request, res: Response) => {
  try {
    const { userId, ...row } = req.body;
    const parsedUserId = parseId(userId);

    if (parsedUserId === null) {
      return res.status(400).json({ message: 'Valid userId is required' });
    }

    if (!(await ensureUserExists(parsedUserId))) {
      return res.status(404).json({ message: 'User not found' });
    }

    const mapped = mapRowToValues(row, parsedUserId);
    if ('error' in mapped) {
      return res.status(400).json({ message: mapped.error });
    }

    const [created] = await db
      .insert(Product)
      .values(mapped as typeof Product.$inferInsert)
      .returning();

    return res.status(201).json({ message: 'Product added successfully', product: created });
  } catch (error: any) {
    console.error('addProduct error:', error);
    return res.status(500).json({ message: 'Failed to add product', error: error.message });
  }
};

export const bulkUploadProducts = async (req: Request, res: Response) => {
  try {
    let payload = req.body;
    const file = req.file as Express.Multer.File | undefined;

    if (file) {
      const text = file.buffer.toString('utf-8');
      try {
        payload = JSON.parse(text);
      } catch {
        return res.status(400).json({
          message: 'Uploaded file must be valid JSON (array of products or { userId, products })',
        });
      }
    }

    const userId = parseId(payload.userId ?? req.body.userId);
    const products: unknown[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.products)
        ? payload.products
        : null;

    if (userId === null) {
      return res.status(400).json({ message: 'Valid userId is required' });
    }

    if (!products || products.length === 0) {
      return res.status(400).json({
        message: 'Provide a non-empty products array in the body or upload a JSON file',
      });
    }

    if (!(await ensureUserExists(userId))) {
      return res.status(404).json({ message: 'User not found' });
    }

    const rows: (typeof Product.$inferInsert)[] = [];
    const errors: { index: number; message: string }[] = [];

    products.forEach((item, index) => {
      if (!item || typeof item !== 'object') {
        errors.push({ index, message: 'Item must be an object' });
        return;
      }
      const mapped = mapRowToValues(item as Record<string, unknown>, userId);
      if ('error' in mapped && typeof mapped.error === 'string') {
        errors.push({ index, message: mapped.error });
        return;
      }
      rows.push(mapped as typeof Product.$inferInsert);
    });

    if (errors.length > 0) {
      return res.status(400).json({
        message: 'Some products failed validation',
        errors,
        validCount: rows.length,
        totalCount: products.length,
      });
    }

    const inserted = await db.insert(Product).values(rows).returning();

    return res.status(201).json({
      message: `${inserted.length} product(s) uploaded successfully`,
      count: inserted.length,
      products: inserted,
    });
  } catch (error: any) {
    console.error('bulkUploadProducts error:', error);
    return res.status(500).json({ message: 'Failed to bulk upload products', error: error.message });
  }
};

export const getProduct = async (req: Request, res: Response) => {
  try {
    const productId = parseId(req.params.id);
    if (productId === null) {
      return res.status(400).json({ message: 'Valid product ID is required' });
    }

    const [product] = await db.select().from(Product).where(eq(Product.id, productId)).limit(1);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.status(200).json({ message: 'Product fetched successfully', product });
  } catch (error: any) {
    console.error('getProduct error:', error);
    return res.status(500).json({ message: 'Failed to fetch product', error: error.message });
  }
};

export const getProductsByUser = async (req: Request, res: Response) => {
  try {
    const userId = parseId(req.params.userId);
    if (userId === null) {
      return res.status(400).json({ message: 'Valid userId is required' });
    }

    if (!(await ensureUserExists(userId))) {
      return res.status(404).json({ message: 'User not found' });
    }

    const products = await db.select().from(Product).where(eq(Product.userId, userId));

    return res.status(200).json({
      message: 'Products fetched successfully',
      count: products.length,
      products,
    });
  } catch (error: any) {
    console.error('getProductsByUser error:', error);
    return res.status(500).json({ message: 'Failed to fetch products', error: error.message });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const productId = parseId(req.params.id);
    if (productId === null) {
      return res.status(400).json({ message: 'Valid product ID is required' });
    }

    const existing = await db.select().from(Product).where(eq(Product.id, productId)).limit(1);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const body = req.body as Record<string, unknown>;
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined || body.product !== undefined) {
      const name = resolveName(body);
      if (!name) {
        return res.status(400).json({ message: 'Product name cannot be empty' });
      }
      updateData.name = name;
    }

    if (body.stock !== undefined) {
      const stock =
        typeof body.stock === 'number' ? body.stock : parseInt(String(body.stock), 10);
      if (isNaN(stock)) {
        return res.status(400).json({ message: 'Invalid stock value' });
      }
      updateData.stock = stock;
    }

    for (const field of PRODUCT_FIELDS) {
      if (field === 'name' || field === 'stock') continue;
      if (body[field] !== undefined && body[field] !== null && body[field] !== '') {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No valid fields provided to update' });
    }

    updateData.updatedAt = new Date();

    await db
      .update(Product)
      .set(updateData as Partial<typeof Product.$inferInsert>)
      .where(eq(Product.id, productId));

    const [updated] = await db.select().from(Product).where(eq(Product.id, productId)).limit(1);

    return res.status(200).json({ message: 'Product updated successfully', product: updated });
  } catch (error: any) {
    console.error('updateProduct error:', error);
    return res.status(500).json({ message: 'Failed to update product', error: error.message });
  }
};
