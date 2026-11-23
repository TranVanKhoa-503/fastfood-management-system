import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { MenuItem } from '../models/MenuItem.js';
import { Order } from '../models/Order.js';
import { escapeRegex } from '../utils/query.js';

function parseBoolean(value: unknown, fieldName: string): boolean {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  throw new Error(`${fieldName} must be true or false`);
}

export class MenuController {
  static async getMenuItems(req: Request, res: Response) {
    try {
      const { category, search, isAvailable } = req.query;
      const query: Record<string, any> = {};

      if (category && category !== 'all') {
        query.category = category;
      }

      if (isAvailable !== undefined && isAvailable !== 'all') {
        query.isAvailable = parseBoolean(isAvailable, 'isAvailable');
      }

      if (search && (search as string).trim()) {
        const term = (search as string).trim();
        if (term.length > 100) return res.status(400).json({ success: false, message: 'Search text must be 100 characters or fewer' });
        const regex = new RegExp(escapeRegex(term), 'i');
        query.$or = [{ name: regex }, { description: regex }];
      }

      const items = await MenuItem.find(query).sort({ category: 1, name: 1 });
      res.json({ success: true, data: items });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getMenuItemById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: 'Invalid item ID' });
      }

      const item = await MenuItem.findById(id);
      if (!item) {
        return res.status(404).json({ success: false, message: 'Menu item not found' });
      }

      res.json({ success: true, data: item });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async createMenuItem(req: Request, res: Response) {
    try {
      const { name, category, price, description, image, isAvailable } = req.body;

      if (typeof name !== 'string' || !name.trim() || typeof category !== 'string' || price === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Name, category, and price are required',
        });
      }

      const numericPrice = Number(price);
      if (!Number.isSafeInteger(numericPrice) || numericPrice < 0) {
        return res.status(400).json({ success: false, message: 'Price must be a non-negative whole VND amount' });
      }
      let available = true;
      try {
        if (isAvailable !== undefined) available = parseBoolean(isAvailable, 'isAvailable');
      } catch (error: any) {
        return res.status(400).json({ success: false, message: error.message });
      }
      const item = new MenuItem({
        name: name.trim(),
        category,
        price: numericPrice,
        description: description || '',
        image: image || '',
        isAvailable: available,
      });

      await item.save();
      res.status(201).json({ success: true, data: item });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async updateMenuItem(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: 'Invalid item ID' });
      }

      const { name, category, price, description, image, isAvailable } = req.body;
      const update: Record<string, unknown> = {};
      if (name !== undefined) {
        if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ success: false, message: 'Name cannot be blank' });
        update.name = name.trim();
      }
      if (category !== undefined) {
        const usedInOrders = await Order.exists({ 'items.menuItemId': id });
        const current = await MenuItem.findById(id).select('category');
        if (usedInOrders && current && category !== current.category) {
          return res.status(409).json({ success: false, message: 'Category cannot be changed after the item appears in an order' });
        }
        update.category = category;
      }
      if (price !== undefined) {
        const numericPrice = Number(price);
        if (!Number.isSafeInteger(numericPrice) || numericPrice < 0) return res.status(400).json({ success: false, message: 'Price must be a non-negative whole VND amount' });
        update.price = numericPrice;
      }
      if (description !== undefined) update.description = String(description);
      if (image !== undefined) update.image = String(image);
      if (isAvailable !== undefined) {
        try { update.isAvailable = parseBoolean(isAvailable, 'isAvailable'); }
        catch (error: any) { return res.status(400).json({ success: false, message: error.message }); }
      }

      const item = await MenuItem.findByIdAndUpdate(id, update, {
        new: true,
        runValidators: true,
      });

      if (!item) {
        return res.status(404).json({ success: false, message: 'Menu item not found' });
      }

      res.json({ success: true, data: item });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async deleteMenuItem(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: 'Invalid item ID' });
      }

      const usedInOrders = await Order.exists({ 'items.menuItemId': id });
      if (usedInOrders) {
        return res.status(409).json({ success: false, message: 'Menu item has order history and cannot be deleted' });
      }
      const item = await MenuItem.findByIdAndDelete(id);
      if (!item) {
        return res.status(404).json({ success: false, message: 'Menu item not found' });
      }

      res.json({ success: true, message: 'Menu item deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
