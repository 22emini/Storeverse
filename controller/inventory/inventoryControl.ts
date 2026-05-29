import { Request, Response } from 'express';
import { and, eq } from 'drizzle-orm';
import { db } from '../../config/dbConnect';
import { Product, inventory, stores, warehouses } from '../../db/schema';

/** Stock at or below this value (but above 0) is "low stock". */
export const LOW_STOCK_THRESHOLD = 10;

export type StockStatus = 'in_stock' | 'low_stock' | 'stockout';

export const getStockStatus = (quantity: number): StockStatus => {
  if (quantity <= 0) return 'stockout';
  if (quantity <= LOW_STOCK_THRESHOLD) return 'low_stock';
  return 'in_stock';
};

const STATUS_LABELS: Record<StockStatus, string> = {
  in_stock: 'In Stock',
  low_stock: 'Low stock',
  stockout: 'Stockout',
};

const parseId = (raw: unknown): number | null => {
  const parsed = typeof raw === 'number' ? raw : parseInt(String(raw ?? ''), 10);
  return isNaN(parsed) ? null : parsed;
};

const formatDate = (date: Date | null): string => {
  if (!date) return '';
  return date.toISOString().slice(0, 10);
};

const stockLabel = (quantity: number): string => {
  const unit = quantity === 1 ? 'unit' : 'units';
  return `${quantity} ${unit}`;
};

const ensureStoreExists = async (storeId: number) => {
  const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
  return store ?? null;
};

const ensureProductBelongsToStore = async (productId: number, storeId: number) => {
  const store = await ensureStoreExists(storeId);
  if (!store) return { error: 'store_not_found' as const };

  const [product] = await db.select().from(Product).where(eq(Product.id, productId)).limit(1);
  if (!product) return { error: 'product_not_found' as const };
  if (product.storeId !== storeId) {
    return { error: 'product_store_mismatch' as const };
  }

  return { store, product };
};

const mapInventoryRow = (row: {
  id: number;
  productName: string | null;
  sku: string | null;
  quantity: number;
  warehouseName: string | null;
  updatedAt: Date;
}) => {
  const status = getStockStatus(row.quantity);
  return {
    id: row.id,
    productName: row.productName ?? '',
    sku: row.sku ?? '',
    stockLevel: row.quantity,
    stockLabel: stockLabel(row.quantity),
    warehouse: row.warehouseName ?? '',
    status,
    statusLabel: STATUS_LABELS[status],
    lastUpdated: formatDate(row.updatedAt),
  };
};

const computeSummary = (quantities: number[]) => {
  let totalStock = 0;
  let inStock = 0;
  let lowStock = 0;
  let outOfStock = 0;

  for (const quantity of quantities) {
    totalStock += quantity;
    const status = getStockStatus(quantity);
    if (status === 'in_stock') inStock += 1;
    else if (status === 'low_stock') lowStock += 1;
    else outOfStock += 1;
  }

  return {
    totalStock,
    inStock,
    lowStock,
    outOfStock,
    labels: {
      totalStock: 'Units available',
      inStock: 'Products',
      lowStock: 'Needs attention',
      outOfStock: 'Unavailable',
    },
  };
};

const fetchInventoryRows = async (storeId: number) => {
  return db
    .select({
      id: inventory.id,
      productName: Product.name,
      sku: Product.sku,
      quantity: inventory.quantity,
      warehouseName: warehouses.name,
      updatedAt: inventory.updatedAt,
    })
    .from(inventory)
    .innerJoin(Product, eq(inventory.productId, Product.id))
    .innerJoin(warehouses, eq(inventory.warehouseId, warehouses.id))
    .where(eq(inventory.storeId, storeId));
};

export const createWarehouse = async (req: Request, res: Response) => {
  try {
    const { storeId, name } = req.body;
    const parsedStoreId = parseId(storeId);

    if (parsedStoreId === null) {
      return res.status(400).json({ message: 'Valid storeId is required' });
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Warehouse name is required' });
    }

    const store = await ensureStoreExists(parsedStoreId);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const [created] = await db
      .insert(warehouses)
      .values({ storeId: parsedStoreId, name: name.trim() })
      .returning();

    return res.status(201).json({ message: 'Warehouse created successfully', warehouse: created });
  } catch (error: unknown) {
    console.error('createWarehouse error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message: 'Failed to create warehouse', error: message });
  }
};

export const getWarehousesByStore = async (req: Request, res: Response) => {
  try {
    const storeId = parseId(req.params.storeId);
    if (storeId === null) {
      return res.status(400).json({ message: 'Valid storeId is required' });
    }

    const store = await ensureStoreExists(storeId);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const list = await db.select().from(warehouses).where(eq(warehouses.storeId, storeId));

    return res.status(200).json({
      message: 'Warehouses fetched successfully',
      count: list.length,
      warehouses: list,
    });
  } catch (error: unknown) {
    console.error('getWarehousesByStore error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message: 'Failed to fetch warehouses', error: message });
  }
};

export const addInventoryItem = async (req: Request, res: Response) => {
  try {
    const { storeId, productId, warehouseId, quantity } = req.body;
    const parsedStoreId = parseId(storeId);
    const parsedProductId = parseId(productId);
    const parsedWarehouseId = parseId(warehouseId);

    if (parsedStoreId === null || parsedProductId === null || parsedWarehouseId === null) {
      return res.status(400).json({
        message: 'Valid storeId, productId, and warehouseId are required',
      });
    }

    const ownership = await ensureProductBelongsToStore(parsedProductId, parsedStoreId);
    if ('error' in ownership) {
      if (ownership.error === 'store_not_found') {
        return res.status(404).json({ message: 'Store not found' });
      }
      if (ownership.error === 'product_not_found') {
        return res.status(404).json({ message: 'Product not found' });
      }
      return res.status(400).json({ message: 'Product does not belong to this store owner' });
    }

    const [warehouse] = await db
      .select()
      .from(warehouses)
      .where(and(eq(warehouses.id, parsedWarehouseId), eq(warehouses.storeId, parsedStoreId)))
      .limit(1);

    if (!warehouse) {
      return res.status(404).json({ message: 'Warehouse not found for this store' });
    }

    let parsedQuantity = 0;
    if (quantity !== undefined && quantity !== null && quantity !== '') {
      parsedQuantity = typeof quantity === 'number' ? quantity : parseInt(String(quantity), 10);
      if (isNaN(parsedQuantity) || parsedQuantity < 0) {
        return res.status(400).json({ message: 'Quantity must be a non-negative number' });
      }
    }

    const [created] = await db
      .insert(inventory)
      .values({
        storeId: parsedStoreId,
        productId: parsedProductId,
        warehouseId: parsedWarehouseId,
        quantity: parsedQuantity,
      })
      .returning();

    return res.status(201).json({ message: 'Inventory item added successfully', item: created });
  } catch (error: unknown) {
    console.error('addInventoryItem error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('inventory_product_warehouse_unique')) {
      return res.status(409).json({
        message: 'This product already has stock recorded at this warehouse',
      });
    }
    return res.status(500).json({ message: 'Failed to add inventory item', error: message });
  }
};

export const getInventoryByStore = async (req: Request, res: Response) => {
  try {
    const storeId = parseId(req.params.storeId);
    if (storeId === null) {
      return res.status(400).json({ message: 'Valid storeId is required' });
    }

    const store = await ensureStoreExists(storeId);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const rows = await fetchInventoryRows(storeId);
    const items = rows.map(mapInventoryRow);
    const summary = computeSummary(rows.map((r) => r.quantity));

    return res.status(200).json({
      message: 'Inventory fetched successfully',
      summary,
      count: items.length,
      items,
    });
  } catch (error: unknown) {
    console.error('getInventoryByStore error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message: 'Failed to fetch inventory', error: message });
  }
};

export const getInventorySummary = async (req: Request, res: Response) => {
  try {
    const storeId = parseId(req.params.storeId);
    if (storeId === null) {
      return res.status(400).json({ message: 'Valid storeId is required' });
    }

    const store = await ensureStoreExists(storeId);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const rows = await fetchInventoryRows(storeId);
    const summary = computeSummary(rows.map((r) => r.quantity));

    return res.status(200).json({
      message: 'Inventory summary fetched successfully',
      summary,
    });
  } catch (error: unknown) {
    console.error('getInventorySummary error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message: 'Failed to fetch inventory summary', error: message });
  }
};

export const adjustStock = async (req: Request, res: Response) => {
  try {
    const inventoryId = parseId(req.params.id);
    if (inventoryId === null) {
      return res.status(400).json({ message: 'Valid inventory ID is required' });
    }

    const [existing] = await db.select().from(inventory).where(eq(inventory.id, inventoryId)).limit(1);
    if (!existing) {
      return res.status(404).json({ message: 'Inventory record not found' });
    }

    const body = req.body as { quantity?: unknown; adjustment?: unknown };
    let newQuantity: number | null = null;

    if (body.quantity !== undefined && body.quantity !== null && body.quantity !== '') {
      const parsed =
        typeof body.quantity === 'number' ? body.quantity : parseInt(String(body.quantity), 10);
      if (isNaN(parsed) || parsed < 0) {
        return res.status(400).json({ message: 'Quantity must be a non-negative number' });
      }
      newQuantity = parsed;
    } else if (
      body.adjustment !== undefined &&
      body.adjustment !== null &&
      body.adjustment !== ''
    ) {
      const delta =
        typeof body.adjustment === 'number'
          ? body.adjustment
          : parseInt(String(body.adjustment), 10);
      if (isNaN(delta)) {
        return res.status(400).json({ message: 'Adjustment must be a valid number' });
      }
      newQuantity = existing.quantity + delta;
      if (newQuantity < 0) {
        return res.status(400).json({ message: 'Stock cannot go below zero' });
      }
    } else {
      return res.status(400).json({
        message: 'Provide quantity (set level) or adjustment (relative change)',
      });
    }

    await db
      .update(inventory)
      .set({ quantity: newQuantity, updatedAt: new Date() })
      .where(eq(inventory.id, inventoryId));

    const rows = await fetchInventoryRows(existing.storeId);
    const updatedRow = rows.find((r) => r.id === inventoryId);

    if (!updatedRow) {
      return res.status(200).json({ message: 'Stock updated successfully' });
    }

    return res.status(200).json({
      message: 'Stock updated successfully',
      item: mapInventoryRow(updatedRow),
    });
  } catch (error: unknown) {
    console.error('adjustStock error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message: 'Failed to adjust stock', error: message });
  }
};
