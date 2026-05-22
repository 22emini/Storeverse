"use strict";
// createStore, getStore, updateStore
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStore = exports.getStore = exports.createStore = void 0;
const dbConnect_1 = require("../config/dbConnect");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const cloudinaryUpload_1 = require("../utils/cloudinaryUpload");
const createStore = async (req, res) => {
    try {
        const { userId, image, storeName, category, businessAddress, country, currency, subDomain } = req.body;
        const parsedUserId = typeof userId === 'number' ? userId : parseInt(String(userId ?? ''), 10);
        if (!userId || isNaN(parsedUserId)) {
            return res.status(400).json({ message: 'Valid userId is required' });
        }
        if (!storeName || !subDomain) {
            return res.status(400).json({ message: 'storeName and subDomain are required' });
        }
        const userResult = await dbConnect_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, parsedUserId)).limit(1);
        if (userResult.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        let imageUrl = typeof image === 'string' ? image : undefined;
        if (req.file) {
            try {
                imageUrl = await (0, cloudinaryUpload_1.uploadStoreImage)(req.file.buffer);
            }
            catch (uploadError) {
                console.error('Cloudinary upload failed:', uploadError);
                return res.status(500).json({
                    message: 'Failed to upload store image',
                    error: uploadError.message,
                });
            }
        }
        const [store] = await dbConnect_1.db
            .insert(schema_1.stores)
            .values({
            userId: parsedUserId,
            image: imageUrl,
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
    }
    catch (error) {
        console.error('Error creating store:', error);
        res.status(500).json({ message: 'Failed to create store', error: error.message });
    }
};
exports.createStore = createStore;
const getStore = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'Store ID is required' });
        }
        const storeId = parseInt(id, 10);
        if (isNaN(storeId)) {
            return res.status(400).json({ message: 'Invalid store ID' });
        }
        const store = await dbConnect_1.db.select().from(schema_1.stores).where((0, drizzle_orm_1.eq)(schema_1.stores.id, storeId)).limit(1);
        if (store.length === 0) {
            return res.status(404).json({ message: 'Store not found' });
        }
        res.status(200).json({ message: 'Store fetched successfully', store });
    }
    catch (error) {
        console.error('Error fetching store:', error);
        res.status(500).json({ message: 'Failed to fetch store', error: error.message });
    }
};
exports.getStore = getStore;
const updateStore = async (req, res) => {
    try {
        const { id } = req.params;
        const { image, storeName, category, businessAddress, country, currency, subDomain } = req.body;
        const parsedStoreId = typeof id === 'number' ? id : parseInt(String(id ?? ''), 10);
        if (!id || isNaN(parsedStoreId)) {
            return res.status(400).json({ message: 'Valid store ID is required' });
        }
        const storeResult = await dbConnect_1.db.select().from(schema_1.stores).where((0, drizzle_orm_1.eq)(schema_1.stores.id, parsedStoreId)).limit(1);
        if (storeResult.length === 0) {
            return res.status(404).json({ message: 'Store not found' });
        }
        const updateData = {};
        if (req.file) {
            try {
                updateData.image = await (0, cloudinaryUpload_1.uploadStoreImage)(req.file.buffer);
            }
            catch (uploadError) {
                console.error('Cloudinary upload failed:', uploadError);
                return res.status(500).json({
                    message: 'Failed to upload store image',
                    error: uploadError.message,
                });
            }
        }
        else if (typeof image === 'string' && image.length > 0) {
            updateData.image = image;
        }
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
        await dbConnect_1.db.update(schema_1.stores).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.stores.id, parsedStoreId));
        const updatedStoreResult = await dbConnect_1.db.select().from(schema_1.stores).where((0, drizzle_orm_1.eq)(schema_1.stores.id, parsedStoreId)).limit(1);
        res.status(200).json({ message: 'Store updated successfully', store: updatedStoreResult[0] });
        console.log('Store updated successfully');
    }
    catch (error) {
        console.error('Error updating store:', error);
        res.status(500).json({ message: 'Failed to update store', error: error.message });
    }
};
exports.updateStore = updateStore;
