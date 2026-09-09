import React, { useState, useEffect } from "react";
import { Settings, Save, CheckCircle2, AlertCircle, Building, Phone, Mail, MapPin, Clock } from "lucide-react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [settings, setSettings] = useState({
    clinicName: "CarePlus Clinic",
    tagline: "Your Health, Our Priority",
    phone: "+254 700 123 456",
    emergencyPhone: "+254 700 999 999",
    email: "support@careplus.clinic",
    address: "Medical Plaza, Wing A, 4th Floor",
    slotDurationMinutes: "30",
    openingHours: "08:00 AM - 06:00 PM",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(doc(db, "clinicSettings", "general"));
        if (snap.exists()) {
          setSettings((prev) => ({ ...prev, ...snap.data() }));
        }
      } catch (err) {
        console.error("Error loading clinic settings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    setSettings((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await setDoc(doc(db, "clinicSettings", "general"), {
        ...settings,
        updatedAt: serverTimestamp(),
      });
      setSuccess("Clinic settings updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error saving clinic settings:", err);
      setError("Failed to save settings: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-400">Loading clinic settings...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Clinic Configuration & Settings
        </h2>
        <p className="text-xs text-slate-500">
          Manage public clinic details, appointment duration limits, and operational contact channels.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl bg-rose-50 p-4 text-xs font-semibold text-rose-700 border border-rose-100">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-700 border border-emerald-100">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3">
            General Clinic Information
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-700">Clinic Name</label>
              <input
                type="text"
                name="clinicName"
                value={settings.clinicName}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 outline-none focus:border-sky-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-700">Clinic Tagline</label>
              <input
                type="text"
                name="tagline"
                value={settings.tagline}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 outline-none focus:border-sky-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-700">Contact Phone</label>
              <input
                type="text"
                name="phone"
                value={settings.phone}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 outline-none focus:border-sky-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-700">Emergency Phone</label>
              <input
                type="text"
                name="emergencyPhone"
                value={settings.emergencyPhone}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 outline-none focus:border-sky-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-700">Support Email</label>
              <input
                type="email"
                name="email"
                value={settings.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 outline-none focus:border-sky-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-700">Physical Address</label>
              <input
                type="text"
                name="address"
                value={settings.address}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 outline-none focus:border-sky-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-700">Default Slot Duration (Minutes)</label>
              <input
                type="number"
                name="slotDurationMinutes"
                value={settings.slotDurationMinutes}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 outline-none focus:border-sky-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-700">General Opening Hours</label>
              <input
                type="text"
                name="openingHours"
                value={settings.openingHours}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 outline-none focus:border-sky-600 focus:bg-white"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-sky-700 px-8 py-3 text-xs font-bold text-white shadow-lg shadow-sky-700/20 hover:bg-sky-800 disabled:opacity-50 transition"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? "Saving Settings..." : "Save Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
