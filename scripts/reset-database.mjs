/**
 * CarePlus Clinic — Full Database Reset Script
 * Deletes ALL data from Firestore and creates one clean admin account.
 *
 * Run: node scripts/reset-database.mjs
 */

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  writeBatch,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

// ── Firebase config ────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDPppKrO5YXM9b9PAsWEpVDKKM76MD4iRw",
  authDomain: "careplus-clinic-ccee5.firebaseapp.com",
  projectId: "careplus-clinic-ccee5",
  storageBucket: "careplus-clinic-ccee5.firebasestorage.app",
  messagingSenderId: "798067907597",
  appId: "1:798067907597:web:45e293adfed97798520944",
};

// ── Admin account to keep / create ────────────────────────────────────────────
const ADMIN_EMAIL    = "admin@clinic.com";
const ADMIN_PASSWORD = "Admin123456";
const ADMIN_NAME     = "Super Admin";

// ── Collections to wipe ───────────────────────────────────────────────────────
const COLLECTIONS_TO_WIPE = [
  "users",
  "doctors",
  "appointments",
  "notifications",
];

// ── Delete a whole collection ─────────────────────────────────────────────────
async function deleteCollection(db, collectionName) {
  const colRef   = collection(db, collectionName);
  const snapshot = await getDocs(colRef);
  if (snapshot.empty) {
    console.log(`  [skip] "${collectionName}" is already empty.`);
    return 0;
  }

  let deleted = 0;
  let batch   = writeBatch(db);
  let count   = 0;

  for (const docSnap of snapshot.docs) {
    batch.delete(docSnap.ref);
    count++;
    deleted++;
    if (count === 499) {
      await batch.commit();
      batch = writeBatch(db);
      count = 0;
    }
  }
  if (count > 0) await batch.commit();

  console.log(`  [done] Deleted ${deleted} doc(s) from "${collectionName}".`);
  return deleted;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🔥  CarePlus Clinic — Database Reset");
  console.log("======================================\n");

  const app  = initializeApp(firebaseConfig);
  const db   = getFirestore(app);
  const auth = getAuth(app);

  // Step 1: Wipe Firestore
  console.log("📦 Step 1: Wiping Firestore collections...");
  for (const col of COLLECTIONS_TO_WIPE) {
    await deleteCollection(db, col);
  }
  console.log("\n✅ All Firestore data cleared.\n");

  // Step 2: Create admin Auth user
  console.log("👤 Step 2: Creating admin account in Firebase Auth...");
  let adminUid;
  try {
    const cred = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    adminUid = cred.user.uid;
    console.log(`  [created] UID: ${adminUid}`);
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      console.log("  [exists] Email already in Auth — signing in to get UID...");
      const cred = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
      adminUid = cred.user.uid;
      console.log(`  [found]  UID: ${adminUid}`);
    } else {
      throw err;
    }
  }

  // Step 3: Write Firestore profile
  console.log("\n📝 Step 3: Writing admin profile to Firestore...");
  await setDoc(doc(db, "users", adminUid), {
    uid:       adminUid,
    fullName:  ADMIN_NAME,
    email:     ADMIN_EMAIL,
    role:      "admin",
    status:    "active",
    image:     "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  console.log(`  [done] Profile saved → users/${adminUid}`);

  // Summary
  console.log("\n======================================");
  console.log("🎉  Reset complete!");
  console.log(`    Email    : ${ADMIN_EMAIL}`);
  console.log(`    Password : ${ADMIN_PASSWORD}`);
  console.log(`    UID      : ${adminUid}`);
  console.log("======================================\n");

  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌ Reset failed:", err.message);
  process.exit(1);
});
