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
  menuItemId: string;
  name: string;
  qty: number;
  price: number;
}

export interface IStatusHistory {
  status: OrderStatus;
  at: string;
}

export interface IOrder {
  _id: string;
  customerId: {
    _id: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
  };
  storeId: {
    _id: string;
    name: string;
    address: string;
    phone: string;
  };
  shipperId: {
    _id: string;
    fullName: string;
    phone: string;
    vehicle?: string;
    licensePlate?: string;
    status?: string;
  } | null;
  items: IOrderItem[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  deliveryAddress: string;
  note: string;
  statusHistory: IStatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface IStore {
  _id: string;
  name: string;
  address: string;
  phone: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  openHours: {
    open: string;
    close: string;
  };
  status: 'open' | 'closed';
  totalRevenue?: number;
  totalOrders?: number;
  activeOrders?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ICustomer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  totalSpent: number;
  orderCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface IShipper {
  _id: string;
  fullName: string;
  phone: string;
  vehicle: string;
  licensePlate: string;
  status: 'available' | 'busy' | 'offline';
  storeId: {
    _id: string;
    name: string;
    address?: string;
  } | string;
  activeOrdersCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface IMenuItem {
  _id: string;
  name: string;
  category: 'Burgers' | 'Pizzas' | 'Drinks' | 'Sides' | 'Desserts' | 'Combos';
  price: number;
  description: string;
  image: string;
  isAvailable: boolean;
  storeId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IReview {
  _id: string;
  orderId: {
    _id: string;
    items?: Array<{ name: string; qty: number; price: number }>;
    totalAmount?: number;
    createdAt?: string;
  };
  customerId: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  storeId: {
    _id: string;
    name: string;
    address?: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
}

export interface IPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IAnalyticsOverview {
  totalRevenue: number;
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  avgOrderValue: number;
  totalCustomers: number;
  totalStores: number;
  avgRating: number;
  totalReviews: number;
}

export interface IDailyRevenue {
  date: string;
  revenue: number;
  orderCount: number;
  subtotal: number;
  deliveryFee: number;
}

export interface IStoreRevenue {
  storeId: string;
  storeName: string;
  storeAddress: string;
  status: 'open' | 'closed';
  totalRevenue: number;
  totalOrders: number;
  deliveredOrders: number;
}

export interface ICategoryRevenue {
  category: string;
  revenue: number;
  itemsSold: number;
}

export interface ICustomerGrowth {
  date: string;
  newCustomers: number;
}

export interface IOrderStatusBreakdown {
  status: OrderStatus;
  count: number;
  totalAmount: number;
}

export interface ITopItem {
  name: string;
  category: string;
  price: number;
  image: string;
  totalQty: number;
  totalRevenue: number;
}

export interface ITopCustomer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  totalSpent: number;
  orderCount: number;
}
