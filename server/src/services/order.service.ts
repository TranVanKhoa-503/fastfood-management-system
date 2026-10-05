import mongoose from 'mongoose';
import { Order, OrderStatus, IOrder } from '../models/Order.js';
import { Shipper } from '../models/Shipper.js';
import { Customer } from '../models/Customer.js';

export interface OrderFilterParams {
  search?: string;
  status?: string;
  storeId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class OrderService {
  /**
   * List orders with filtering, search, pagination, populate
   */
  static async listOrders(params: OrderFilterParams) {
    const {
      search,
      status,
      storeId,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const query: Record<string, any> = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (storeId && storeId !== 'all' && mongoose.isValidObjectId(storeId)) {
      query.storeId = new mongoose.Types.ObjectId(storeId);
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // If search term provided (search by order ID or customer name/phone via populate lookup or direct search)
    let customerIds: mongoose.Types.ObjectId[] = [];
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      if (mongoose.isValidObjectId(search.trim())) {
        query.$or = [{ _id: new mongoose.Types.ObjectId(search.trim()) }];
      } else {
        const matchingCustomers = await Customer.find({
          $or: [{ name: searchRegex }, { phone: searchRegex }, { email: searchRegex }],
        }).select('_id');
        customerIds = matchingCustomers.map((c) => c._id as mongoose.Types.ObjectId);
        query.$or = [
          { deliveryAddress: searchRegex },
          { note: searchRegex },
          { customerId: { $in: customerIds } },
        ];
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('customerId', 'name phone email address')
        .populate('storeId', 'name address phone')
        .populate('shipperId', 'fullName phone vehicle licensePlate status')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(query),
    ]);

    return {
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  /**
   * Get single order by ID
   */
  static async getOrderById(id: string) {
    if (!mongoose.isValidObjectId(id)) {
      throw new Error('Invalid order ID');
    }

    const order = await Order.findById(id)
      .populate('customerId')
      .populate('storeId')
      .populate('shipperId');

    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  }

  /**
   * Create new order
   */
  static async createOrder(data: {
    customerId: string;
    storeId: string;
    items: Array<{ menuItemId: string; name: string; qty: number; price: number }>;
    deliveryFee?: number;
    paymentMethod?: string;
    deliveryAddress: string;
    note?: string;
  }) {
    const subtotal = data.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const deliveryFee = data.deliveryFee ?? 15000;
    const totalAmount = subtotal + deliveryFee;

    const order = new Order({
      customerId: new mongoose.Types.ObjectId(data.customerId),
      storeId: new mongoose.Types.ObjectId(data.storeId),
      items: data.items.map((it) => ({
        menuItemId: new mongoose.Types.ObjectId(it.menuItemId),
        name: it.name,
        qty: Number(it.qty),
        price: Number(it.price),
      })),
      subtotal,
      deliveryFee,
      totalAmount,
      status: 'pending',
      paymentMethod: data.paymentMethod || 'cash',
      deliveryAddress: data.deliveryAddress,
      note: data.note || '',
      statusHistory: [{ status: 'pending', at: new Date() }],
    });

    await order.save();

    // Increment customer's order count
    await Customer.findByIdAndUpdate(data.customerId, {
      $inc: { orderCount: 1 },
    });

    return await this.getOrderById(order._id.toString());
  }

  /**
   * Update order status: push to statusHistory, update timestamp, handle shipper status
   */
  static async updateStatus(orderId: string, nextStatus: OrderStatus) {
    if (!mongoose.isValidObjectId(orderId)) {
      throw new Error('Invalid order ID');
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const previousStatus = order.status;
    order.status = nextStatus;
    order.statusHistory.push({
      status: nextStatus,
      at: new Date(),
    });
    order.updatedAt = new Date();

    await order.save();

    // If order is completed (delivered), update customer totalSpent
    if (nextStatus === 'delivered' && previousStatus !== 'delivered') {
      await Customer.findByIdAndUpdate(order.customerId, {
        $inc: { totalSpent: order.totalAmount },
      });
    }

    // If order is delivered or cancelled, release shipper if no other busy orders
    if ((nextStatus === 'delivered' || nextStatus === 'cancelled') && order.shipperId) {
      const activeDeliveries = await Order.countDocuments({
        shipperId: order.shipperId,
        status: { $in: ['out_for_delivery', 'preparing', 'ready'] },
        _id: { $ne: order._id },
      });

      if (activeDeliveries === 0) {
        await Shipper.findByIdAndUpdate(order.shipperId, { status: 'available' });
      }
    }

    return await this.getOrderById(orderId);
  }

  /**
   * Assign shipper to order
   */
  static async assignShipper(orderId: string, shipperId: string) {
    if (!mongoose.isValidObjectId(orderId) || !mongoose.isValidObjectId(shipperId)) {
      throw new Error('Invalid order or shipper ID');
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const shipper = await Shipper.findById(shipperId);
    if (!shipper) {
      throw new Error('Shipper not found');
    }

    order.shipperId = new mongoose.Types.ObjectId(shipperId);
    if (order.status === 'pending' || order.status === 'confirmed' || order.status === 'preparing') {
      order.status = 'ready';
      order.statusHistory.push({
        status: 'ready',
        at: new Date(),
      });
    }
    order.updatedAt = new Date();
    await order.save();

    // Set shipper status to 'busy'
    await Shipper.findByIdAndUpdate(shipperId, { status: 'busy' });

    return await this.getOrderById(orderId);
  }

  /**
   * Generate CSV data for export
   */
  static async exportOrdersToCSV(params: OrderFilterParams) {
    const { orders } = await this.listOrders({ ...params, limit: 5000, page: 1 });

    const header = [
      'Order ID',
      'Date',
      'Customer Name',
      'Customer Phone',
      'Store Name',
      'Shipper Name',
      'Items',
      'Subtotal (VND)',
      'Delivery Fee (VND)',
      'Total Amount (VND)',
      'Status',
      'Payment Method',
      'Delivery Address',
      'Note',
    ].join(',');

    const rows = orders.map((order: any) => {
      const orderId = order._id.toString();
      const date = new Date(order.createdAt).toISOString();
      const customerName = `"${(order.customerId?.name || 'N/A').replace(/"/g, '""')}"`;
      const customerPhone = `"${(order.customerId?.phone || 'N/A').replace(/"/g, '""')}"`;
      const storeName = `"${(order.storeId?.name || 'N/A').replace(/"/g, '""')}"`;
      const shipperName = `"${(order.shipperId?.fullName || 'Unassigned').replace(/"/g, '""')}"`;
      const itemsList = `"${order.items
        .map((i: any) => `${i.name} (x${i.qty})`)
        .join('; ')
        .replace(/"/g, '""')}"`;
      const subtotal = order.subtotal;
      const deliveryFee = order.deliveryFee;
      const totalAmount = order.totalAmount;
      const status = order.status;
      const paymentMethod = order.paymentMethod;
      const address = `"${(order.deliveryAddress || '').replace(/"/g, '""')}"`;
      const note = `"${(order.note || '').replace(/"/g, '""')}"`;

      return [
        orderId,
        date,
        customerName,
        customerPhone,
        storeName,
        shipperName,
        itemsList,
        subtotal,
        deliveryFee,
        totalAmount,
        status,
        paymentMethod,
        address,
        note,
      ].join(',');
    });

    return [header, ...rows].join('\n');
  }
}
