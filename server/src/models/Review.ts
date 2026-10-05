import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  orderId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  storeId: mongoose.Types.ObjectId;
  rating: number; // 1 - 5
  comment: string;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: '',
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

ReviewSchema.index({ storeId: 1, rating: 1 });
ReviewSchema.index({ customerId: 1 });

export const Review = mongoose.model<IReview>('Review', ReviewSchema);
