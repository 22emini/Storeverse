import { Request, Response } from 'express';

import { db } from '../../config/dbConnect';

import { stores, Region } from '../../db/schema';

import { eq } from 'drizzle-orm';

export const Regiontax = async (req: Request, res: Response) => {
  try {
    const { storeId, country, code, taxRate, status, shippingZone } = req.body;
    const parsedStoreId =
      typeof storeId === 'number' ? storeId : parseInt(String(storeId ?? ''), 10);

    if (!storeId || isNaN(parsedStoreId)) {
      return res.status(400).json({ message: 'Valid store Id is required' });
    }

    const storeResult = await db
      .select()
      .from(stores)
      .where(eq(stores.id, parsedStoreId))
      .limit(1);

    if (storeResult.length === 0) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const [regionTax] = await db
      .insert(Region)
      .values({
        storeId: parsedStoreId,
        country,
        code,
        taxRate,
        status,
        shippingZone
      })
      .returning();

    res.status(201).json({ message: 'Region tax added successfully', region: regionTax });
  } catch (error: any) {
    console.error('Error creating region tax:', error);
    res.status(500).json({ message: 'Failed to create region tax', error: error.message });
  }
};

export const fetchRegionTax = async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const parsedStoreId =
      typeof storeId === 'number' ? storeId : parseInt(String(storeId ?? ''), 10);

    if (!storeId || isNaN(parsedStoreId)) {
      return res.status(400).json({ message: 'Valid store ID is required' });
    }

    const storeResult = await db
      .select()
      .from(stores)
      .where(eq(stores.id, parsedStoreId))
      .limit(1);

    if (storeResult.length === 0) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const regions = await db
      .select()
      .from(Region)
      .where(eq(Region.storeId, parsedStoreId));

    res.status(200).json({
      message: 'Region tax fetched successfully',
      count: regions.length,
      regions,
    });
  } catch (error: any) {
    console.error('Error fetching region tax:', error);
    res.status(500).json({ message: 'Failed to fetch region tax', error: error.message });
  }
};

export const updateRegionTax = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { country, code, taxRate, status } = req.body;
    const parsedId = parseInt(id as string, 10);

    if (isNaN(parsedId)) {
      return res.status(400).json({ message: 'Invalid region ID' });
    }

    const regionResult = await db
      .select()
      .from(Region)
      .where(eq(Region.id, parsedId))
      .limit(1);

    if (regionResult.length === 0) {
      return res.status(404).json({ message: 'Region not found' });
    }

    const updateData: Partial<typeof Region.$inferInsert> = {};
    if (country !== undefined) updateData.country = country;
    if (code !== undefined) updateData.code = code;
    if (taxRate !== undefined) updateData.taxRate = taxRate;
    if (status !== undefined) updateData.status = status;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    await db.update(Region).set(updateData).where(eq(Region.id, parsedId));

    const [updatedRegion] = await db
      .select()
      .from(Region)
      .where(eq(Region.id, parsedId))
      .limit(1);

    res.status(200).json({ message: 'Region tax updated successfully', region: updatedRegion });
  } catch (error: any) {
    console.error('Error updating region tax:', error);
    res.status(500).json({ message: 'Failed to update region tax', error: error.message });
  }
};