import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service.js';

export class AnalyticsController {
  static async getOverview(req: Request, res: Response) {
    try {
      const { startDate, endDate, storeId } = req.query;
      const summary = await AnalyticsService.getSummary({
        startDate: startDate as string,
        endDate: endDate as string,
        storeId: storeId as string,
      });
      res.json({ success: true, data: summary });
    } catch (error: any) {
      res.status(error?.name === 'MongoServerError' ? 500 : 400).json({ success: false, message: error.message });
    }
  }

  static async getDailyRevenue(req: Request, res: Response) {
    try {
      const { days = '30', storeId } = req.query;
      const data = await AnalyticsService.getDailyRevenue(
        Number(days),
        storeId as string
      );
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(error?.name === 'MongoServerError' ? 500 : 400).json({ success: false, message: error.message });
    }
  }

  static async getStoreRevenue(_req: Request, res: Response) {
    try {
      const data = await AnalyticsService.getStoreRevenue();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(error?.name === 'MongoServerError' ? 500 : 400).json({ success: false, message: error.message });
    }
  }

  static async getCategoryRevenue(_req: Request, res: Response) {
    try {
      const data = await AnalyticsService.getCategoryRevenue();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getCustomerGrowth(req: Request, res: Response) {
    try {
      const { days = '30' } = req.query;
      const data = await AnalyticsService.getCustomerGrowth(Number(days));
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(error?.name === 'MongoServerError' ? 500 : 400).json({ success: false, message: error.message });
    }
  }

  static async getOrderStatusBreakdown(req: Request, res: Response) {
    try {
      const { storeId } = req.query;
      const data = await AnalyticsService.getOrderStatusBreakdown(storeId as string);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(error?.name === 'MongoServerError' ? 500 : 400).json({ success: false, message: error.message });
    }
  }

  static async getTopItems(req: Request, res: Response) {
    try {
      const { limit = '8' } = req.query;
      const data = await AnalyticsService.getTopItems(Number(limit));
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(error?.name === 'MongoServerError' ? 500 : 400).json({ success: false, message: error.message });
    }
  }

  static async getTopCustomers(req: Request, res: Response) {
    try {
      const { limit = '10' } = req.query;
      const data = await AnalyticsService.getTopCustomers(Number(limit));
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(error?.name === 'MongoServerError' ? 500 : 400).json({ success: false, message: error.message });
    }
  }
}
