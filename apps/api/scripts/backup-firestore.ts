/**
 * Firestore backup script.
 *
 * Exports every collection listed in COLLECTIONS to a single timestamped JSON
 * file under `backups/`. This is a lightweight, dependency-free alternative to
 * a managed `gcloud firestore export` — good enough to protect a single-user
 * finance dataset, and trivial to restore from (each document is stored with
 * its id and raw fields).
 *
 * Usage (from apps/api):
 *   npm run backup                       # writes backups/firestore-<ISO>.json
 *   BACKUP_DIR=/some/path npm run backup # custom output directory
 *
 * Requires the same FIREBASE_* env vars the API uses (loaded from apps/api/.env
 * via dotenv). Schedule it with cron / a CI job to get regular off-site copies.
 */
import 'dotenv/config';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseApp } from '../src/firebase/firebase-app';
import { COLLECTIONS } from '../src/firebase/collections';

async function backup(): Promise<void> {
  const db = getFirestore(getFirebaseApp());
  const dump: Record<string, Array<Record<string, unknown>>> = {};
  let total = 0;

  for (const collection of Object.values(COLLECTIONS)) {
    const snapshot = await db.collection(collection).get();
    dump[collection] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    total += snapshot.size;
    console.log(`  ${collection}: ${snapshot.size} document(s)`);
  }

  const outDir = resolve(process.env.BACKUP_DIR ?? 'backups');
  mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outFile = join(outDir, `firestore-${stamp}.json`);
  writeFileSync(
    outFile,
    JSON.stringify(
      { exportedAt: new Date().toISOString(), data: dump },
      null,
      2,
    ),
  );

  console.log(`Backed up ${total} document(s) to ${outFile}`);
}

backup()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Backup failed:', err);
    process.exit(1);
  });
