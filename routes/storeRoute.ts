//where Router will live

import express from "express";
import { createStore, getStore, updateStore } from "../controller/store/storeControls";
import { withImageUpload } from "../middleware/upload";
import { CreateRole, getRolesByStoreId,UpdateStaff, DeleteStaff } from "../controller/store/Role&Staff";
import { AnalyticData, fetchAnalyticData } from "../controller/store/StoreAnalytics"
import { Regiontax, fetchRegionTax, updateRegionTax } from "../controller/store/Region&Tax";
const router = express.Router();

router.post("/createStore", withImageUpload, createStore);
router.get("/:id", getStore);
router.put("/:id", withImageUpload, updateStore);
router.post("/staff", CreateRole);
router.get("/staff/:storeId", getRolesByStoreId);
router.put("/staff/:id", UpdateStaff);
router.delete("/staff/:id", DeleteStaff);
router.post("/analytics", AnalyticData);
router.get("/analytics/:storeId", fetchAnalyticData);
router.post("/region", Regiontax);
router.get("/region/:storeId", fetchRegionTax);
router.put("/region/:id", updateRegionTax);



export default router;

