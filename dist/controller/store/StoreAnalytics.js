"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAnalyticData = exports.AnalyticData = void 0;
const dbConnect_1 = require("../../config/dbConnect");
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const AnalyticData = async (req, res) => {
    try {
        const { storeId, totalSales, orders, visitors, activeProducts } = req.body;
        const parsedStoreId = typeof storeId === 'number' ? storeId : parseInt(String(storeId ?? ''), 10);
        if (!storeId || isNaN(parsedStoreId)) {
            return res.status(400).json({ message: 'Valid store Id is required' });
        }
        if (!totalSales) {
            res.status(400).json({
                message: " error !, no total sales found"
            });
        }
        if (!orders) {
            res.status(400).json({
                message: " error !,  no orders found"
            });
        }
        if (!visitors) {
            res.status(400).json({
                message: " error !,  no  visitors found"
            });
        }
        const storeResult = await dbConnect_1.db
            .select()
            .from(schema_1.stores)
            .where((0, drizzle_orm_1.eq)(schema_1.stores.id, parsedStoreId))
            .limit(1);
        if (storeResult.length === 0) {
            return res.status(404).json({ message: 'Store not found' });
        }
        const [Analytic] = await dbConnect_1.db.insert(schema_1.StoreAnylytics).values({
            storeId: parsedStoreId, totalSales, orders, visitors, activeProducts
        }).returning();
        res.status(201).json({ message: "Data has been Added!" });
    }
    catch (err) {
        console.error("Error as occurrd", err);
        res.status(500).json({
            message: "An error as Occurred ", err
        });
    }
};
exports.AnalyticData = AnalyticData;
const fetchAnalyticData = async (req, res) => {
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
        const analytics = await dbConnect_1.db
            .select()
            .from(schema_1.StoreAnylytics)
            .where((0, drizzle_orm_1.eq)(schema_1.StoreAnylytics.storeId, parsedStoreId));
        if (analytics.length === 0) {
            return res.status(404).json({ message: 'Analytics data not found' });
        }
        return res.status(200).json({
            message: 'Data fetched successfully',
            data: analytics,
        });
    }
    catch (error) {
        console.error('an error occurred', error);
        return res.status(500).json({ message: 'An error occurred' });
    }
};
exports.fetchAnalyticData = fetchAnalyticData;
