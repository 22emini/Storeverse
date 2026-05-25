
import { Request, Response } from 'express';

import { db } from '../../config/dbConnect';

import { stores, Staff } from '../../db/schema';

import { eq } from 'drizzle-orm';

export const CreateRole = async (req: Request, res: Response) => {
  try {
    const { storeId, name, email, role, status } = req.body;
    const parsedStoreId =
      typeof storeId === 'number' ? storeId : parseInt(String(storeId ?? ''), 10);

    if (!storeId || isNaN(parsedStoreId)) {
      return res.status(400).json({ message: 'Valid store Id is required' });
    }

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const storeResult = await db
      .select()
      .from(stores)
      .where(eq(stores.id, parsedStoreId))
      .limit(1);

    if (storeResult.length === 0) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const [createdStaff] = await db
      .insert(Staff)
      .values({
        storeId: parsedStoreId,
        name,
        email,
        role,
        status,
      })
      .returning();

    res.status(201).json({ message: 'Role created successfully', staff: createdStaff});
  } catch (error: any) {
    console.error('Error creating role:', error);
    if (error?.cause?.code === '23505') {
      return res.status(409).json({ message: 'Email already exists for another staff member' });
    }
    res.status(500).json({ message: 'Failed to create role', error: error.message });
  }
};


export const getRolesByStoreId = async (req: Request, res: Response) => {
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

    const staffList = await db
      .select()
      .from(Staff)
      .where(eq(Staff.storeId, parsedStoreId));

    res.status(200).json({
      message: 'Staff fetched successfully',
      count: staffList.length,
      staff: staffList,
    });
  } catch (error: any) {
    console.error('Error fetching staff by store:', error);
    res.status(500).json({
      message: 'Failed to fetch staff',
      error: error.message,
    });
  }
};

export const UpdateStaff = async (req: Request, res: Response) => {
  try{
    const { id } = req.params;
    const {name, email, role, status} = req.body;
    const parsedId = parseInt(id as string, 10);
    if (isNaN(parsedId)) {
      return res.status(400).json({ message: 'Invalid staff ID' });
    }
    const staffResult = await db.select().from(Staff).where(eq(Staff.id, parsedId)).limit(1);
    if (staffResult.length === 0) {
      return res.status(404).json({ message: 'Staff not found' });
    }
    const updateData: any = {};
    if (name) {
      updateData.name = name;
    }
    if (email) {
      updateData.email = email;
    }
    if (role) {
      updateData.role = role;
    }
    if (status) {
      updateData.status = status;
    }
    updateData.updatedAt = new Date();
    await db.update(Staff).set(updateData).where(eq(Staff.id, parsedId));
    const updatedStaffResult = await db.select().from(Staff).where(eq(Staff.id, parsedId)).limit(1);
    res.status(200).json({ message: 'Staff updated successfully', staff: updatedStaffResult[0] });
    console.log('Staff updated successfully');

  }catch(error:any){
    console.error('Error updating staff:', error);
    res.status(500).json({ message: 'Failed to update staff', error: error.message });
  }
}

export const DeleteStaff = async (req: Request, res: Response) => {
  try{
    const { id } = req.params;
    const parsedId = parseInt(id as string, 10);
    if (isNaN(parsedId)) {
      return res.status(400).json({ message: 'Invalid staff ID' });
    }
    const staffResult = await db.select().from(Staff).where(eq(Staff.id, parsedId)).limit(1);
    if (staffResult.length === 0) {
      return res.status(404).json({ message: 'Staff not found' });
    }
    await db.delete(Staff).where(eq(Staff.id, parsedId));
    res.status(200).json({ message: 'Staff deleted successfully' });
    console.log('Staff deleted successfully');
  }
  catch(error:any){
    console.error('Error deleting staff:', error);
    res.status(500).json({ message: 'Failed to delete staff', error: error.message });
  }
}
