"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRegionTax = exports.fetchRegionTax = exports.Regiontax = void 0;
const dbConnect_1 = require("../../config/dbConnect");
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const Regiontax = async (req, res) => {
    try {
        const { storeId, country, code, taxRate, status, shippingZone } = req.body;
        const parsedStoreId = typeof storeId === 'number' ? storeId : parseInt(String(storeId ?? ''), 10);
        if (!storeId || isNaN(parsedStoreId)) {
            return res.status(400).json({ message: 'Valid store Id is required' });
        }
        const storeResult = await dbConnect_1.db
            .select()
            .from(schema_1.stores)
            .where((0, drizzle_orm_1.eq)(schema_1.stores.id, parsedStoreId))
            .limit(1);
        if (storeResult.length === 0) {
            return res.status(404).json({ message: 'Store not found' });
        }
        const [regionTax] = await dbConnect_1.db
            .insert(schema_1.Region)
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
    }
    catch (error) {
        console.error('Error creating region tax:', error);
        res.status(500).json({ message: 'Failed to create region tax', error: error.message });
    }
};
exports.Regiontax = Regiontax;
const fetchRegionTax = async (req, res) => {
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
        const regions = await dbConnect_1.db
            .select()
            .from(schema_1.Region)
            .where((0, drizzle_orm_1.eq)(schema_1.Region.storeId, parsedStoreId));
        res.status(200).json({
            message: 'Region tax fetched successfully',
            count: regions.length,
            regions,
        });
    }
    catch (error) {
        console.error('Error fetching region tax:', error);
        res.status(500).json({ message: 'Failed to fetch region tax', error: error.message });
    }
};
exports.fetchRegionTax = fetchRegionTax;
const updateRegionTax = async (req, res) => {
    try {
        const { id } = req.params;
        const { country, code, taxRate, status } = req.body;
        const parsedId = parseInt(id, 10);
        if (isNaN(parsedId)) {
            return res.status(400).json({ message: 'Invalid region ID' });
        }
        const regionResult = await dbConnect_1.db
            .select()
            .from(schema_1.Region)
            .where((0, drizzle_orm_1.eq)(schema_1.Region.id, parsedId))
            .limit(1);
        if (regionResult.length === 0) {
            return res.status(404).json({ message: 'Region not found' });
        }
        const updateData = {};
        if (country !== undefined)
            updateData.country = country;
        if (code !== undefined)
            updateData.code = code;
        if (taxRate !== undefined)
            updateData.taxRate = taxRate;
        if (status !== undefined)
            updateData.status = status;
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }
        await dbConnect_1.db.update(schema_1.Region).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.Region.id, parsedId));
        const [updatedRegion] = await dbConnect_1.db
            .select()
            .from(schema_1.Region)
            .where((0, drizzle_orm_1.eq)(schema_1.Region.id, parsedId))
            .limit(1);
        res.status(200).json({ message: 'Region tax updated successfully', region: updatedRegion });
    }
    catch (error) {
        console.error('Error updating region tax:', error);
        res.status(500).json({ message: 'Failed to update region tax', error: error.message });
    }
};
exports.updateRegionTax = updateRegionTax;
