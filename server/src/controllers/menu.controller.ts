import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { MenuItem } from '../models/MenuItem.js';

export class MenuController {
  static async getMenuItems(req: Request, res: Response) {
    try {
      const { category, search, isAvailable } = req.query;
      const query: Record<string, any> = {};

      if (category && category !== 'all') {
        query.category = category;
      }

      if (isAvailable !== undefined && isAvailable !== 'all') {
        query.isAvailable = isAvailable === 'true';
      }

      if (search && (search as string).trim()) {
        const regex = new RegExp((search as string).trim(), 'i');
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

      if (!name || !category || price === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Name, category, and price are required',
        });
      }

      const item = new MenuItem({
        name,
        category,
        price: Number(price),
        description: description || '',
        image: image || '',
        isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
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

      const item = await MenuItem.findByIdAndUpdate(id, req.body, {
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
