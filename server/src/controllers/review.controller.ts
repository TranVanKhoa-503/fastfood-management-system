import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Review } from '../models/Review.js';
import { Order } from '../models/Order.js';
import { parsePagination } from '../utils/query.js';

export class ReviewController {
  static async getReviews(req: Request, res: Response) {
    try {
      const { rating, storeId, page = 1, limit = 20 } = req.query;
      const query: Record<string, any> = {};

      if (rating && rating !== 'all') {
        const parsedRating = Number(rating);
        if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
          return res.status(400).json({ success: false, message: 'Rating filter must be a whole number from 1 to 5' });
        }
        query.rating = parsedRating;
      }

      if (storeId && storeId !== 'all') {
        if (!mongoose.isValidObjectId(storeId)) return res.status(400).json({ success: false, message: 'Invalid store ID filter' });
        query.storeId = new mongoose.Types.ObjectId(storeId as string);
      }

      const { page: p, limit: l, skip } = parsePagination(page as string, limit as string, 20);
      const storeStatsMatch = storeId && storeId !== 'all' ? { $match: { storeId: query.storeId } } : null;
      const storeStatsPipeline = storeStatsMatch ? [storeStatsMatch] : [];

      const [reviews, total, storeAverages] = await Promise.all([
        Review.find(query)
          .populate('customerId', 'name email phone')
          .populate('storeId', 'name address')
          .populate({
            path: 'orderId',
            select: 'items totalAmount createdAt',
          })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(l),
        Review.countDocuments(query),
        Review.aggregate([
          ...storeStatsPipeline,
          {
            $group: {
              _id: '$storeId',
              avgRating: { $avg: '$rating' },
              totalReviews: { $sum: 1 },
            },
          },
          {
            $lookup: {
              from: 'stores',
              localField: '_id',
              foreignField: '_id',
              as: 'store',
            },
          },
          { $unwind: { path: '$store', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 1,
              storeId: '$_id',
              storeName: { $ifNull: ['$store.name', 'Unknown Store'] },
              avgRating: { $round: ['$avgRating', 1] },
              totalReviews: 1,
            },
          },
          { $sort: { avgRating: -1 } },
        ]),
      ]);

      // Rating breakdown for filter bar
      const ratingBreakdown = await Review.aggregate([
        ...storeStatsPipeline,
        {
          $group: {
            _id: '$rating',
            count: { $sum: 1 },
          },
        },
      ]);

      res.json({
        success: true,
        data: {
          reviews,
          storeAverages,
          ratingBreakdown,
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

  static async createReview(req: Request, res: Response) {
    try {
      const { orderId, customerId, storeId, rating, comment } = req.body;

      if (!orderId || !customerId || !storeId || !rating) {
        return res.status(400).json({
          success: false,
          message: 'orderId, customerId, storeId, and rating are required',
        });
      }
      const parsedRating = Number(rating);
      if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({ success: false, message: 'Rating must be a whole number from 1 to 5' });
      }
      if (comment !== undefined && (typeof comment !== 'string' || comment.length > 1000)) {
        return res.status(400).json({ success: false, message: 'Comment must be text with at most 1000 characters' });
      }

      if (!mongoose.isValidObjectId(orderId) || !mongoose.isValidObjectId(customerId) || !mongoose.isValidObjectId(storeId)) {
        return res.status(400).json({ success: false, message: 'Order, customer, or store ID is invalid' });
      }

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      if (order.status !== 'delivered') {
        return res.status(400).json({ success: false, message: 'Only delivered orders can receive a review' });
      }
      if (order.customerId.toString() !== String(customerId) || order.storeId.toString() !== String(storeId)) {
        return res.status(400).json({ success: false, message: 'Review customer and store must match the order' });
      }

      const existing = await Review.findOne({ orderId });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Review for this order already exists',
        });
      }

      const review = new Review({
        orderId: new mongoose.Types.ObjectId(orderId),
        customerId: new mongoose.Types.ObjectId(customerId),
        storeId: new mongoose.Types.ObjectId(storeId),
        rating: parsedRating,
        comment: comment || '',
      });

      await review.save();
      const populated = await Review.findById(review._id)
        .populate('customerId', 'name')
        .populate('storeId', 'name')
        .populate('orderId');

      res.status(201).json({ success: true, data: populated });
    } catch (error: any) {
      const isDuplicate = error?.code === 11000;
      res.status(isDuplicate ? 409 : 400).json({ success: false, message: isDuplicate ? 'Review for this order already exists' : error.message });
    }
  }

  static async deleteReview(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: 'Invalid review ID' });
      }

      const review = await Review.findByIdAndDelete(id);
      if (!review) {
        return res.status(404).json({ success: false, message: 'Review not found' });
      }

      res.json({ success: true, message: 'Review deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
