import express from 'express';
import {
  addProduct,
  bulkUploadProducts,
  getProduct,
  getProductsByStore,
  updateProduct,
} from '../controller/product/productController';
import { withBulkDataUpload } from '../middleware/upload';

const router = express.Router();

router.post('/add', addProduct);
router.post('/bulk', bulkUploadProducts);
router.post('/bulk/upload', withBulkDataUpload, bulkUploadProducts);
router.get('/store/:storeId', getProductsByStore);
router.get('/:id', getProduct);
router.put('/:id', updateProduct);

export default router;
