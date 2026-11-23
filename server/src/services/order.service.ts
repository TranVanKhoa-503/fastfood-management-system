import mongoose from 'mongoose';
import { Order, OrderStatus, IOrder } from '../models/Order.js';
import { Shipper } from '../models/Shipper.js';
import { Customer } from '../models/Customer.js';
import { MenuItem } from '../models/MenuItem.js';
import { Store } from '../models/Store.js';
import { csvCell, escapeRegex, parseDateRange, parsePagination } from '../utils/query.js';

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

    const { page: safePage, limit: safeLimit, skip } = parsePagination(page, limit, 10, 5000);
    if (sortOrder && !['asc', 'desc'].includes(sortOrder)) throw new Error('Sort order must be asc or desc');
    const allowedSortFields = ['createdAt', 'updatedAt', 'totalAmount', 'status'];
    const safeSortBy = sortBy && allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    if (status && status !== 'all') {
      const allowedStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
      if (!allowedStatuses.includes(status)) throw new Error('Invalid order status filter');
      query.status = status;
    }

    if (storeId && storeId !== 'all') {
      if (!mongoose.isValidObjectId(storeId)) throw new Error('Invalid store ID filter');
      query.storeId = new mongoose.Types.ObjectId(storeId);
    }

    if (startDate || endDate) {
      query.createdAt = parseDateRange(startDate, endDate);
    }

    // If search term provided (search by order ID or customer name/phone via populate lookup or direct search)
    let customerIds: mongoose.Types.ObjectId[] = [];
    if (search && search.trim()) {
      if (search.trim().length > 100) throw new Error('Search text must be 100 characters or fewer');
      const searchRegex = new RegExp(escapeRegex(search.trim()), 'i');
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

    const sort: Record<string, 1 | -1> = { [safeSortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('customerId', 'name phone email address')
        .populate('storeId', 'name address phone')
        .populate('shipperId', 'fullName phone vehicle licensePlate status')
        .sort(sort)
        .skip(skip)
        .limit(safeLimit),
      Order.countDocuments(query),
    ]);

    return {
      orders,
      pagination: {
        page: safePage,
        limit: safeLimit,
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
    items: Array<{ menuItemId: string; qty: number }>;
    deliveryFee?: number;
    paymentMethod?: string;
    deliveryAddress: string;
    note?: string;
  }) {
    if (!mongoose.isValidObjectId(data.customerId) || !mongoose.isValidObjectId(data.storeId)) {
      throw new Error('Invalid customer or store ID');
    }
    if (typeof data.deliveryAddress !== 'string' || !data.deliveryAddress.trim()) {
      throw new Error('Delivery address is required');
    }
    if (!Array.isArray(data.items) || data.items.length === 0) {
      throw new Error('An order must contain at least one menu item');
    }
    for (const item of data.items) {
      if (!item || !mongoose.isValidObjectId(item.menuItemId) || !Number.isInteger(Number(item.qty)) || Number(item.qty) < 1 || Number(item.qty) > 99) {
        throw new Error('Each order item must have a valid menu item and a positive whole quantity');
      }
    }
    const paymentMethods = ['cash', 'card', 'momo', 'vnpay'];
    const paymentMethod = data.paymentMethod || 'cash';
    if (!paymentMethods.includes(paymentMethod)) throw new Error('Invalid payment method');

    const [customer, store, menuItems] = await Promise.all([
      Customer.findById(data.customerId),
      Store.findById(data.storeId),
      MenuItem.find({ _id: { $in: data.items.map((item) => item.menuItemId) }, isAvailable: true }),
    ]);
    if (!customer) throw new Error('Customer not found');
    if (!store) throw new Error('Store not found');
    if (store.status !== 'open') throw new Error('Cannot create an order for a closed store');

    const menuById = new Map(menuItems.map((item) => [item._id.toString(), item]));
    const quantities = new Map<string, number>();
    for (const item of data.items) {
      const key = item.menuItemId.toString();
      quantities.set(key, (quantities.get(key) || 0) + Number(item.qty));
    }
    const orderItems = Array.from(quantities, ([menuItemId, qty]) => {
      if (qty > 99) throw new Error('A menu item quantity cannot exceed 99 per order');
      const menuItem = menuById.get(menuItemId);
      if (!menuItem) throw new Error(`Menu item ${menuItemId} does not exist or is unavailable`);
      return {
        menuItemId: menuItem._id,
        name: menuItem.name,
        category: menuItem.category,
        qty,
        price: menuItem.price,
      };
    });

    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);
    if (!Number.isSafeInteger(subtotal)) throw new Error('Order subtotal exceeds the supported VND amount');
    const deliveryFee = Number(data.deliveryFee ?? 15000);
    if (!Number.isSafeInteger(deliveryFee) || deliveryFee < 0) {
      throw new Error('Delivery fee must be a non-negative whole VND amount');
    }
    const totalAmount = subtotal + deliveryFee;

    const order = new Order({
      customerId: new mongoose.Types.ObjectId(data.customerId),
      storeId: new mongoose.Types.ObjectId(data.storeId),
      items: orderItems,
      subtotal,
      deliveryFee,
      totalAmount,
      status: 'pending',
      paymentMethod,
      deliveryAddress: data.deliveryAddress.trim(),
      note: typeof data.note === 'string' ? data.note.trim() : '',
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
    const allowedNextStatuses: Record<OrderStatus, OrderStatus[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['out_for_delivery', 'cancelled'],
      out_for_delivery: ['delivered', 'cancelled'],
      delivered: [],
      cancelled: [],
    };
    if (!allowedNextStatuses[previousStatus]?.includes(nextStatus)) {
      throw new Error(`Cannot change order status from ${previousStatus} to ${nextStatus}`);
    }
    if (nextStatus === 'out_for_delivery' && !order.shipperId) {
      throw new Error('Assign an available shipper before dispatching the order');
    }
    const changedAt = new Date();
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: order._id, status: previousStatus },
      { $set: { status: nextStatus }, $push: { statusHistory: { status: nextStatus, at: changedAt } } },
      { new: true, runValidators: true }
    );
    if (!updatedOrder) throw new Error('Order changed while this request was being processed; refresh and try again');

    // If order is completed (delivered), update customer totalSpent
    if (nextStatus === 'delivered') {
      await Customer.findByIdAndUpdate(order.customerId, {
        $inc: { totalSpent: order.totalAmount },
      });
    }

    // If order is delivered or cancelled, release shipper if no other busy orders
    if ((nextStatus === 'delivered' || nextStatus === 'cancelled') && order.shipperId) {
      await this.releaseShipperIfIdle(order.shipperId.toString(), order._id.toString());
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

    if (order.status === 'delivered' || order.status === 'cancelled') {
      throw new Error('Cannot assign a shipper to a completed or cancelled order');
    }
    if (shipper.storeId.toString() !== order.storeId.toString()) {
      throw new Error('Shipper must belong to the same store as the order');
    }
    if (order.shipperId?.toString() === shipper._id.toString()) {
      return await this.getOrderById(orderId);
    }
    const previousShipperId = order.shipperId?.toString();
    if (previousShipperId === shipper._id.toString()) return await this.getOrderById(orderId);

    // Claim the shipper atomically so two orders cannot reserve the same available driver.
    const claimedShipper = await Shipper.findOneAndUpdate(
      { _id: shipper._id, storeId: order.storeId, status: 'available' },
      { $set: { status: 'busy' } },
      { new: true }
    );
    if (!claimedShipper) throw new Error('Selected shipper is not available');

    const orderFilter: Record<string, unknown> = { _id: order._id, status: order.status };
    orderFilter.shipperId = order.shipperId || null;
    const updatedOrder = await Order.findOneAndUpdate(
      orderFilter,
      { $set: { shipperId: claimedShipper._id, updatedAt: new Date() } },
      { new: true, runValidators: true }
    );
    if (!updatedOrder) {
      await this.releaseShipperIfIdle(claimedShipper._id.toString());
      throw new Error('Order changed while this request was being processed; refresh and try again');
    }

    if (previousShipperId) await this.releaseShipperIfIdle(previousShipperId, order._id.toString());

    return await this.getOrderById(orderId);
  }

  private static async releaseShipperIfIdle(shipperId: string, exceptOrderId?: string) {
    const query: Record<string, unknown> = {
      shipperId: new mongoose.Types.ObjectId(shipperId),
      status: { $nin: ['delivered', 'cancelled'] },
    };
    if (exceptOrderId) query._id = { $ne: new mongoose.Types.ObjectId(exceptOrderId) };
    const activeOrders = await Order.countDocuments(query);
    if (activeOrders === 0) {
      await Shipper.findOneAndUpdate({ _id: shipperId, status: 'busy' }, { $set: { status: 'available' } });
    }
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
    ].map(csvCell).join(',');

    const rows = orders.map((order: any) => {
      const orderId = order._id.toString();
      const date = new Date(order.createdAt).toISOString();
      const customerName = order.customerId?.name || 'N/A';
      const customerPhone = order.customerId?.phone || 'N/A';
      const storeName = order.storeId?.name || 'N/A';
      const shipperName = order.shipperId?.fullName || 'Unassigned';
      const itemsList = order.items
        .map((i: any) => `${i.name} (x${i.qty})`)
        .join('; ');
      const subtotal = order.subtotal;
      const deliveryFee = order.deliveryFee;
      const totalAmount = order.totalAmount;
      const status = order.status;
      const paymentMethod = order.paymentMethod;
      const address = order.deliveryAddress || '';
      const note = order.note || '';

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
      ].map(csvCell).join(',');
    });

    return [header, ...rows].join('\n');
  }
}
