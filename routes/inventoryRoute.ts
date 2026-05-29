import express from 'express';
import {
  addInventoryItem,
  adjustStock,
  createWarehouse,
  getInventoryByStore,
  getInventorySummary,
  getWarehousesByStore,
} from '../controller/inventory/inventoryControl';

const router = express.Router();

router.post('/warehouse', createWarehouse);
router.get('/warehouse/:storeId', getWarehousesByStore);
router.post('/', addInventoryItem);
router.get('/store/:storeId/summary', getInventorySummary);
router.get('/store/:storeId', getInventoryByStore);
router.patch('/:id/adjust', adjustStock);

export default router;
