import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service';

export class DashboardController {
  static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await DashboardService.getSummary(req.user!.id);
      return res.status(200).json({
        success: true,
        data: { summary },
      });
    } catch (error) {
      next(error);
    }
  }
}
