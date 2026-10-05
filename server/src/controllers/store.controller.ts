import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Store } from '../models/Store.js';
import { Order } from '../models/Order.js';

export class StoreController {
  static async getStores(req: Request, res: Response) {
    try {
      const { search, status } = req.query;
      const query: Record<string, any> = {};

      if (status && status !== 'all') {
        query.status = status;
      }

      if (search && (search as string).trim()) {
        const regex = new RegExp((search as string).trim(), 'i');
        query.$or = [{ name: regex }, { address: regex }, { phone: regex }];
      }

      const stores = await Store.find(query).sort({ createdAt: -1 });

      // Aggregate revenue & active orders for each store
      const storeStats = await Order.aggregate([
        {
          $group: {
            _id: '$storeId',
            totalRevenue: {
              $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, '$totalAmount', 0] },
            },
            totalOrders: { $sum: 1 },
            activeOrders: {
              $sum: {
                $cond: [
                  { $in: ['$status', ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery']] },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]);

      const statsMap = new Map();
      storeStats.forEach((s) => {
        if (s._id) statsMap.set(s._id.toString(), s);
      });

      const storesWithStats = stores.map((st) => {
        const stats = statsMap.get(st._id.toString()) || {
          totalRevenue: 0,
          totalOrders: 0,
          activeOrders: 0,
        };
        return {
          ...st.toObject(),
          totalRevenue: stats.totalRevenue,
          totalOrders: stats.totalOrders,
          activeOrders: stats.activeOrders,
        };
      });

      res.json({ success: true, data: storesWithStats });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getStoreById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: 'Invalid store ID' });
      }

      const store = await Store.findById(id);
      if (!store) {
        return res.status(404).json({ success: false, message: 'Store not found' });
      }

      // Compute revenue stats
      const stats = await Order.aggregate([
        { $match: { storeId: new mongoose.Types.ObjectId(id) } },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, '$totalAmount', 0] },
            },
            totalOrders: { $sum: 1 },
            deliveredOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] },
            },
          },
        },
      ]);

      res.json({
        success: true,
        data: {
          ...store.toObject(),
          stats: stats[0] || { totalRevenue: 0, totalOrders: 0, deliveredOrders: 0 },
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async createStore(req: Request, res: Response) {
    try {
      const { name, address, phone, location, openHours, status } = req.body;

      if (!name || !address || !phone) {
        return res.status(400).json({ success: false, message: 'Name, address, and phone are required' });
      }

      const coordinates: [number, number] =
        location && Array.isArray(location.coordinates)
          ? [Number(location.coordinates[0]), Number(location.coordinates[1])]
          : [105.8542, 21.0285]; // Default Hanoi [lng, lat]

      const store = new Store({
        name,
        address,
        phone,
        location: {
          type: 'Point',
          coordinates,
        },
        openHours: {
          open: openHours?.open || '08:00',
          close: openHours?.close || '22:00',
        },
        status: status || 'open',
      });

      await store.save();
      res.status(201).json({ success: true, data: store });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async updateStore(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: 'Invalid store ID' });
      }

      const { name, address, phone, location, openHours, status } = req.body;

      const updateData: Record<string, any> = {};
      if (name) updateData.name = name;
      if (address) updateData.address = address;
      if (phone) updateData.phone = phone;
      if (openHours) updateData.openHours = openHours;
      if (status) updateData.status = status;
      if (location && Array.isArray(location.coordinates)) {
        updateData.location = {
          type: 'Point',
          coordinates: [Number(location.coordinates[0]), Number(location.coordinates[1])],
        };
      }

      const store = await Store.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!store) {
        return res.status(404).json({ success: false, message: 'Store not found' });
      }

      res.json({ success: true, data: store });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async deleteStore(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: 'Invalid store ID' });
      }

      const store = await Store.findByIdAndDelete(id);
      if (!store) {
        return res.status(404).json({ success: false, message: 'Store not found' });
      }

      res.json({ success: true, message: 'Store deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
