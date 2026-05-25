
import { Request, Response } from 'express';

import { db } from '../../config/dbConnect';

import { stores, StoreAnylytics } from '../../db/schema';

import { eq } from 'drizzle-orm'

export const AnalyticData = async (req: Request , res :Response)=>{

    try{
        const {storeId, totalSales, orders , visitors, activeProducts} = req.body;
        
        const parsedStoreId =
        typeof storeId === 'number' ? storeId : parseInt(String(storeId ?? ''), 10);
  
      if (!storeId || isNaN(parsedStoreId)) {
        return res.status(400).json({ message: 'Valid store Id is required' });
       }
       if(!totalSales){
        res.status(400).json({
            message :" error !, no total sales found"
        })
        
       }

       if(!orders){
        res.status(400).json({
            message :" error !,  no orders found"
        })}
        
       if(!visitors){
        res.status(400).json({
            message :" error !,  no  visitors found"
        })}

        const storeResult = await db
        .select()
        .from(stores)
        .where(eq(stores.id, parsedStoreId))
        .limit(1);
  
      if (storeResult.length === 0) {
        return res.status(404).json({ message: 'Store not found' });
      }

      const [Analytic] = await db.insert(StoreAnylytics).values({
        storeId: parsedStoreId,totalSales, orders , visitors, activeProducts}).returning();
        res.status(201).json({message: "Data has been Added!"})
        

    }
    catch(err:any){
        console.error("Error as occurrd",err)

        res.status(500).json({
            message: "An error as Occurred ",err
        });
    }
}
export const fetchAnalyticData = async (req: Request, res: Response) => {
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

    const analytics = await db
      .select()
      .from(StoreAnylytics)
      .where(eq(StoreAnylytics.storeId, parsedStoreId));

    if (analytics.length === 0) {
      return res.status(404).json({ message: 'Analytics data not found' });
    }

    return res.status(200).json({
      message: 'Data fetched successfully',
      data: analytics,
    });
  } catch (error: unknown) {
    console.error('an error occurred', error);
    return res.status(500).json({ message: 'An error occurred' });
  }
};