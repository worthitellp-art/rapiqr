// One-time backfill: stickers already carry a folder_name (set outside the
// folder UI, e.g. bulk sheet imports), but the Folder collection — which the
// admin folder grid actually reads from — was never populated for them.
// Creates one Folder document per distinct existing sticker folder_name.
// Never modifies Sticker documents.
const { connectDB, mongoose } = require('../config/db');
const Sticker = require('../models/schemas/Sticker');
const QrModel = require('../models/qrModel');

async function main() {
  await connectDB();

  const names = await Sticker.distinct('folder_name', { deleted_at: null, folder_name: { $ne: null } });
  console.log(`Found ${names.length} distinct folder_name values on stickers:`, names);

  for (const name of names) {
    const folder = await QrModel.createFolder(name);
    console.log(`  ensured folder "${folder.name}" (id ${folder.id})`);
  }

  console.log('Backfill complete.');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('BACKFILL FAILED:', err);
  process.exit(1);
});
