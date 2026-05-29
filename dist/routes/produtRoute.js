"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const productController_1 = require("../controller/product/productController");
const upload_1 = require("../middleware/upload");
const router = express_1.default.Router();
router.post('/add', productController_1.addProduct);
router.post('/bulk', productController_1.bulkUploadProducts);
router.post('/bulk/upload', upload_1.withBulkDataUpload, productController_1.bulkUploadProducts);
router.get('/store/:storeId', productController_1.getProductsByStore);
router.get('/:id', productController_1.getProduct);
router.put('/:id', productController_1.updateProduct);
exports.default = router;
