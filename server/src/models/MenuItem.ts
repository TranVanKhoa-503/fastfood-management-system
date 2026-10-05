import mongoose, { Document, Schema } from 'mongoose';

export interface IMenuItem extends Document {
  name: string;
  category: 'Burgers' | 'Pizzas' | 'Drinks' | 'Sides' | 'Desserts' | 'Combos';
  price: number;
  description: string;
  image: string;
  isAvailable: boolean;
  storeId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema = new Schema<IMenuItem>(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Burgers', 'Pizzas', 'Drinks', 'Sides', 'Desserts', 'Combos'],
      required: true,
    },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    isAvailable: { type: Boolean, default: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', default: null },
  },
  {
    timestamps: true,
  }
);

MenuItemSchema.index({ name: 'text', category: 1 });

export const MenuItem = mongoose.model<IMenuItem>('MenuItem', MenuItemSchema);
