const fs = require('node:fs/promises');
const path = require('node:path');
const mongoose = require('mongoose');
const { STORES_DATA, MENU_ITEMS_DATA, CUSTOMERS_DATA, SHIPPERS_DATA } = require('./01_setup_fastfood.js');

const COLLECTIONS = ['stores', 'customers', 'menuitems', 'shippers', 'orders', 'reviews'];
const EJSON = mongoose.mongo.BSON.EJSON;
const BASE_DATE = new Date('2026-11-18T12:00:00.000Z');

function objectId(type, index) {
  const hex = `${type.toString(16).padStart(8, '0')}${index.toString(16).padStart(16, '0')}`;
  return new mongoose.Types.ObjectId(hex);
}

function makeHistory(status, orderDate) {
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
  if (status === 'delivered') history.push({ status: 'delivered', at: new Date(orderDate.getTime() + 2700000) });
  if (status === 'cancelled') history.push({ status: 'cancelled', at: new Date(orderDate.getTime() + 300000) });
  return history;
}

function buildCollections() {
  const createdAt = BASE_DATE;
  const stores = STORES_DATA.map((store, index) => ({
    _id: objectId(1, index + 1), ...store, createdAt, updatedAt: createdAt,
  }));
  const customers = CUSTOMERS_DATA.map((customer, index) => ({
    _id: objectId(2, index + 1), ...customer, totalSpent: 0, orderCount: 0, createdAt, updatedAt: createdAt,
  }));
  const menuitems = MENU_ITEMS_DATA.map((item, index) => ({
    _id: objectId(3, index + 1), ...item, createdAt, updatedAt: createdAt,
  }));
  const shippers = SHIPPERS_DATA.map((shipper, index) => ({
    _id: objectId(4, index + 1), ...shipper, storeId: stores[index % stores.length]._id,
    status: 'available', createdAt, updatedAt: createdAt,
  }));

  const orderStatuses = ['delivered', 'delivered', 'delivered', 'delivered', 'delivered', 'out_for_delivery', 'preparing', 'ready', 'confirmed', 'pending', 'cancelled'];
  const paymentMethods = ['cash', 'card', 'momo', 'vnpay'];
  const customerTotals = new Map();
  const orders = Array.from({ length: 45 }, (_, index) => {
    const customer = customers[index % customers.length];
    const store = stores[index % stores.length];
    const candidateStatus = orderStatuses[index % orderStatuses.length];
    const status = index === 9
      ? 'out_for_delivery'
      : candidateStatus === 'out_for_delivery' && index !== 5 ? 'ready' : candidateStatus;
    const orderDate = new Date(BASE_DATE.getTime() - ((index * 7) % 30) * 86400000 - (index % 12) * 3600000);
    const itemCount = 1 + (index % 3);
    const items = [];
    let subtotal = 0;
    for (let itemIndex = 0; itemIndex < itemCount; itemIndex++) {
      const menuIndex = (index * 3 + itemIndex) % menuitems.length;
      const item = menuitems[menuIndex];
      const qty = 1 + ((index + itemIndex) % 2);
      items.push({ menuItemId: item._id, name: item.name, category: item.category, qty, price: item.price });
      subtotal += item.price * qty;
    }
    const totalAmount = subtotal + 15000;
    const statusHistory = makeHistory(status, orderDate);
    const shipperId = status === 'out_for_delivery'
      ? shippers[index % shippers.length]._id
      : status === 'delivered' ? shippers[index % shippers.length]._id : null;
    const stats = customerTotals.get(customer._id.toString()) || { totalSpent: 0, orderCount: 0 };
    stats.orderCount += 1;
    if (status === 'delivered') stats.totalSpent += totalAmount;
    customerTotals.set(customer._id.toString(), stats);
    return {
      _id: objectId(5, index + 1), customerId: customer._id, storeId: store._id, shipperId,
      items, subtotal, deliveryFee: 15000, totalAmount, status,
      paymentMethod: paymentMethods[index % paymentMethods.length],
      deliveryAddress: customer.address,
      note: index % 3 === 0 ? 'Giao nhanh giúp mình nhé!' : '',
      statusHistory, createdAt: orderDate, updatedAt: statusHistory.at(-1).at,
    };
  });

  const activeShipperIds = new Set(orders
    .filter((order) => order.shipperId && !['delivered', 'cancelled'].includes(order.status))
    .map((order) => order.shipperId.toString()));
  shippers.forEach((shipper, index) => {
    shipper.status = activeShipperIds.has(shipper._id.toString())
      ? 'busy' : 'available';
  });

  for (const customer of customers) {
    const stats = customerTotals.get(customer._id.toString()) || { totalSpent: 0, orderCount: 0 };
    customer.totalSpent = stats.totalSpent;
    customer.orderCount = stats.orderCount;
  }

  const reviewComments = [
    'Giao hàng rất nhanh, burger còn nóng hổi và phô mai kéo sợi cực ngon!',
    'Pizza thơm nức mũi, khoai tây lắc phô mai giòn tan 10/10.',
    'Đồ ăn chất lượng, đóng gói kỹ càng, shipper thân thiện nhiệt tình.',
    'Món ăn vừa miệng, đúng hương vị, sẽ ủng hộ dài lâu.',
    'Thức ăn ngon nhưng thời gian chuẩn bị hơi lâu xíu, bù lại shipper rất lịch sự.',
  ];
  const reviews = [];
  orders.forEach((order, index) => {
    if (order.status === 'delivered' && reviews.length < 15) {
      reviews.push({
        _id: objectId(6, reviews.length + 1), orderId: order._id,
        customerId: order.customerId, storeId: order.storeId,
        rating: index % 5 === 0 ? 3 : 4 + (index % 2),
        comment: reviewComments[index % reviewComments.length],
        createdAt: new Date(order.createdAt.getTime() + 3600000),
      });
    }
  });

  return { stores, customers, menuitems, shippers, orders, reviews };
}

async function generateDemoBackup() {
  const outputDirectory = path.resolve(process.argv[2] || path.join(process.cwd(), 'backup'));
  const collections = buildCollections();
  await fs.mkdir(outputDirectory, { recursive: true });
  for (const collectionName of COLLECTIONS) {
    await fs.writeFile(
      path.join(outputDirectory, `${collectionName}.json`),
      `${EJSON.stringify(collections[collectionName], null, 2, { relaxed: false })}\n`,
      'utf8'
    );
  }
  const counts = Object.fromEntries(COLLECTIONS.map((name) => [name, collections[name].length]));
  await fs.writeFile(
    path.join(outputDirectory, 'manifest.json'),
    `${JSON.stringify({ database: 'fastfood_db', exportedAt: BASE_DATE.toISOString(), source: 'Synthetic demo fixture based on the included seed data; not exported from a live database.', counts }, null, 2)}\n`,
    'utf8'
  );
  console.log(`[Demo Backup] Wrote ${Object.values(counts).reduce((sum, value) => sum + value, 0)} demo records to ${outputDirectory}`);
  console.log(counts);
}

generateDemoBackup().catch((error) => {
  console.error('[Demo Backup Error]', error);
  process.exitCode = 1;
});
