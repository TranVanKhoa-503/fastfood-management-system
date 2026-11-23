import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Shipper } from '../models/Shipper.js';
import { Order } from '../models/Order.js';
import { Store } from '../models/Store.js';
import { escapeRegex } from '../utils/query.js';

export class ShipperController {
  static async getShippers(req: Request, res: Response) {
    try {
      const { search, status, storeId } = req.query;
      const query: Record<string, any> = {};

      if (status && status !== 'all') {
        if (!['available', 'busy', 'offline'].includes(String(status))) {
          return res.status(400).json({ success: false, message: 'Invalid shipper status filter' });
        }
        query.status = status;
      }

      if (storeId && storeId !== 'all') {
        if (!mongoose.isValidObjectId(storeId)) return res.status(400).json({ success: false, message: 'Invalid store ID filter' });
        query.storeId = new mongoose.Types.ObjectId(storeId as string);
      }

      if (search && (search as string).trim()) {
        const term = (search as string).trim();
        if (term.length > 100) return res.status(400).json({ success: false, message: 'Search text must be 100 characters or fewer' });
        const regex = new RegExp(escapeRegex(term), 'i');
        query.$or = [{ fullName: regex }, { phone: regex }, { licensePlate: regex }];
      }

      const shippers = await Shipper.find(query).populate('storeId', 'name address').sort({ createdAt: -1 });

      // Count active deliveries for each shipper
      const activeDeliveryCounts = await Order.aggregate([
        {
          $match: {
            status: { $nin: ['delivered', 'cancelled'] },
            shipperId: { $ne: null },
          },
        },
        {
          $group: {
            _id: '$shipperId',
            activeOrders: { $sum: 1 },
          },
        },
      ]);

      const activeMap = new Map();
      activeDeliveryCounts.forEach((a) => {
        if (a._id) activeMap.set(a._id.toString(), a.activeOrders);
      });

      const enrichedShippers = shippers.map((shp) => ({
        ...shp.toObject(),
        activeOrdersCount: activeMap.get(shp._id.toString()) || 0,
      }));

      res.json({ success: true, data: enrichedShippers });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getShipperById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: 'Invalid shipper ID' });
      }

      const shipper = await Shipper.findById(id).populate('storeId', 'name address');
      if (!shipper) {
        return res.status(404).json({ success: false, message: 'Shipper not found' });
      }

      const activeOrders = await Order.find({
        shipperId: id,
        status: { $nin: ['delivered', 'cancelled'] },
      }).populate('storeId', 'name').populate('customerId', 'name phone');

      res.json({
        success: true,
        data: {
          ...shipper.toObject(),
          activeOrders,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async createShipper(req: Request, res: Response) {
    try {
      const { fullName, phone, vehicle, licensePlate, status, storeId } = req.body;

      if (!fullName || !phone || !licensePlate || !storeId) {
        return res.status(400).json({
          success: false,
          message: 'FullName, phone, licensePlate, and storeId are required',
        });
      }
      if (!mongoose.isValidObjectId(storeId)) return res.status(400).json({ success: false, message: 'Invalid store ID' });
      const store = await Store.findById(storeId);
      if (!store) return res.status(404).json({ success: false, message: 'Store not found' });
      if (status !== undefined && !['available', 'offline'].includes(status)) {
        return res.status(400).json({ success: false, message: 'A new shipper must be available or offline' });
      }

      const shipper = new Shipper({
        fullName,
        phone,
        vehicle: vehicle || 'Motorbike',
        licensePlate,
        status: status || 'available',
        storeId: new mongoose.Types.ObjectId(storeId),
      });

      await shipper.save();
      const populated = await Shipper.findById(shipper._id).populate('storeId', 'name');
      res.status(201).json({ success: true, data: populated });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async updateShipper(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: 'Invalid shipper ID' });
      }

      const { fullName, phone, vehicle, licensePlate, status, storeId } = req.body;
      const updateData: Record<string, any> = {};
      const current = await Shipper.findById(id);
      if (!current) return res.status(404).json({ success: false, message: 'Shipper not found' });
      const [activeOrders, assignedOrderHistory] = await Promise.all([
        Order.countDocuments({ shipperId: id, status: { $nin: ['delivered', 'cancelled'] } }),
        Order.exists({ shipperId: id }),
      ]);

      if (fullName !== undefined) updateData.fullName = fullName;
      if (phone !== undefined) updateData.phone = phone;
      if (vehicle !== undefined) updateData.vehicle = vehicle;
      if (licensePlate !== undefined) updateData.licensePlate = licensePlate;
      if (storeId !== undefined && !mongoose.isValidObjectId(storeId)) return res.status(400).json({ success: false, message: 'Invalid store ID' });
      if (storeId && mongoose.isValidObjectId(storeId)) {
        const newStore = await Store.findById(storeId);
        if (!newStore) return res.status(404).json({ success: false, message: 'Store not found' });
        if (assignedOrderHistory && current.storeId.toString() !== String(storeId)) {
          return res.status(409).json({ success: false, message: 'Shipper with order history cannot change stores' });
        }
        updateData.storeId = new mongoose.Types.ObjectId(storeId);
      }
      if (status !== undefined) {
        if (!['available', 'busy', 'offline'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid shipper status' });
        if (activeOrders > 0 && status !== 'busy') return res.status(409).json({ success: false, message: 'Shipper status is busy while active orders are assigned' });
        if (activeOrders === 0 && status === 'busy') return res.status(409).json({ success: false, message: 'Busy status is managed by active order assignments' });
        updateData.status = status;
      }

      const shipper = await Shipper.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      }).populate('storeId', 'name');

      if (!shipper) {
        return res.status(404).json({ success: false, message: 'Shipper not found' });
      }

      res.json({ success: true, data: shipper });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async deleteShipper(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: 'Invalid shipper ID' });
      }

      const assignedOrders = await Order.exists({ shipperId: id });
      if (assignedOrders) {
        return res.status(409).json({ success: false, message: 'Shipper is referenced by order history and cannot be deleted' });
      }
      const shipper = await Shipper.findByIdAndDelete(id);
      if (!shipper) {
        return res.status(404).json({ success: false, message: 'Shipper not found' });
      }

      res.json({ success: true, message: 'Shipper deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
