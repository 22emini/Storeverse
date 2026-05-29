import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const imageFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: imageFilter,
});

/** @deprecated use imageUpload — kept for store routes */
export const uploadStoreImage = imageUpload;

const jsonFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowed = ['application/json', 'text/json', 'text/plain'];
  if (allowed.includes(file.mimetype) || file.originalname.endsWith('.json')) {
    cb(null, true);
  } else {
    cb(new Error('Only JSON files are allowed for bulk upload'));
  }
};

export const bulkDataUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: jsonFilter,
});

export const withBulkDataUpload = (req: Request, res: Response, next: NextFunction) => {
  bulkDataUpload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
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

const CUSTOMER_IMPORT_EXTENSIONS = ['.json', '.csv', '.xlsx', '.xls', '.pdf'];
const CUSTOMER_IMPORT_MIMES = [
  'application/json',
  'text/json',
  'text/csv',
  'text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/pdf',
];

const customerImportFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const name = file.originalname.toLowerCase();
  const mime = file.mimetype.toLowerCase();
  const extOk = CUSTOMER_IMPORT_EXTENSIONS.some((ext) => name.endsWith(ext));
  const mimeOk =
    CUSTOMER_IMPORT_MIMES.includes(file.mimetype) ||
    mime.includes('json') ||
    mime.includes('csv') ||
    mime.includes('spreadsheet') ||
    mime.includes('excel') ||
    mime === 'application/pdf' ||
    mime === 'text/plain';

  if (extOk || mimeOk) {
    cb(null, true);
  } else {
    cb(new Error('Customer import accepts JSON, CSV, Excel (.xlsx/.xls), or PDF only'));
  }
};

export const customerImportUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: customerImportFilter,
});

export const withCustomerImportUpload = (req: Request, res: Response, next: NextFunction) => {
  customerImportUpload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Import file must be 10 MB or smaller' });
      }
      return res.status(400).json({ message: err.message });
    }
    if (err instanceof Error) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

export const withImageUpload = (req: Request, res: Response, next: NextFunction) => {
  imageUpload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
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
