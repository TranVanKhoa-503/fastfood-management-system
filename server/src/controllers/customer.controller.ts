import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Customer } from '../models/Customer.js';
import { Order } from '../models/Order.js';
import { escapeRegex, parsePagination } from '../utils/query.js';

export class CustomerController {
  static async getCustomers(req: Request, res: Response) {
    try {
      const { search, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

      const query: Record<string, any> = {};
      if (search && (search as string).trim()) {
        const term = (search as string).trim();
        if (term.length > 100) return res.status(400).json({ success: false, message: 'Search text must be 100 characters or fewer' });
        const regex = new RegExp(escapeRegex(term), 'i');
        query.$or = [{ name: regex }, { email: regex }, { phone: regex }, { address: regex }];
      }

      const { page: p, limit: l, skip } = parsePagination(page as string | undefined, limit as string | undefined);
      const allowedSortFields = ['createdAt', 'name', 'email', 'totalSpent', 'orderCount'];
      const requestedSort = String(sortBy || 'createdAt');
      const safeSortBy = allowedSortFields.includes(requestedSort) ? requestedSort : 'createdAt';
      if (sortOrder && !['asc', 'desc'].includes(String(sortOrder))) {
        return res.status(400).json({ success: false, message: 'Sort order must be asc or desc' });
      }
      const sort: Record<string, 1 | -1> = { [safeSortBy]: sortOrder === 'asc' ? 1 : -1 };

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
      if (![name, email, phone, address].every((value) => typeof value === 'string' && value.trim())) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
      }

      const normalizedEmail = String(email).trim().toLowerCase();
      const existing = await Customer.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Email already exists' });
      }

      const customer = new Customer({
        name: String(name).trim(),
        email: normalizedEmail,
        phone: String(phone).trim(),
        address: String(address).trim(),
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
      const update: Record<string, string> = {};
      if (name !== undefined) update.name = String(name).trim();
      if (email !== undefined) update.email = String(email).trim().toLowerCase();
      if (phone !== undefined) update.phone = String(phone).trim();
      if (address !== undefined) update.address = String(address).trim();
      if (Object.values(update).some((value) => !value)) {
        return res.status(400).json({ success: false, message: 'Customer fields cannot be blank' });
      }
      const customer = await Customer.findByIdAndUpdate(
        id,
        update,
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

      const existingOrders = await Order.exists({ customerId: id });
      if (existingOrders) {
        return res.status(409).json({ success: false, message: 'Customer has order history and cannot be deleted' });
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
