"use strict";
//where Router will live
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const storeControls_1 = require("../controller/store/storeControls");
const upload_1 = require("../middleware/upload");
const Role_Staff_1 = require("../controller/store/Role&Staff");
const StoreAnalytics_1 = require("../controller/store/StoreAnalytics");
const Region_Tax_1 = require("../controller/store/Region&Tax");
const router = express_1.default.Router();
router.post("/createStore", upload_1.withImageUpload, storeControls_1.createStore);
router.get("/:id", storeControls_1.getStore);
router.put("/:id", upload_1.withImageUpload, storeControls_1.updateStore);
router.post("/staff", Role_Staff_1.CreateRole);
router.get("/staff/:storeId", Role_Staff_1.getRolesByStoreId);
router.put("/staff/:id", Role_Staff_1.UpdateStaff);
router.delete("/staff/:id", Role_Staff_1.DeleteStaff);
router.post("/analytics", StoreAnalytics_1.AnalyticData);
router.get("/analytics/:storeId", StoreAnalytics_1.fetchAnalyticData);
router.post("/region", Region_Tax_1.Regiontax);
router.get("/region/:storeId", Region_Tax_1.fetchRegionTax);
router.put("/region/:id", Region_Tax_1.updateRegionTax);
exports.default = router;
