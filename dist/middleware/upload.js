"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withImageUpload = exports.withBulkDataUpload = exports.bulkDataUpload = exports.uploadStoreImage = exports.imageUpload = void 0;
const multer_1 = __importDefault(require("multer"));
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const imageFilter = (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        cb(new Error('Only image files are allowed'));
    }
};
exports.imageUpload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: imageFilter,
});
/** @deprecated use imageUpload — kept for store routes */
exports.uploadStoreImage = exports.imageUpload;
const jsonFilter = (_req, file, cb) => {
    const allowed = ['application/json', 'text/json', 'text/plain'];
    if (allowed.includes(file.mimetype) || file.originalname.endsWith('.json')) {
        cb(null, true);
    }
    else {
        cb(new Error('Only JSON files are allowed for bulk upload'));
    }
};
exports.bulkDataUpload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
    fileFilter: jsonFilter,
});
const withBulkDataUpload = (req, res, next) => {
    exports.bulkDataUpload.single('file')(req, res, (err) => {
        if (err instanceof multer_1.default.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'Bulk data file must be 2 MB or smaller' });
            }
            return res.status(400).json({ message: err.message });
        }
        if (err instanceof Error) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
};
exports.withBulkDataUpload = withBulkDataUpload;
const withImageUpload = (req, res, next) => {
    exports.imageUpload.single('image')(req, res, (err) => {
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
exports.withImageUpload = withImageUpload;
