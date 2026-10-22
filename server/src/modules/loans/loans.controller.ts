import { Request, Response, NextFunction } from 'express';
import { LoansService } from './loans.service';

export class LoansController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const loan = await LoansService.createLoan(req.user!.id, req.body);
      return res.status(201).json({
        success: true,
        message: 'Loan created successfully',
        data: { loan },
      });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as any;
      const search = req.query.search as string;
      const loans = await LoansService.listLoans(req.user!.id, { status, search });
      return res.status(200).json({
        success: true,
        data: {
          loans,
          count: loans.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const loan = await LoansService.getLoanById(req.user!.id, req.params.id);
      return res.status(200).json({
        success: true,
        data: { loan },
      });
    } catch (error) {
      next(error);
    }
  }

  static async repay(req: Request, res: Response, next: NextFunction) {
    try {
      const loan = await LoansService.recordRepayment(
        req.user!.id,
        req.params.id,
        req.body
      );
      return res.status(200).json({
        success: true,
        message: 'Repayment recorded successfully',
        data: { loan },
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const loan = await LoansService.updateLoan(
        req.user!.id,
        req.params.id,
        req.body
      );
      return res.status(200).json({
        success: true,
        message: 'Loan updated successfully',
        data: { loan },
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await LoansService.deleteLoan(req.user!.id, req.params.id);
      return res.status(200).json({
        success: true,
        message: 'Loan deleted successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
