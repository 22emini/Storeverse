"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const inventoryControl_1 = require("../controller/inventory/inventoryControl");
const router = express_1.default.Router();
router.post('/warehouse', inventoryControl_1.createWarehouse);
router.get('/warehouse/:storeId', inventoryControl_1.getWarehousesByStore);
router.post('/', inventoryControl_1.addInventoryItem);
router.get('/store/:storeId/summary', inventoryControl_1.getInventorySummary);
router.get('/store/:storeId', inventoryControl_1.getInventoryByStore);
router.patch('/:id/adjust', inventoryControl_1.adjustStock);
exports.default = router;
