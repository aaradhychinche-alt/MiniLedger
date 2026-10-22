import { Request, Response, NextFunction } from 'express';
import { ReceiptsService } from './receipts.service';
import { AppError } from '../../middleware/errorHandler';

export class ReceiptsController {
  static async upload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError('No receipt image file uploaded', 400);
      }

      const fileUrl = ReceiptsService.formatFileUrl(req.file.filename);

      return res.status(200).json({
        success: true,
        message: 'Receipt uploaded successfully',
        data: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          url: fileUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
