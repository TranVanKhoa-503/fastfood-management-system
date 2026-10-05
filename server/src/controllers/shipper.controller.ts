import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Shipper } from '../models/Shipper.js';
import { Order } from '../models/Order.js';

export class ShipperController {
  static async getShippers(req: Request, res: Response) {
    try {
      const { search, status, storeId } = req.query;
      const query: Record<string, any> = {};

      if (status && status !== 'all') {
        query.status = status;
      }

      if (storeId && storeId !== 'all' && mongoose.isValidObjectId(storeId)) {
        query.storeId = new mongoose.Types.ObjectId(storeId as string);
      }

      if (search && (search as string).trim()) {
        const regex = new RegExp((search as string).trim(), 'i');
        query.$or = [{ fullName: regex }, { phone: regex }, { licensePlate: regex }];
      }

      const shippers = await Shipper.find(query).populate('storeId', 'name address').sort({ createdAt: -1 });

      // Count active deliveries for each shipper
      const activeDeliveryCounts = await Order.aggregate([
        {
          $match: {
            status: { $in: ['ready', 'out_for_delivery', 'preparing'] },
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
        status: { $in: ['ready', 'out_for_delivery'] },
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

      if (fullName) updateData.fullName = fullName;
      if (phone) updateData.phone = phone;
      if (vehicle) updateData.vehicle = vehicle;
      if (licensePlate) updateData.licensePlate = licensePlate;
      if (status) updateData.status = status;
      if (storeId && mongoose.isValidObjectId(storeId)) {
        updateData.storeId = new mongoose.Types.ObjectId(storeId);
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
