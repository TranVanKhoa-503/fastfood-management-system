/*
 * Read-only MongoDB queries for the NoSQLBooster Script Editor.
 * Connect to fastfood_db before running this file.
 */
const fastfoodDb = db.getSiblingDB('fastfood_db');

// 1. Open branches
fastfoodDb.stores.find(
  { status: 'open' },
  { name: 1, address: 1, phone: 1, status: 1 }
).sort({ name: 1 });

// 2. Recent delivery orders with customer and shipper names
fastfoodDb.orders.aggregate([
  { $match: { status: { $in: ['ready', 'out_for_delivery', 'delivered'] } } },
  { $sort: { createdAt: -1 } },
  { $limit: 20 },
  {
    $lookup: {
      from: 'customers',
      localField: 'customerId',
      foreignField: '_id',
      as: 'customer'
    }
  },
  { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
  {
    $lookup: {
      from: 'shippers',
      localField: 'shipperId',
      foreignField: '_id',
      as: 'shipper'
    }
  },
  { $unwind: { path: '$shipper', preserveNullAndEmptyArrays: true } },
  {
    $project: {
      status: 1,
      totalAmount: 1,
      createdAt: 1,
      customerName: '$customer.name',
      customerPhone: '$customer.phone',
      shipperName: '$shipper.fullName'
    }
  }
]);

// 3. Revenue and quantity by menu category for delivered orders
fastfoodDb.orders.aggregate([
  { $match: { status: 'delivered' } },
  { $unwind: '$items' },
  {
    $group: {
      _id: '$items.category',
      quantitySold: { $sum: '$items.qty' },
      revenueVnd: { $sum: { $multiply: ['$items.price', '$items.qty'] } }
    }
  },
  { $sort: { revenueVnd: -1 } }
]);

// 4. Top customers by delivered spend
fastfoodDb.orders.aggregate([
  { $match: { status: 'delivered' } },
  {
    $group: {
      _id: '$customerId',
      deliveredOrders: { $sum: 1 },
      spentVnd: { $sum: '$totalAmount' }
    }
  },
  { $sort: { spentVnd: -1 } },
  { $limit: 10 },
  {
    $lookup: {
      from: 'customers',
      localField: '_id',
      foreignField: '_id',
      as: 'customer'
    }
  },
  { $unwind: '$customer' },
  {
    $project: {
      name: '$customer.name',
      phone: '$customer.phone',
      deliveredOrders: 1,
      spentVnd: 1
    }
  }
]);

// 5. Nearby branches; stores.location has a 2dsphere index
fastfoodDb.stores.find({
  location: {
    $nearSphere: {
      $geometry: { type: 'Point', coordinates: [105.8542, 21.0285] },
      $maxDistance: 10000
    }
  }
}).limit(5);

// 6. Inspect indexes used by the app
fastfoodDb.stores.getIndexes();
fastfoodDb.orders.getIndexes();
