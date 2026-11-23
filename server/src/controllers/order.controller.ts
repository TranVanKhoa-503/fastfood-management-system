import { Request, Response } from 'express';
import { OrderService } from '../services/order.service.js';
import { OrderStatus } from '../models/Order.js';

export class OrderController {
  static async getOrders(req: Request, res: Response) {
    try {
      const { search, status, storeId, startDate, endDate, page, limit, sortBy, sortOrder } =
        req.query;
      const result = await OrderService.listOrders({
        search: search as string,
        status: status as string,
        storeId: storeId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(error?.name === 'MongoServerError' ? 500 : 400).json({ success: false, message: error.message });
    }
  }

  static async getOrderById(req: Request, res: Response) {
    try {
      const order = await OrderService.getOrderById(req.params.id);
      res.json({ success: true, data: order });
    } catch (error: any) {
      const invalidId = error.message === 'Invalid order ID';
      res.status(invalidId ? 400 : 404).json({ success: false, message: error.message });
    }
  }

  static async createOrder(req: Request, res: Response) {
    try {
      const order = await OrderService.createOrder(req.body);
      res.status(201).json({ success: true, data: order });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async updateStatus(req: Request, res: Response) {
    try {
      const { status } = req.body;
      if (typeof status !== 'string' || !status) {
        return res.status(400).json({ success: false, message: 'Status is required' });
      }
      const validStatuses: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status as OrderStatus)) {
        return res.status(400).json({ success: false, message: 'Invalid order status' });
      }
      const order = await OrderService.updateStatus(req.params.id, status as OrderStatus);
      res.json({ success: true, data: order });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async assignShipper(req: Request, res: Response) {
    try {
      const { shipperId } = req.body;
      if (!shipperId) {
        return res.status(400).json({ success: false, message: 'ShipperId is required' });
      }
      const order = await OrderService.assignShipper(req.params.id, shipperId);
      res.json({ success: true, data: order });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async exportCSV(req: Request, res: Response) {
    try {
      const { search, status, storeId, startDate, endDate } = req.query;
      const csv = await OrderService.exportOrdersToCSV({
        search: search as string,
        status: status as string,
        storeId: storeId as string,
        startDate: startDate as string,
        endDate: endDate as string,
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="orders-${Date.now()}.csv"`);
      res.status(200).send('\uFEFF' + csv);
    } catch (error: any) {
      res.status(error?.name === 'MongoServerError' ? 500 : 400).json({ success: false, message: error.message });
    }
  }
}
