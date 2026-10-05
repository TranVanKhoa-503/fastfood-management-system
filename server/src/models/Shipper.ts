import mongoose, { Document, Schema } from 'mongoose';

export interface IShipper extends Document {
  fullName: string;
  phone: string;
  vehicle: string;
  licensePlate: string;
  status: 'available' | 'busy' | 'offline';
  storeId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ShipperSchema = new Schema<IShipper>(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    vehicle: { type: String, default: 'Motorbike', trim: true },
    licensePlate: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['available', 'busy', 'offline'],
      default: 'available',
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

ShipperSchema.index({ storeId: 1, status: 1 });

export const Shipper = mongoose.model<IShipper>('Shipper', ShipperSchema);
