import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import * as dotenv from "dotenv";

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const ADMIN_EMAIL = "admin@clinic.com";
const ADMIN_PASSWORD = "Admin123456";

async function createAdmin() {
  console.log("Setting up System Administrator account...");
  let userUid = null;

  try {
    // Try to create the Auth account
    const userCred = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    userUid = userCred.user.uid;
    console.log(`Created new Firebase Auth user with UID: ${userUid}`);
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      console.log("Auth user already exists. Signing in to retrieve UID...");
      const signInCred = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
      userUid = signInCred.user.uid;
      console.log(`Retrieved existing user UID: ${userUid}`);
    } else {
      console.error("Error creating Auth user:", err.message);
      process.exit(1);
    }
  }

  // Create or update Firestore users/{adminUid} document with role: "admin"
  await setDoc(doc(db, "users", userUid), {
    uid: userUid,
    fullName: "System Administrator",
    email: ADMIN_EMAIL,
    role: "admin",
    status: "active",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });

  console.log("✅ Successfully created/updated Firestore users document with role: 'admin'!");
  console.log("-----------------------------------------");
  console.log(`Email:    ${ADMIN_EMAIL}`);
  console.log(`Password: ${ADMIN_PASSWORD}`);
  console.log("Role:     admin");
  console.log("-----------------------------------------");
  process.exit(0);
}

createAdmin().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
