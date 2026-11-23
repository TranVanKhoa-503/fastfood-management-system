const fs = require('node:fs/promises');
const path = require('node:path');
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fastfood_db';
const COLLECTIONS = ['stores', 'customers', 'menuitems', 'shippers', 'orders', 'reviews'];
const EJSON = mongoose.mongo.BSON.EJSON;

async function exportBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const defaultDirectory = path.join(__dirname, '..', 'live-backups', `backup-${timestamp}`);
  const outputDirectory = path.resolve(process.argv[2] || defaultDirectory);
  await mongoose.connect(MONGODB_URI);
  try {
    const db = mongoose.connection.db;
    await fs.mkdir(outputDirectory, { recursive: true });
    const counts = {};

    for (const collectionName of COLLECTIONS) {
      const documents = await db.collection(collectionName).find({}).toArray();
      counts[collectionName] = documents.length;
      await fs.writeFile(
        path.join(outputDirectory, `${collectionName}.json`),
        `${EJSON.stringify(documents, null, 2, { relaxed: false })}\n`,
        'utf8'
      );
    }

    await fs.writeFile(
      path.join(outputDirectory, 'manifest.json'),
      `${JSON.stringify({ database: db.databaseName, exportedAt: new Date().toISOString(), counts }, null, 2)}\n`,
      'utf8'
    );
    console.log(`[Backup] Exported ${Object.values(counts).reduce((sum, value) => sum + value, 0)} records to ${outputDirectory}`);
    console.log(counts);
  } finally {
    await mongoose.disconnect();
  }
}

exportBackup().catch((error) => {
  console.error('[Backup Error]', error);
  process.exitCode = 1;
});
