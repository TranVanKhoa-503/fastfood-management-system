import mongoose, { Document, Schema } from 'mongoose';

export interface IStore extends Document {
  name: string;
  address: string;
  phone: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  openHours: {
    open: string;
    close: string;
  };
  status: 'open' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

const StoreSchema = new Schema<IStore>(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true,
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
      },
    },
    openHours: {
      open: { type: String, default: '08:00' },
      close: { type: String, default: '22:00' },
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
  },
  {
    timestamps: true,
  }
);

StoreSchema.index({ location: '2dsphere' });

export const Store = mongoose.model<IStore>('Store', StoreSchema);
