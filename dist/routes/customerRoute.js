"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const customerControls_1 = require("../controller/customers/customerControls");
const upload_1 = require("../middleware/upload");
const router = express_1.default.Router();
router.post('/add', customerControls_1.addCustomer);
router.post('/import', customerControls_1.importCustomers);
router.post('/import/upload', upload_1.withCustomerImportUpload, customerControls_1.importCustomers);
router.get('/store/:storeId/export', customerControls_1.exportCustomers);
router.get('/store/:storeId', customerControls_1.getAllCustomers);
router.get('/:id', customerControls_1.getCustomerById);
router.put('/:id', customerControls_1.updateCustomer);
exports.default = router;
