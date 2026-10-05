import mongoose, { Document, Schema } from 'mongoose';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod = 'cash' | 'card' | 'momo' | 'vnpay';

export interface IOrderItem {
  menuItemId: mongoose.Types.ObjectId;
  name: string;
  qty: number;
  price: number;
}

export interface IStatusHistory {
  status: OrderStatus;
  at: Date;
}

export interface IOrder extends Document {
  customerId: mongoose.Types.ObjectId;
  storeId: mongoose.Types.ObjectId;
  shipperId: mongoose.Types.ObjectId | null;
  items: IOrderItem[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  deliveryAddress: string;
  note: string;
  statusHistory: IStatusHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const StatusHistorySchema = new Schema<IStatusHistory>(
  {
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'],
      required: true,
    },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    shipperId: { type: Schema.Types.ObjectId, ref: 'Shipper', default: null },
    items: { type: [OrderItemSchema], required: true, validate: [(v: IOrderItem[]) => v.length > 0, 'Order must have at least one item'] },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'momo', 'vnpay'],
      default: 'cash',
    },
    deliveryAddress: { type: String, required: true, trim: true },
    note: { type: String, default: '', trim: true },
    statusHistory: {
      type: [StatusHistorySchema],
      default: () => [{ status: 'pending', at: new Date() }],
    },
  },
  {
    timestamps: true,
  }
);

OrderSchema.index({ storeId: 1, createdAt: -1 });
OrderSchema.index({ customerId: 1, createdAt: -1 });
OrderSchema.index({ shipperId: 1 });
OrderSchema.index({ status: 1 });

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
