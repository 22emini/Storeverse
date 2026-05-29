// createStore, getStore, updateStore

import { Request, Response } from 'express';
import { db } from '../../config/dbConnect';
import { users, stores } from '../../db/schema';

import { eq } from 'drizzle-orm';


export const createStore = async (req: Request, res: Response) => {

  try {

    const { userId, image, storeName, category, businessAddress, country, currency, subDomain } = req.body;


    const parsedUserId =
      typeof userId === 'number' ? userId : parseInt(String(userId ?? ''), 10);

    if (!userId || isNaN(parsedUserId)) {

      return res.status(400).json({ message: 'Valid userId is required' });

    }

    if (!storeName || !subDomain) {

      return res.status(400).json({ message: 'storeName and subDomain are required' });


    }


    const userResult = await db.select().from(users).where(eq(users.id, parsedUserId)).limit(1);

    if (userResult.length === 0) {

      return res.status(404).json({ message: 'User not found' });

    }


    const [store] = await db
      .insert(stores)
      .values({
        userId: parsedUserId,
        image,
        storeName,
        category,
        businessAddress,
        country,
        currency,
        subDomain,
      })
      .returning();


    res.status(201).json({ message: 'Store created successfully', store });

    console.log('Store created successfully');

  } catch (error: any) {

    console.error('Error creating store:', error);

    res.status(500).json({ message: 'Failed to create store', error: error.message });

  }


};

export const getStore = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'Store ID is required' });
    }
    const storeId = parseInt(id as string, 10);
    if (isNaN(storeId)) {
      return res.status(400).json({ message: 'Invalid store ID' });
    }
    const store = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
    if (store.length === 0) {
      return res.status(404).json({ message: 'Store not found' });
    }
    res.status(200).json({ message: 'Store fetched successfully', store });
  } catch (error: any) {
    console.error('Error fetching store:', error);
    res.status(500).json({ message: 'Failed to fetch store', error: error.message });
  }
};

export const updateStore = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { storeName, category, businessAddress, country, currency, subDomain } = req.body;
    const parsedStoreId = typeof id === 'number' ? id : parseInt(String(id ?? ''), 10);
    if (!id || isNaN(parsedStoreId)) {
      return res.status(400).json({ message: 'Valid store ID is required' });
    }
    const storeResult = await db.select().from(stores).where(eq(stores.id, parsedStoreId)).limit(1);
    if (storeResult.length === 0) {
      return res.status(404).json({ message: 'Store not found' });
    }
    const updateData: any = {};
    if (storeName) {
      updateData.storeName = storeName;
    }
    if (category) {
      updateData.category = category;
    }
    if (businessAddress) {
      updateData.businessAddress = businessAddress;
    }
    if (country) {
      updateData.country = country;
    }
    if (currency) {
      updateData.currency = currency;
    }
    if (subDomain) {
      updateData.subDomain = subDomain;
    }
    updateData.updatedAt = new Date();
    await db.update(stores).set(updateData).where(eq(stores.id, parsedStoreId));
    const updatedStoreResult = await db.select().from(stores).where(eq(stores.id, parsedStoreId)).limit(1);
    res.status(200).json({ message: 'Store updated successfully', store: updatedStoreResult[0] });
    console.log('Store updated successfully');
  } catch (error: any) {
    console.error('Error updating store:', error);
    res.status(500).json({ message: 'Failed to update store', error: error.message });
  }
};