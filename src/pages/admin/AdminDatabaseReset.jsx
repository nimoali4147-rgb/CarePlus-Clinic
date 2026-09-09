import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  writeBatch,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { db, secondaryAuth } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { Trash2, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";

const ADMIN_EMAIL    = "admin@clinic.com";
const ADMIN_PASSWORD = "Admin123456";
const ADMIN_NAME     = "Super Admin";

const COLLECTIONS = ["users", "doctors", "appointments", "notifications"];

async function wipeCollection(colName) {
  const snap = await getDocs(collection(db, colName));
  if (snap.empty) return 0;
  let batch = writeBatch(db);
  let count = 0;
  let total = 0;
  for (const d of snap.docs) {
    batch.delete(d.ref);
    count++;
    total++;
    if (count === 499) { await batch.commit(); batch = writeBatch(db); count = 0; }
  }
  if (count > 0) await batch.commit();
  return total;
}

export default function AdminDatabaseReset() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [phase, setPhase]     = useState("idle"); // idle | confirm | running | done | error
  const [log, setLog]         = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [typed, setTyped]     = useState("");

  const addLog = (msg) => setLog((prev) => [...prev, msg]);

  const handleReset = async () => {
    if (typed !== "RESET") return;
    setPhase("running");
    setLog([]);
    setErrorMsg("");

    try {
      // 1. Wipe all collections
      addLog("⏳ Wiping Firestore collections...");
      for (const col of COLLECTIONS) {
        const n = await wipeCollection(col);
        addLog(`  ✅ "${col}" — ${n} document(s) deleted.`);
      }

      // 2. Create admin Auth user
      addLog("⏳ Creating admin Auth account...");
      let adminUid;
      try {
        const cred = await createUserWithEmailAndPassword(secondaryAuth, ADMIN_EMAIL, ADMIN_PASSWORD);
        adminUid = cred.user.uid;
        addLog(`  ✅ Auth user created. UID: ${adminUid}`);
      } catch (err) {
        if (err.code === "auth/email-already-in-use") {
          addLog("  ℹ️  Email already exists in Auth — signing in to retrieve UID...");
          const cred = await signInWithEmailAndPassword(secondaryAuth, ADMIN_EMAIL, ADMIN_PASSWORD);
          adminUid = cred.user.uid;
          addLog(`  ✅ Existing UID retrieved: ${adminUid}`);
        } else {
          throw err;
        }
      }

      // 3. Write Firestore admin profile
      addLog("⏳ Writing admin profile to Firestore...");
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
      addLog(`  ✅ Admin profile saved → users/${adminUid}`);

      addLog("🎉 Database reset complete!");
      setPhase("done");
    } catch (err) {
      console.error("Reset error:", err);
      setErrorMsg(err.message);
      setPhase("error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-3xl border border-rose-800 bg-slate-900 p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-rose-900/60 text-rose-400">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Database Reset</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Wipes <strong className="text-rose-400">ALL</strong> data and keeps only one admin account.
            </p>
          </div>
        </div>

        {/* What will be deleted */}
        <div className="rounded-2xl border border-rose-900/60 bg-rose-950/40 p-4 space-y-2">
          <p className="text-xs font-bold text-rose-400 uppercase tracking-wider">Will be permanently deleted:</p>
          {COLLECTIONS.map((c) => (
            <p key={c} className="text-xs text-rose-300 flex items-center gap-2">
              <Trash2 className="h-3 w-3 shrink-0" /> All documents in <code className="font-mono">/{c}</code>
            </p>
          ))}
          <div className="mt-3 rounded-xl bg-emerald-950/60 border border-emerald-800/50 p-3">
            <p className="text-xs font-bold text-emerald-400">Admin account that will be kept / created:</p>
            <p className="text-xs text-emerald-300 mt-1">Email: <strong>{ADMIN_EMAIL}</strong></p>
            <p className="text-xs text-emerald-300">Password: <strong>{ADMIN_PASSWORD}</strong></p>
          </div>
        </div>

        {/* Confirm input */}
        {phase === "idle" && (
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-300">
              Type <span className="text-rose-400 font-mono">RESET</span> to confirm:
            </label>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Type RESET here"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-mono text-white outline-none focus:border-rose-500 transition"
            />
            <div className="flex gap-3">
              <button
                onClick={() => navigate(-1)}
                className="flex-1 rounded-xl border border-slate-700 py-2.5 text-xs font-bold text-slate-400 hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={typed !== "RESET"}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-rose-700 py-2.5 text-xs font-bold text-white hover:bg-rose-600 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-4 w-4" />
                Wipe & Reset
              </button>
            </div>
          </div>
        )}

        {/* Running log */}
        {(phase === "running" || phase === "done" || phase === "error") && (
          <div className="rounded-2xl border border-slate-700 bg-slate-800 p-4 space-y-1.5 max-h-60 overflow-y-auto font-mono text-xs">
            {log.map((l, i) => (
              <p key={i} className="text-slate-300 leading-relaxed">{l}</p>
            ))}
            {phase === "running" && (
              <p className="text-slate-400 animate-pulse">Running...</p>
            )}
          </div>
        )}

        {/* Done */}
        {phase === "done" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-2xl bg-emerald-900/40 border border-emerald-700/50 p-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm font-bold text-emerald-300">Reset Successful!</p>
                <p className="text-xs text-emerald-400 mt-0.5">Login with <strong>{ADMIN_EMAIL}</strong> / <strong>{ADMIN_PASSWORD}</strong></p>
              </div>
            </div>
            <button
              onClick={() => navigate("/login")}
              className="w-full rounded-xl bg-white py-2.5 text-xs font-bold text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            >
              Go to Login
            </button>
          </div>
        )}

        {/* Error */}
        {phase === "error" && (
          <div className="space-y-3">
            <div className="rounded-2xl bg-rose-900/40 border border-rose-700/50 p-4 text-xs text-rose-300">
              <p className="font-bold text-rose-400 mb-1">Error occurred:</p>
              <p className="font-mono">{errorMsg}</p>
            </div>
            <button
              onClick={() => { setPhase("idle"); setTyped(""); }}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" /> Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
