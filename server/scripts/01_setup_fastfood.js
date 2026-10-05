/**
 * 01_setup_fastfood.js - Standalone MongoDB Seed Script
 * Can be run with: node server/scripts/01_setup_fastfood.js
 * Or inside NoSQLBooster / Mongo Shell
 */

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fastfood_db';

const STORES_DATA = [
  {
    name: 'FastFood Hoàn Kiếm - Flagship',
    address: '25 Tràng Tiền, Quận Hoàn Kiếm, Hà Nội',
    phone: '024-3825-1101',
    location: {
      type: 'Point',
      coordinates: [105.8542, 21.0285],
    },
    openHours: { open: '07:30', close: '23:00' },
    status: 'open',
  },
  {
    name: 'FastFood Cầu Giấy - Express',
    address: '180 Xuân Thủy, Quận Cầu Giấy, Hà Nội',
    phone: '024-3754-2202',
    location: {
      type: 'Point',
      coordinates: [105.7876, 21.0371],
    },
    openHours: { open: '08:00', close: '22:30' },
    status: 'open',
  },
  {
    name: 'FastFood Bến Nghé - Q1',
    address: '68 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    phone: '028-3829-3303',
    location: {
      type: 'Point',
      coordinates: [106.7028, 10.7745],
    },
    openHours: { open: '08:00', close: '23:30' },
    status: 'open',
  },
  {
    name: 'FastFood Landmark 81',
    address: '720A Điện Biên Phủ, Phường 22, Quận Bình Thạnh, TP. Hồ Chí Minh',
    phone: '028-3911-4404',
    location: {
      type: 'Point',
      coordinates: [106.7218, 10.7952],
    },
    openHours: { open: '09:00', close: '22:00' },
    status: 'open',
  },
  {
    name: 'FastFood Đà Nẵng Riverside',
    address: '150 Bạch Đằng, Quận Hải Châu, TP. Đà Nẵng',
    phone: '0236-388-5505',
    location: {
      type: 'Point',
      coordinates: [108.2238, 16.0678],
    },
    openHours: { open: '08:00', close: '22:00' },
    status: 'closed',
  },
];

const MENU_ITEMS_DATA = [
  {
    name: 'Double Cheeseburger Supreme',
    category: 'Burgers',
    price: 89000,
    description: '2 miếng bò Úc nướng lửa, phô mai Cheddar kép, sốt đặc biệt và rau xà lách tươi.',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    name: 'Crispy Spicy Chicken Burger',
    category: 'Burgers',
    price: 75000,
    description: 'Ức gà phi lê chiên giòn cay rụm, sốt cay Mayo, dưa chua và bắp cải tím.',
    image: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    name: 'BBQ Bacon Smokehouse Burger',
    category: 'Burgers',
    price: 95000,
    description: 'Bò nướng xông khói, thịt xông khói giòn, hành phi sốt BBQ ngọt ngào.',
    image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    name: 'Pizza Pepperoni Passion 9"',
    category: 'Pizzas',
    price: 149000,
    description: 'Đế bánh mỏng giòn phủ ngập xúc xích Ý cay Pepperoni và phô mai Mozzarella béo ngậy.',
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    name: 'Pizza Hải Sản Pesto Cao Cấp',
    category: 'Pizzas',
    price: 179000,
    description: 'Tôm sú, mực tươi, thanh cua sốt Pesto xanh thơm mát và ớt chuông nướng.',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    name: 'Khoai Tây Chiên Lắc Phô Mai',
    category: 'Sides',
    price: 39000,
    description: 'Khoai tây cắt lát chiên giòn tan lắc bột phô mai béo ngọt thơm nức mũi.',
    image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    name: 'Cánh Gà Sốt Chua Cay Hàn Quốc (4 miếng)',
    category: 'Sides',
    price: 69000,
    description: 'Cánh gà chiên giòn áo sốt cay ngọt Gochujang rắc mè trắng rang.',
    image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    name: 'Trà Sữa Trân Châu Đường Đen',
    category: 'Drinks',
    price: 35000,
    description: 'Trà sữa đậm vị thơm béo cùng trân châu dẻo mềm sốt đường đen hảo hạng.',
    image: 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    name: 'Coca Cola Tươi Đá Lạnh L',
    category: 'Drinks',
    price: 22000,
    description: 'Nước ngọt Coca-Cola tươi mát lạnh xua tan cơn khát.',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    name: 'Bánh Kem Lava Chocolate Nóng Chảy',
    category: 'Desserts',
    price: 45000,
    description: 'Bánh chocolate đắng nhẹ với nhân sốt sô-cô-la tan chảy ngọt lịm bên trong.',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    name: 'Combo Party Tiệc Tùng 4 Người',
    category: 'Combos',
    price: 289000,
    description: '1 Pizza Pepperoni 9" + 2 Burger Bò + 1 Khoai tây lắc + 4 Cánh gà + 4 Ly Coca L.',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    name: 'Combo Solo Meal Năng Lượng',
    category: 'Combos',
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

async function runSeed() {
  try {
    console.log('[Seed] Connecting to MongoDB:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('[Seed] Connected.');

    const db = mongoose.connection.db;

    // Clear collections
    await Promise.all([
      db.collection('stores').deleteMany({}),
      db.collection('customers').deleteMany({}),
      db.collection('menuitems').deleteMany({}),
      db.collection('shippers').deleteMany({}),
      db.collection('orders').deleteMany({}),
      db.collection('reviews').deleteMany({}),
    ]);

    // Create 2dsphere index
    await db.collection('stores').createIndex({ location: '2dsphere' });

    // Insert Stores
    const now = new Date();
    const storesWithDates = STORES_DATA.map((s) => ({ ...s, createdAt: now, updatedAt: now }));
    const storeRes = await db.collection('stores').insertMany(storesWithDates);
    const storeIds = Object.values(storeRes.insertedIds);

    // Insert Customers
    const customersWithDates = CUSTOMERS_DATA.map((c) => ({
      ...c,
      totalSpent: 0,
      orderCount: 0,
      createdAt: now,
      updatedAt: now,
    }));
    const custRes = await db.collection('customers').insertMany(customersWithDates);
    const customerIds = Object.values(custRes.insertedIds);

    // Insert Menu Items
    const menuWithDates = MENU_ITEMS_DATA.map((m) => ({
      ...m,
      storeId: storeIds[0],
      createdAt: now,
      updatedAt: now,
    }));
    const menuRes = await db.collection('menuitems').insertMany(menuWithDates);
    const menuIds = Object.values(menuRes.insertedIds);

    // Insert Shippers
    const shippersWithDates = SHIPPERS_DATA.map((shp, idx) => ({
      ...shp,
      storeId: storeIds[idx % storeIds.length],
      status: idx % 2 === 0 ? 'available' : 'busy',
      createdAt: now,
      updatedAt: now,
    }));
    const shipperRes = await db.collection('shippers').insertMany(shippersWithDates);
    const shipperIds = Object.values(shipperRes.insertedIds);

    // Generate Orders
    const orderStatuses = [
      'delivered', 'delivered', 'delivered', 'delivered', 'delivered',
      'out_for_delivery', 'preparing', 'ready', 'confirmed', 'pending', 'cancelled',
    ];
    const paymentMethods = ['cash', 'card', 'momo', 'vnpay'];

    const ordersToInsert = [];
    const customerSpendMap = new Map();

    for (let i = 0; i < 45; i++) {
      const cId = customerIds[i % customerIds.length];
      const sId = storeIds[i % storeIds.length];
      const shpId = shipperIds[i % shipperIds.length];

      const daysAgo = Math.floor(Math.random() * 30);
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - daysAgo);

      const numItems = 1 + Math.floor(Math.random() * 3);
      const items = [];
      let subtotal = 0;

      for (let j = 0; j < numItems; j++) {
        const itemIdx = (i * 3 + j) % MENU_ITEMS_DATA.length;
        const item = MENU_ITEMS_DATA[itemIdx];
        const mId = menuIds[itemIdx];
        const qty = 1 + Math.floor(Math.random() * 2);
        items.push({
          menuItemId: mId,
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
      const customer = CUSTOMERS_DATA[i % CUSTOMERS_DATA.length];

      const history = [{ status: 'pending', at: orderDate }];
      if (status !== 'pending') history.push({ status: 'confirmed', at: new Date(orderDate.getTime() + 120000) });
      if (['preparing', 'ready', 'out_for_delivery', 'delivered'].includes(status)) {
        history.push({ status: 'preparing', at: new Date(orderDate.getTime() + 600000) });
      }
      if (['ready', 'out_for_delivery', 'delivered'].includes(status)) {
        history.push({ status: 'ready', at: new Date(orderDate.getTime() + 1200000) });
      }
      if (['out_for_delivery', 'delivered'].includes(status)) {
        history.push({ status: 'out_for_delivery', at: new Date(orderDate.getTime() + 1500000) });
      }
      if (status === 'delivered') {
        history.push({ status: 'delivered', at: new Date(orderDate.getTime() + 2700000) });
      }
      if (status === 'cancelled') {
        history.push({ status: 'cancelled', at: new Date(orderDate.getTime() + 300000) });
      }

      const assignedShipperId = ['out_for_delivery', 'delivered', 'ready'].includes(status) ? shpId : null;

      ordersToInsert.push({
        customerId: cId,
        storeId: sId,
        shipperId: assignedShipperId,
        items,
        subtotal,
        deliveryFee,
        totalAmount,
        status,
        paymentMethod,
        deliveryAddress: customer.address,
        note: i % 3 === 0 ? 'Giao nhanh giúp mình nhé!' : '',
        statusHistory: history,
        createdAt: orderDate,
        updatedAt: history[history.length - 1].at,
      });

      const key = cId.toString();
      const prev = customerSpendMap.get(key) || { total: 0, count: 0 };
      customerSpendMap.set(key, {
        total: prev.total + (status === 'delivered' ? totalAmount : 0),
        count: prev.count + 1,
      });
    }

    const orderRes = await db.collection('orders').insertMany(ordersToInsert);
    const orderIds = Object.values(orderRes.insertedIds);

    // Update customer spend stats
    for (const [key, stats] of customerSpendMap.entries()) {
      await db.collection('customers').updateOne(
        { _id: new mongoose.Types.ObjectId(key) },
        { $set: { totalSpent: stats.total, orderCount: stats.count } }
      );
    }

    // Insert Reviews
    const reviewComments = [
      'Giao hàng rất nhanh, burger còn nóng hổi và phô mai kéo sợi cực ngon!',
      'Pizza thơm nức mũi, khoai tây lắc phô mai giòn tan 10/10.',
      'Đồ ăn chất lượng, đóng gói kỹ càng, shipper thân thiện nhiệt tình.',
      'Món ăn vừa miệng, đúng hương vị, sẽ ủng hộ dài lâu.',
      'Thức ăn ngon nhưng thời gian chuẩn bị hơi lâu xíu, bù lại shipper rất lịch sự.',
    ];

    const reviewsToInsert = [];
    ordersToInsert.forEach((ord, idx) => {
      if (ord.status === 'delivered' && reviewsToInsert.length < 15) {
        reviewsToInsert.push({
          orderId: orderIds[idx],
          customerId: ord.customerId,
          storeId: ord.storeId,
          rating: idx % 5 === 0 ? 3 : (4 + (idx % 2)),
          comment: reviewComments[idx % reviewComments.length],
          createdAt: new Date(ord.createdAt.getTime() + 3600000),
        });
      }
    });

    if (reviewsToInsert.length > 0) {
      await db.collection('reviews').insertMany(reviewsToInsert);
    }

    console.log('🎉 [01_setup_fastfood.js] MongoDB Seed completed successfully!');
  } catch (err) {
    console.error('❌ [Seed Error]:', err);
  } finally {
    await mongoose.disconnect();
  }
}

runSeed();
