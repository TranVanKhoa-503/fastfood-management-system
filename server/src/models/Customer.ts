import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  email: string;
  phone: string;
  address: string;
  totalSpent: number;
  orderCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    totalSpent: { type: Number, default: 0 },
    orderCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

CustomerSchema.index({ name: 'text', email: 'text', phone: 'text' });

export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);
