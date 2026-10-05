import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { Customer } from '../models/Customer.js';
import { Store } from '../models/Store.js';
import { Review } from '../models/Review.js';

export interface DateFilter {
  startDate?: string;
  endDate?: string;
  storeId?: string;
}

export class AnalyticsService {
  /**
   * Get KPI Summary: Total Revenue, Total Orders, Delivered Orders, Total Customers, Active Shippers, Avg Rating
   */
  static async getSummary(filter: DateFilter = {}) {
    const matchStage: Record<string, any> = {};

    if (filter.startDate || filter.endDate) {
      matchStage.createdAt = {};
      if (filter.startDate) matchStage.createdAt.$gte = new Date(filter.startDate);
      if (filter.endDate) {
        const end = new Date(filter.endDate);
        end.setHours(23, 59, 59, 999);
        matchStage.createdAt.$lte = end;
      }
    }

    if (filter.storeId && mongoose.isValidObjectId(filter.storeId)) {
      matchStage.storeId = new mongoose.Types.ObjectId(filter.storeId);
    }

    const [orderStats, customerCount, storeCount, reviewStats] = await Promise.all([
      Order.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: {
                $cond: [{ $eq: ['$status', 'delivered'] }, '$totalAmount', 0],
              },
            },
            totalOrders: { $sum: 1 },
            deliveredOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] },
            },
            cancelledOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
            },
            avgOrderValue: {
              $avg: {
                $cond: [{ $eq: ['$status', 'delivered'] }, '$totalAmount', null],
              },
            },
          },
        },
      ]),
      Customer.countDocuments(),
      Store.countDocuments(),
      Review.aggregate([
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
          },
        },
      ]),
    ]);

    const stats = orderStats[0] || {
      totalRevenue: 0,
      totalOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      avgOrderValue: 0,
    };

    const rev = reviewStats[0] || { avgRating: 0, totalReviews: 0 };

    return {
      totalRevenue: stats.totalRevenue || 0,
      totalOrders: stats.totalOrders || 0,
      deliveredOrders: stats.deliveredOrders || 0,
      cancelledOrders: stats.cancelledOrders || 0,
      avgOrderValue: Math.round(stats.avgOrderValue || 0),
      totalCustomers: customerCount,
      totalStores: storeCount,
      avgRating: Number((rev.avgRating || 0).toFixed(1)),
      totalReviews: rev.totalReviews || 0,
    };
  }

  /**
   * Doanh thu theo ngày (Revenue by Day)
   */
  static async getDailyRevenue(days = 30, storeId?: string) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const matchStage: Record<string, any> = {
      createdAt: { $gte: startDate },
      status: 'delivered',
    };

    if (storeId && mongoose.isValidObjectId(storeId)) {
      matchStage.storeId = new mongoose.Types.ObjectId(storeId);
    }

    return await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          revenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
          subtotal: { $sum: '$subtotal' },
          deliveryFee: { $sum: '$deliveryFee' },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          revenue: 1,
          orderCount: 1,
          subtotal: 1,
          deliveryFee: 1,
        },
      },
    ]);
  }

  /**
   * Doanh thu theo cửa hàng (Revenue by Store)
   */
  static async getStoreRevenue() {
    return await Order.aggregate([
      {
        $group: {
          _id: '$storeId',
          totalRevenue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'delivered'] }, '$totalAmount', 0],
            },
          },
          totalOrders: { $sum: 1 },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: 'stores',
          localField: '_id',
          foreignField: '_id',
          as: 'storeInfo',
        },
      },
      { $unwind: { path: '$storeInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          storeId: '$_id',
          storeName: { $ifNull: ['$storeInfo.name', 'Unknown Store'] },
          storeAddress: { $ifNull: ['$storeInfo.address', ''] },
          status: { $ifNull: ['$storeInfo.status', 'open'] },
          totalRevenue: 1,
          totalOrders: 1,
          deliveredOrders: 1,
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);
  }

  /**
   * Doanh thu theo danh mục (Revenue by Category)
   */
  static async getCategoryRevenue() {
    return await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'menuitems',
          localField: 'items.menuItemId',
          foreignField: '_id',
          as: 'menuItem',
        },
      },
      { $unwind: { path: '$menuItem', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ['$menuItem.category', 'Combos'] },
          revenue: { $sum: { $multiply: ['$items.qty', '$items.price'] } },
          itemsSold: { $sum: '$items.qty' },
        },
      },
      { $sort: { revenue: -1 } },
      {
        $project: {
          _id: 0,
          category: '$_id',
          revenue: 1,
          itemsSold: 1,
        },
      },
    ]);
  }

  /**
   * Tăng trưởng khách hàng (Customer Growth over time)
   */
  static async getCustomerGrowth(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    return await Customer.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          newCustomers: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          newCustomers: 1,
        },
      },
    ]);
  }

  /**
   * Tỷ lệ trạng thái đơn (Order Status Breakdown)
   */
  static async getOrderStatusBreakdown(storeId?: string) {
    const matchStage: Record<string, any> = {};
    if (storeId && mongoose.isValidObjectId(storeId)) {
      matchStage.storeId = new mongoose.Types.ObjectId(storeId);
    }

    return await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
        },
      },
      {
        $project: {
          _id: 0,
          status: '$_id',
          count: 1,
          totalAmount: 1,
        },
      },
    ]);
  }

  /**
   * Top món bán chạy (Top Selling Items)
   */
  static async getTopItems(limit = 8) {
    return await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          menuItemId: { $first: '$items.menuItemId' },
          totalQty: { $sum: '$items.qty' },
          totalRevenue: { $sum: { $multiply: ['$items.qty', '$items.price'] } },
        },
      },
      {
        $lookup: {
          from: 'menuitems',
          localField: 'menuItemId',
          foreignField: '_id',
          as: 'itemDetails',
        },
      },
      { $unwind: { path: '$itemDetails', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          name: '$_id',
          category: { $ifNull: ['$itemDetails.category', 'General'] },
          price: { $ifNull: ['$itemDetails.price', 0] },
          image: { $ifNull: ['$itemDetails.image', ''] },
          totalQty: 1,
          totalRevenue: 1,
        },
      },
      { $sort: { totalQty: -1 } },
      { $limit: limit },
    ]);
  }

  /**
   * Top khách hàng chi tiêu nhiều nhất (Top Customers)
   */
  static async getTopCustomers(limit = 10) {
    return await Customer.aggregate([
      { $sort: { totalSpent: -1, orderCount: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          phone: 1,
          totalSpent: 1,
          orderCount: 1,
          createdAt: 1,
        },
      },
    ]);
  }
}
