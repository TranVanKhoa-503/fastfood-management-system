import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Review } from '../models/Review.js';

export class ReviewController {
  static async getReviews(req: Request, res: Response) {
    try {
      const { rating, storeId, page = 1, limit = 20 } = req.query;
      const query: Record<string, any> = {};

      if (rating && rating !== 'all') {
        query.rating = Number(rating);
      }

      if (storeId && storeId !== 'all' && mongoose.isValidObjectId(storeId)) {
        query.storeId = new mongoose.Types.ObjectId(storeId as string);
      }

      const p = parseInt(page as string, 10);
      const l = parseInt(limit as string, 10);
      const skip = (p - 1) * l;

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
        rating: Number(rating),
        comment: comment || '',
      });

      await review.save();
      const populated = await Review.findById(review._id)
        .populate('customerId', 'name')
        .populate('storeId', 'name')
        .populate('orderId');

      res.status(201).json({ success: true, data: populated });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
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
