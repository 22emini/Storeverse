import express from 'express';
import {
  addProduct,
  bulkUploadProducts,
  getProduct,
  getProductsByUser,
  updateProduct,
} from '../controller/product/productController';
import { withBulkDataUpload } from '../middleware/upload';

const router = express.Router();

router.post('/add', addProduct);
router.post('/bulk', bulkUploadProducts);
router.post('/bulk/upload', withBulkDataUpload, bulkUploadProducts);
router.get('/user/:userId', getProductsByUser);
router.get('/:id', getProduct);
router.put('/:id', updateProduct);

export default router;
