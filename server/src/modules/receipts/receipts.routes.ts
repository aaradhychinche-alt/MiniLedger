import { Router } from 'express';
import { ReceiptsController } from './receipts.controller';
import { receiptUpload } from './receipts.service';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Upload receipt - protected
router.post(
  '/upload',
  authenticate,
  receiptUpload.single('receipt'),
  ReceiptsController.upload
);

export const receiptsRoutes = router;
