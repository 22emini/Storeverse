"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteStaff = exports.UpdateStaff = exports.getRolesByStoreId = exports.CreateRole = void 0;
const dbConnect_1 = require("../config/dbConnect");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const CreateRole = async (req, res) => {
    try {
        const { storeId, name, email, role, status } = req.body;
        const parsedStoreId = typeof storeId === 'number' ? storeId : parseInt(String(storeId ?? ''), 10);
        if (!storeId || isNaN(parsedStoreId)) {
            return res.status(400).json({ message: 'Valid store Id is required' });
        }
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        const storeResult = await dbConnect_1.db
            .select()
            .from(schema_1.stores)
            .where((0, drizzle_orm_1.eq)(schema_1.stores.id, parsedStoreId))
            .limit(1);
        if (storeResult.length === 0) {
            return res.status(404).json({ message: 'Store not found' });
        }
        const [createdStaff] = await dbConnect_1.db
            .insert(schema_1.Staff)
            .values({
            storeId: parsedStoreId,
            name,
            email,
            role,
            status,
        })
            .returning();
        res.status(201).json({ message: 'Role created successfully', staff: createdStaff });
    }
    catch (error) {
        console.error('Error creating role:', error);
        if (error?.cause?.code === '23505') {
            return res.status(409).json({ message: 'Email already exists for another staff member' });
        }
        res.status(500).json({ message: 'Failed to create role', error: error.message });
    }
};
exports.CreateRole = CreateRole;
const getRolesByStoreId = async (req, res) => {
    try {
        const { storeId } = req.params;
        const parsedStoreId = typeof storeId === 'number' ? storeId : parseInt(String(storeId ?? ''), 10);
        if (!storeId || isNaN(parsedStoreId)) {
            return res.status(400).json({ message: 'Valid store ID is required' });
        }
        const storeResult = await dbConnect_1.db
            .select()
            .from(schema_1.stores)
            .where((0, drizzle_orm_1.eq)(schema_1.stores.id, parsedStoreId))
            .limit(1);
        if (storeResult.length === 0) {
            return res.status(404).json({ message: 'Store not found' });
        }
        const staffList = await dbConnect_1.db
            .select()
            .from(schema_1.Staff)
            .where((0, drizzle_orm_1.eq)(schema_1.Staff.storeId, parsedStoreId));
        res.status(200).json({
            message: 'Staff fetched successfully',
            count: staffList.length,
            staff: staffList,
        });
    }
    catch (error) {
        console.error('Error fetching staff by store:', error);
        res.status(500).json({
            message: 'Failed to fetch staff',
            error: error.message,
        });
    }
};
exports.getRolesByStoreId = getRolesByStoreId;
const UpdateStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, role, status } = req.body;
        const parsedId = parseInt(id, 10);
        if (isNaN(parsedId)) {
            return res.status(400).json({ message: 'Invalid staff ID' });
        }
        const staffResult = await dbConnect_1.db.select().from(schema_1.Staff).where((0, drizzle_orm_1.eq)(schema_1.Staff.id, parsedId)).limit(1);
        if (staffResult.length === 0) {
            return res.status(404).json({ message: 'Staff not found' });
        }
        const updateData = {};
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
        await dbConnect_1.db.update(schema_1.Staff).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.Staff.id, parsedId));
        const updatedStaffResult = await dbConnect_1.db.select().from(schema_1.Staff).where((0, drizzle_orm_1.eq)(schema_1.Staff.id, parsedId)).limit(1);
        res.status(200).json({ message: 'Staff updated successfully', staff: updatedStaffResult[0] });
        console.log('Staff updated successfully');
    }
    catch (error) {
        console.error('Error updating staff:', error);
        res.status(500).json({ message: 'Failed to update staff', error: error.message });
    }
};
exports.UpdateStaff = UpdateStaff;
const DeleteStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const parsedId = parseInt(id, 10);
        if (isNaN(parsedId)) {
            return res.status(400).json({ message: 'Invalid staff ID' });
        }
        const staffResult = await dbConnect_1.db.select().from(schema_1.Staff).where((0, drizzle_orm_1.eq)(schema_1.Staff.id, parsedId)).limit(1);
        if (staffResult.length === 0) {
            return res.status(404).json({ message: 'Staff not found' });
        }
        await dbConnect_1.db.delete(schema_1.Staff).where((0, drizzle_orm_1.eq)(schema_1.Staff.id, parsedId));
        res.status(200).json({ message: 'Staff deleted successfully' });
        console.log('Staff deleted successfully');
    }
    catch (error) {
        console.error('Error deleting staff:', error);
        res.status(500).json({ message: 'Failed to delete staff', error: error.message });
    }
};
exports.DeleteStaff = DeleteStaff;
