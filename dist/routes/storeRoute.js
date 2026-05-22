"use strict";
//where Router will live
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const storeControls_1 = require("../controller/storeControls");
const upload_1 = require("../middleware/upload");
const router = express_1.default.Router();
const withImageUpload = (req, res, next) => {
    upload_1.uploadStoreImage.single('image')(req, res, (err) => {
        if (err instanceof multer_1.default.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'Image must be 5 MB or smaller' });
            }
            return res.status(400).json({ message: err.message });
        }
        if (err instanceof Error) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
};
router.post("/createStore", withImageUpload, storeControls_1.createStore);
router.get("/:id", storeControls_1.getStore);
router.put("/:id", withImageUpload, storeControls_1.updateStore);
exports.default = router;
