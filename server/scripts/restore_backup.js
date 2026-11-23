const fs = require('node:fs/promises');
const path = require('node:path');
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fastfood_db';
const COLLECTIONS = ['stores', 'customers', 'menuitems', 'shippers', 'orders', 'reviews'];
const EJSON = mongoose.mongo.BSON.EJSON;

const INDEXES = {
  stores: [[{ location: '2dsphere' }]],
  customers: [[{ name: 'text', email: 'text', phone: 'text' }]],
  menuitems: [[{ name: 'text', category: 1 }]],
  shippers: [[{ storeId: 1, status: 1 }]],
  orders: [[{ storeId: 1, createdAt: -1 }], [{ customerId: 1, createdAt: -1 }], [{ shipperId: 1 }], [{ status: 1 }]],
  reviews: [[{ orderId: 1 }, { unique: true }], [{ storeId: 1, rating: 1 }], [{ customerId: 1 }]],
};

async function restoreBackup() {
  const args = process.argv.slice(2);
  const replaceExisting = args.includes('--replace');
  const directoryArgument = args.find((arg) => !arg.startsWith('--'));
  const inputDirectory = path.resolve(directoryArgument || path.join(process.cwd(), 'backup'));
  const prepared = {};

  for (const collectionName of COLLECTIONS) {
    const filePath = path.join(inputDirectory, `${collectionName}.json`);
    const parsed = EJSON.parse(await fs.readFile(filePath, 'utf8'));
    if (!Array.isArray(parsed)) throw new Error(`${filePath} must contain a JSON array.`);
    prepared[collectionName] = parsed;
  }

  await mongoose.connect(MONGODB_URI);
  try {
    const db = mongoose.connection.db;
    const counts = await Promise.all(COLLECTIONS.map((name) => db.collection(name).countDocuments()));
    if (counts.some((count) => count > 0) && !replaceExisting) {
      throw new Error('Target database is not empty. Add --replace only if you intend to replace all six project collections.');
    }

    if (replaceExisting) {
      await Promise.all(COLLECTIONS.map((name) => db.collection(name).deleteMany({})));
    }

    for (const collectionName of COLLECTIONS) {
      const documents = prepared[collectionName];
      if (documents.length > 0) await db.collection(collectionName).insertMany(documents);
      for (const [keys, options] of INDEXES[collectionName].map((entry) => (entry.length === 1 ? [entry[0], {}] : entry))) {
        await db.collection(collectionName).createIndex(keys, options);
      }
      console.log(`[Restore] ${collectionName}: ${documents.length} records`);
    }
  } finally {
    await mongoose.disconnect();
  }
}

restoreBackup().catch((error) => {
  console.error('[Restore Error]', error);
  process.exitCode = 1;
});
