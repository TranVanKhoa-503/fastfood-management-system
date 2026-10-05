import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Store } from '../models/Store.js';
import { Customer } from '../models/Customer.js';
import { MenuItem } from '../models/MenuItem.js';
import { Shipper } from '../models/Shipper.js';
import { Order, OrderStatus, PaymentMethod } from '../models/Order.js';
import { Review } from '../models/Review.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fastfood_db';

const STORES_DATA = [
  {
    name: 'FastFood Hoàn Kiếm - Flagship',
    address: '25 Tràng Tiền, Quận Hoàn Kiếm, Hà Nội',
    phone: '024-3825-1101',
    location: {
      type: 'Point' as const,
      coordinates: [105.8542, 21.0285] as [number, number],
    },
    openHours: { open: '07:30', close: '23:00' },
    status: 'open' as const,
  },
  {
    name: 'FastFood Cầu Giấy - Express',
    address: '180 Xuân Thủy, Quận Cầu Giấy, Hà Nội',
    phone: '024-3754-2202',
    location: {
      type: 'Point' as const,
      coordinates: [105.7876, 21.0371] as [number, number],
    },
    openHours: { open: '08:00', close: '22:30' },
    status: 'open' as const,
  },
  {
    name: 'FastFood Bến Nghé - Q1',
    address: '68 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    phone: '028-3829-3303',
    location: {
      type: 'Point' as const,
      coordinates: [106.7028, 10.7745] as [number, number],
    },
    openHours: { open: '08:00', close: '23:30' },
    status: 'open' as const,
  },
  {
    name: 'FastFood Landmark 81',
    address: '720A Điện Biên Phủ, Phường 22, Quận Bình Thạnh, TP. Hồ Chí Minh',
    phone: '028-3911-4404',
    location: {
      type: 'Point' as const,
      coordinates: [106.7218, 10.7952] as [number, number],
    },
    openHours: { open: '09:00', close: '22:00' },
    status: 'open' as const,
  },
  {
    name: 'FastFood Đà Nẵng Riverside',
    address: '150 Bạch Đằng, Quận Hải Châu, TP. Đà Nẵng',
    phone: '0236-388-5505',
    location: {
      type: 'Point' as const,
      coordinates: [108.2238, 16.0678] as [number, number],
    },
    openHours: { open: '08:00', close: '22:00' },
    status: 'closed' as const,
  },
];

const MENU_ITEMS_DATA = [
  {
    name: 'Double Cheeseburger Supreme',
    category: 'Burgers' as const,
    price: 89000,
    description: '2 miếng bò Úc nướng lửa, phô mai Cheddar kép, sốt đặc biệt và rau xà lách tươi.',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    name: 'Crispy Spicy Chicken Burger',
    category: 'Burgers' as const,
    price: 75000,
    description: 'Ức gà phi lê chiên giòn cay rụm, sốt cay Mayo, dưa chua và bắp cải tím.',
    image: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    name: 'BBQ Bacon Smokehouse Burger',
    category: 'Burgers' as const,
    price: 95000,
    description: 'Bò nướng xông khói, thịt xông khói giòn, hành phi sốt BBQ ngọt ngào.',
    image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    name: 'Pizza Pepperoni Passion 9"',
    category: 'Pizzas' as const,
    price: 149000,
    description: 'Đế bánh mỏng giòn phủ ngập xúc xích Ý cay Pepperoni và phô mai Mozzarella béo ngậy.',
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    name: 'Pizza Hải Sản Pesto Cao Cấp',
    category: 'Pizzas' as const,
    price: 179000,
    description: 'Tôm sú, mực tươi, thanh cua sốt Pesto xanh thơm mát và ớt chuông nướng.',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    name: 'Khoai Tây Chiên Lắc Phô Mai',
    category: 'Sides' as const,
    price: 39000,
    description: 'Khoai tây cắt lát chiên giòn tan lắc bột phô mai béo ngọt thơm nức mũi.',
    image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    name: 'Cánh Gà Sốt Chua Cay Hàn Quốc (4 miếng)',
    category: 'Sides' as const,
    price: 69000,
    description: 'Cánh gà chiên giòn áo sốt cay ngọt Gochujang rắc mè trắng rang.',
    image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    name: 'Trà Sữa Trân Châu Đường Đen',
    category: 'Drinks' as const,
    price: 35000,
    description: 'Trà sữa đậm vị thơm béo cùng trân châu dẻo mềm sốt đường đen hảo hạng.',
    image: 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    name: 'Coca Cola Tươi Đá Lạnh L',
    category: 'Drinks' as const,
    price: 22000,
    description: 'Nước ngọt Coca-Cola tươi mát lạnh xua tan cơn khát.',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    name: 'Bánh Kem Lava Chocolate Nóng Chảy',
    category: 'Desserts' as const,
    price: 45000,
    description: 'Bánh chocolate đắng nhẹ với nhân sốt sô-cô-la tan chảy ngọt lịm bên trong.',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    name: 'Combo Party Tiệc Tùng 4 Người',
    category: 'Combos' as const,
    price: 289000,
    description: '1 Pizza Pepperoni 9" + 2 Burger Bò + 1 Khoai tây lắc + 4 Cánh gà + 4 Ly Coca L.',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    name: 'Combo Solo Meal Năng Lượng',
    category: 'Combos' as const,
    price: 99000,
    description: '1 Burger Gà Giòn Cay + 1 Khoai tây chiên giòn + 1 Ly Coca mát lạnh.',
    image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
];

const CUSTOMERS_DATA = [
  {
    name: 'Nguyễn Văn Hùng',
    email: 'vanhung.nguyen@gmail.com',
    phone: '0912345678',
    address: 'Tòa nhà R1 Royal City, 72A Nguyễn Trãi, Thanh Xuân, Hà Nội',
  },
  {
    name: 'Trần Thị Mai Hương',
    email: 'maihuong.tran@gmail.com',
    phone: '0987654321',
    address: '15 Duy Tân, Dịch Vọng Hậu, Cầu Giấy, Hà Nội',
  },
  {
    name: 'Lê Hoàng Nam',
    email: 'hoangnam.le@yahoo.com',
    phone: '0903112233',
    address: 'Chung cư Vinhomes Central Park, 208 Nguyễn Hữu Cảnh, Bình Thạnh, TP.HCM',
  },
  {
    name: 'Phạm Minh Trang',
    email: 'minhtrang.pham@outlook.com',
    phone: '0938445566',
    address: '42 Tôn Đức Thắng, Phường Bến Nghé, Quận 1, TP.HCM',
  },
  {
    name: 'Đặng Quốc Bảo',
    email: 'quocbao.dang@gmail.com',
    phone: '0945778899',
    address: '88 Trần Phú, Quận Hải Châu, TP. Đà Nẵng',
  },
  {
    name: 'Vũ Thùy Linh',
    email: 'thuylinh.vu@gmail.com',
    phone: '0966332211',
    address: '36 Hoàng Cầu, Đống Đa, Hà Nội',
  },
  {
    name: 'Hoàng Gia Huy',
    email: 'giahuy.hoang@gmail.com',
    phone: '0977889900',
    address: '102 Lê Duẩn, Hoàn Kiếm, Hà Nội',
  },
  {
    name: 'Bùi Thị Tuyết',
    email: 'tuyetbui@gmail.com',
    phone: '0922114455',
    address: '25 Nguyễn Đình Chiểu, Quận 3, TP.HCM',
  },
];

const SHIPPERS_DATA = [
  { fullName: 'Nguyễn Thành Đạt', phone: '0981112233', vehicle: 'Honda Wave Alpha', licensePlate: '29-B1 567.89' },
  { fullName: 'Trần Quốc Tuấn', phone: '0982223344', vehicle: 'Yamaha Sirius', licensePlate: '29-E1 123.45' },
  { fullName: 'Lê Văn Phong', phone: '0904445566', vehicle: 'Honda Vision', licensePlate: '59-S2 888.99' },
  { fullName: 'Phạm Hữu Nghĩa', phone: '0905556677', vehicle: 'Honda Air Blade', licensePlate: '59-P1 999.22' },
  { fullName: 'Đỗ Hữu Thắng', phone: '0936667788', vehicle: 'Yamaha Grande', licensePlate: '43-C1 777.33' },
];

export const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB at', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('[Seed] Connection established. Cleaning existing collections...');

    await Promise.all([
      Store.deleteMany({}),
      Customer.deleteMany({}),
      MenuItem.deleteMany({}),
      Shipper.deleteMany({}),
      Order.deleteMany({}),
      Review.deleteMany({}),
    ]);

    // Ensure 2dsphere index on Store
    await Store.collection.createIndex({ location: '2dsphere' });
    console.log('[Seed] Created 2dsphere index for Store location.');

    // 1. Create Stores
    const createdStores = await Store.insertMany(STORES_DATA);
    console.log(`[Seed] Inserted ${createdStores.length} stores.`);

    // 2. Create Customers
    const createdCustomers = await Customer.insertMany(
      CUSTOMERS_DATA.map((c) => ({ ...c, totalSpent: 0, orderCount: 0 }))
    );
    console.log(`[Seed] Inserted ${createdCustomers.length} customers.`);

    // 3. Create Menu Items
    const createdMenuItems = await MenuItem.insertMany(
      MENU_ITEMS_DATA.map((m) => ({ ...m, storeId: createdStores[0]._id }))
    );
    console.log(`[Seed] Inserted ${createdMenuItems.length} menu items.`);

    // 4. Create Shippers
    const shippersToInsert = SHIPPERS_DATA.map((shp, idx) => ({
      ...shp,
      storeId: createdStores[idx % createdStores.length]._id,
      status: (idx % 2 === 0 ? 'available' : 'busy') as 'available' | 'busy' | 'offline',
    }));
    const createdShippers = await Shipper.insertMany(shippersToInsert);
    console.log(`[Seed] Inserted ${createdShippers.length} shippers.`);

    // 5. Generate Orders for the past 30 days
    console.log('[Seed] Generating sample orders spanning the last 30 days...');
    const orderStatuses: OrderStatus[] = [
      'delivered',
      'delivered',
      'delivered',
      'delivered',
      'delivered',
      'out_for_delivery',
      'preparing',
      'confirmed',
      'pending',
      'cancelled',
    ];
    const paymentMethods: PaymentMethod[] = ['cash', 'card', 'momo', 'vnpay'];

    const ordersToInsert: any[] = [];
    const customerSpendMap = new Map<string, { total: number; count: number }>();

    for (let i = 0; i < 45; i++) {
      const customer = createdCustomers[i % createdCustomers.length];
      const store = createdStores[i % createdStores.length];
      const shipper = createdShippers[i % createdShippers.length];

      // Random date in past 30 days
      const daysAgo = Math.floor(Math.random() * 30);
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - daysAgo);
      orderDate.setHours(
        8 + Math.floor(Math.random() * 13),
        Math.floor(Math.random() * 60),
        Math.floor(Math.random() * 60)
      );

      // Random 1-3 items
      const numItems = 1 + Math.floor(Math.random() * 3);
      const chosenItems: any[] = [];
      let subtotal = 0;

      for (let j = 0; j < numItems; j++) {
        const item = createdMenuItems[(i * 3 + j) % createdMenuItems.length];
        const qty = 1 + Math.floor(Math.random() * 2);
        chosenItems.push({
          menuItemId: item._id,
          name: item.name,
          qty,
          price: item.price,
        });
        subtotal += item.price * qty;
      }

      const deliveryFee = 15000;
      const totalAmount = subtotal + deliveryFee;
      const status = orderStatuses[i % orderStatuses.length];
      const paymentMethod = paymentMethods[i % paymentMethods.length];

      // Status history
      const history = [{ status: 'pending' as OrderStatus, at: new Date(orderDate.getTime()) }];
      if (status !== 'pending') {
        history.push({
          status: 'confirmed' as OrderStatus,
          at: new Date(orderDate.getTime() + 2 * 60000),
        });
      }
      if (['preparing', 'ready', 'out_for_delivery', 'delivered'].includes(status)) {
        history.push({
          status: 'preparing' as OrderStatus,
          at: new Date(orderDate.getTime() + 10 * 60000),
        });
      }
      if (['ready', 'out_for_delivery', 'delivered'].includes(status)) {
        history.push({
          status: 'ready' as OrderStatus,
          at: new Date(orderDate.getTime() + 20 * 60000),
        });
      }
      if (['out_for_delivery', 'delivered'].includes(status)) {
        history.push({
          status: 'out_for_delivery' as OrderStatus,
          at: new Date(orderDate.getTime() + 25 * 60000),
        });
      }
      if (status === 'delivered') {
        history.push({
          status: 'delivered' as OrderStatus,
          at: new Date(orderDate.getTime() + 45 * 60000),
        });
      }
      if (status === 'cancelled') {
        history.push({
          status: 'cancelled' as OrderStatus,
          at: new Date(orderDate.getTime() + 5 * 60000),
        });
      }

      const assignedShipperId =
        ['out_for_delivery', 'delivered', 'ready'].includes(status) ? shipper._id : null;

      ordersToInsert.push({
        customerId: customer._id,
        storeId: store._id,
        shipperId: assignedShipperId,
        items: chosenItems,
        subtotal,
        deliveryFee,
        totalAmount,
        status,
        paymentMethod,
        deliveryAddress: customer.address,
        note: i % 3 === 0 ? 'Giao tầng 5 giúp tôi, gọi trước khi đến' : '',
        statusHistory: history,
        createdAt: orderDate,
        updatedAt: history[history.length - 1].at,
      });

      // Update customer stats
      const prev = customerSpendMap.get(customer._id.toString()) || { total: 0, count: 0 };
      customerSpendMap.set(customer._id.toString(), {
        total: prev.total + (status === 'delivered' ? totalAmount : 0),
        count: prev.count + 1,
      });
    }

    const createdOrders = await Order.insertMany(ordersToInsert);
    console.log(`[Seed] Inserted ${createdOrders.length} orders.`);

    // Update customers with spent and count
    for (const [custId, stats] of customerSpendMap.entries()) {
      await Customer.findByIdAndUpdate(custId, {
        totalSpent: stats.total,
        orderCount: stats.count,
      });
    }

    // 6. Create Reviews for delivered orders
    console.log('[Seed] Creating customer reviews for completed orders...');
    const deliveredOrders = createdOrders.filter((o) => o.status === 'delivered');
    const reviewComments = [
      'Giao hàng rất nhanh, burger còn nóng hổi và phô mai kéo sợi cực ngon!',
      'Pizza thơm nức mũi, khoai tây lắc phô mai giòn tan 10/10.',
      'Đồ ăn chất lượng, đóng gói kỹ càng, shipper thân thiện nhiệt tình.',
      'Món ăn vừa miệng, đúng hương vị, sẽ ủng hộ dài lâu.',
      'Thức ăn ngon nhưng thời gian chuẩn bị hơi lâu xíu, bù lại shipper rất lịch sự.',
      'Combo siêu hời, đủ cho cả nhóm 4 người ăn no nê!',
      'Gà rán giòn rụm sốt cay đậm đà, nước ngọt mát lạnh rất đã.',
      'Tuyệt vời! Chi nhánh phục vụ rất chu đáo.',
    ];

    const reviewsToInsert = deliveredOrders.slice(0, 20).map((ord, idx) => {
      const rating = 4 + (idx % 2); // 4 or 5 stars with a few 3s
      return {
        orderId: ord._id,
        customerId: ord.customerId,
        storeId: ord.storeId,
        rating: idx % 5 === 0 ? 3 : rating,
        comment: reviewComments[idx % reviewComments.length],
        createdAt: new Date(ord.createdAt.getTime() + 60 * 60000),
      };
    });

    const createdReviews = await Review.insertMany(reviewsToInsert);
    console.log(`[Seed] Inserted ${createdReviews.length} customer reviews.`);

    console.log('✅ [Seed] Database seeded successfully!');
  } catch (error) {
    console.error('❌ [Seed] Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('[Seed] Disconnected from MongoDB.');
  }
};

if (process.argv[1]?.includes('01_setup_fastfood')) {
  seedDatabase();
}
