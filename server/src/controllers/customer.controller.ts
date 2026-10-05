import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Customer } from '../models/Customer.js';
import { Order } from '../models/Order.js';

export class CustomerController {
  static async getCustomers(req: Request, res: Response) {
    try {
      const { search, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

      const query: Record<string, any> = {};
      if (search && (search as string).trim()) {
        const term = (search as string).trim();
        const regex = new RegExp(term, 'i');
        query.$or = [{ name: regex }, { email: regex }, { phone: regex }, { address: regex }];
      }

      const p = parseInt(page as string, 10);
      const l = parseInt(limit as string, 10);
      const skip = (p - 1) * l;
      const sort: Record<string, 1 | -1> = { [sortBy as string]: sortOrder === 'asc' ? 1 : -1 };

      const [customers, total] = await Promise.all([
        Customer.find(query).sort(sort).skip(skip).limit(l),
        Customer.countDocuments(query),
      ]);

      res.json({
        success: true,
        data: {
          customers,
          pagination: {
            page: p,
            limit: l,
            total,
            totalPages: Math.ceil(total / l),
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getCustomerById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: 'Invalid customer ID' });
      }

      const customer = await Customer.findById(id);
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }

      // Fetch customer's order history
      const orders = await Order.find({ customerId: id })
        .populate('storeId', 'name address')
        .populate('shipperId', 'fullName phone')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: {
          customer,
          orders,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async createCustomer(req: Request, res: Response) {
    try {
      const { name, email, phone, address } = req.body;
      if (!name || !email || !phone || !address) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
      }

      const existing = await Customer.findOne({ email });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Email already exists' });
      }

      const customer = new Customer({
        name,
        email,
        phone,
        address,
        totalSpent: 0,
        orderCount: 0,
      });

      await customer.save();
      res.status(201).json({ success: true, data: customer });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async updateCustomer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: 'Invalid customer ID' });
      }

      const { name, email, phone, address } = req.body;
      const customer = await Customer.findByIdAndUpdate(
        id,
        { name, email, phone, address },
        { new: true, runValidators: true }
      );

      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }

      res.json({ success: true, data: customer });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async deleteCustomer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: 'Invalid customer ID' });
      }

      const customer = await Customer.findByIdAndDelete(id);
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }

      res.json({ success: true, message: 'Customer deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
