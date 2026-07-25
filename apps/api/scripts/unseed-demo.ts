/**
 * Removes every document created by the demo seeder (those tagged `_demo:true`)
 * across all collections. Your real records — which have no `_demo` field — are
 * left untouched.
 *
 * Usage (from apps/api):  npm run unseed
 */
import 'dotenv/config';
import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseApp } from '../src/firebase/firebase-app';
import { COLLECTIONS } from '../src/firebase/collections';

async function unseed(): Promise<void> {
  const db = getFirestore(
    getFirebaseApp(),
    process.env.FIREBASE_DATABASE_ID ?? '(default)',
  );

  let total = 0;
  for (const col of Object.values(COLLECTIONS)) {
    const snap = await db.collection(col).where('_demo', '==', true).get();
    // Firestore batches cap at 500 writes.
    for (let i = 0; i < snap.docs.length; i += 500) {
      const batch = db.batch();
      for (const doc of snap.docs.slice(i, i + 500)) batch.delete(doc.ref);
      await batch.commit();
    }
    total += snap.size;
    console.log(`  ${col}: removed ${snap.size} demo document(s)`);
  }
  console.log(`Removed ${total} demo document(s).`);
}

unseed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Unseed failed:', err);
    process.exit(1);
  });
