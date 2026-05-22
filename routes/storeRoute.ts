//where Router will live
import express, { Request, Response, NextFunction } from "express";
import multer from "multer";
import { createStore, getStore, updateStore } from "../controller/storeControls";
import { uploadStoreImage } from "../middleware/upload";

const router = express.Router();

const withImageUpload = (req: Request, res: Response, next: NextFunction) => {
  uploadStoreImage.single('image')(req, res, (err) => {
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

router.post("/createStore", withImageUpload, createStore);
router.get("/:id", getStore);
router.put("/:id", withImageUpload, updateStore);

export default router;
