import express from 'express';
import {
  addCustomer,
  exportCustomers,
  getAllCustomers,
  getCustomerById,
  importCustomers,
  updateCustomer,
} from '../controller/customers/customerControls';
import { withCustomerImportUpload } from '../middleware/upload';

const router = express.Router();

router.post('/add', addCustomer);
router.post('/import', importCustomers);
router.post('/import/upload', withCustomerImportUpload, importCustomers);
router.get('/store/:storeId/export', exportCustomers);
router.get('/store/:storeId', getAllCustomers);
router.get('/:id', getCustomerById);
router.put('/:id', updateCustomer);

export default router;
