import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  HeartPulse,
  LayoutDashboard,
  Calendar,
  Clock,
  User,
  LogOut,
  Stethoscope,
  Award,
  DollarSign,
  Building,
  FileText,
  Mail,
  Phone,
  ShieldCheck,
  Camera,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { doc, getDoc, updateDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { updateProfile as updateAuthProfile } from "firebase/auth";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { processImageFile, MAX_IMAGE_SIZE_MB } from "../../lib/imageUtils";

export default function DoctorProfile() {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [savingImage, setSavingImage] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(
      doc(db, "doctors", currentUser.uid),
      (snap) => {
        if (snap.exists()) {
          setProfile(snap.data());
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error loading doctor profile:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [currentUser]);

  // Handle image upload and compression
  const handleImageFileChange = async (e) => {
    setFeedback({ type: "", message: "" });
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await processImageFile(file, { maxSizeMB: MAX_IMAGE_SIZE_MB });
    if (!result.success) {
      setFeedback({ type: "error", message: result.error });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      setSavingImage(true);
      const newImage = result.base64;

      // 1. Update doctors/{uid}
      await updateDoc(doc(db, "doctors", currentUser.uid), {
        image: newImage,
        updatedAt: serverTimestamp(),
      });

      // 2. Update users/{uid}
      try {
        await updateDoc(doc(db, "users", currentUser.uid), {
          image: newImage,
          photoURL: newImage,
          updatedAt: serverTimestamp(),
        });
      } catch (userErr) {
        console.warn("Could not update users document:", userErr);
      }

      // 3. Update Firebase Auth display photo
      if (currentUser) {
        try {
          await updateAuthProfile(currentUser, { photoURL: newImage });
        } catch (authErr) {
          console.warn("Could not update auth photoURL:", authErr);
        }
      }

      setProfile((prev) => ({ ...prev, image: newImage }));
      setFeedback({ type: "success", message: "Profile photo updated successfully!" });
    } catch (err) {
      console.error("Error updating profile image:", err);
      setFeedback({ type: "error", message: "Failed to update photo: " + err.message });
    } finally {
      setSavingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Handle image removal
  const handleRemoveImage = async () => {
    if (!profile?.image) return;
    setFeedback({ type: "", message: "" });

    try {
      setSavingImage(true);
      await updateDoc(doc(db, "doctors", currentUser.uid), {
        image: "",
        updatedAt: serverTimestamp(),
      });

      try {
        await updateDoc(doc(db, "users", currentUser.uid), {
          image: "",
          photoURL: "",
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn(e);
      }

      setProfile((prev) => ({ ...prev, image: "" }));
      setFeedback({ type: "success", message: "Profile photo removed." });
    } catch (err) {
      setFeedback({ type: "error", message: "Failed to remove photo: " + err.message });
    } finally {
      setSavingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent" />
      </div>
    );
  }

  const name = profile?.fullName || userProfile?.fullName || "Doctor";
  const email = currentUser?.email || "";
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Profile</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal profile photo. Clinical credentials and roster fields are maintained by the clinic administrator.
        </p>
      </div>

      {/* Feedback Toast / Alert */}
      {feedback.message && (
        <div
          className={`flex items-center gap-2.5 rounded-2xl p-4 text-xs font-semibold animate-in fade-in duration-150 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Profile identity card with Interactive Photo Management */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="flex items-center gap-5">
          {/* Avatar with Camera Action Button */}
          <div className="relative group shrink-0">
            {profile?.image ? (
              <img
                src={profile.image}
                alt={name}
                className="h-20 w-20 rounded-2xl object-cover border-2 border-sky-200 shadow-md"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-sky-800 text-white font-black text-2xl shadow-md">
                {initial}
              </div>
            )}

            {/* Quick Camera trigger on the avatar badge */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={savingImage}
              className="absolute -bottom-1 -right-1 flex h-7.5 w-7.5 items-center justify-center rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/30 transition cursor-pointer border-2 border-white disabled:opacity-50"
              title="Upload profile picture"
            >
              {savingImage ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          {/* Details */}
          <div>
            <p className="text-lg font-black text-slate-900">{name}</p>
            <p className="text-xs text-slate-500">{email}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-sky-700 border border-sky-200/60">
                <Stethoscope className="h-3 w-3" />
                {profile?.specialization || "Medical Specialist"}
              </span>
              <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200/60">
                Active Doctor
              </span>
            </div>
          </div>
        </div>

        {/* Change / Remove Photo Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 self-stretch sm:self-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={savingImage}
            className="flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 text-xs font-bold shadow-sm shadow-sky-600/20 transition cursor-pointer disabled:opacity-50"
          >
            {savingImage ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5" />
                <span>Change Photo</span>
              </>
            )}
          </button>

          {profile?.image && (
            <button
              type="button"
              onClick={handleRemoveImage}
              disabled={savingImage}
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100/80 text-rose-700 px-3 py-2.5 text-xs font-bold transition cursor-pointer disabled:opacity-50"
              title="Remove profile photo"
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-600" />
              <span className="hidden sm:inline">Remove</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin notice */}
      <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-xs font-semibold text-amber-800 border border-amber-200">
        <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
        <span>Clinical credentials, room allocation, and license information are managed by the clinic administrator. You may update your profile photo at any time.</span>
      </div>

      {/* ── Section 1: Personal Info (Read-only) ── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
          <User className="h-4 w-4 text-sky-600" />
          Personal Information
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoField icon={<User className="h-3.5 w-3.5" />} label="Full Name" value={name} />
          <InfoField icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={email} />
          <InfoField icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={profile?.phone || "—"} />
          <InfoField label="Gender" value={profile?.gender || "—"} />
          <InfoField label="Date of Birth" value={profile?.dateOfBirth || "—"} />
        </div>
      </div>

      {/* ── Section 2: Clinical Info (Read-only) ── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-sky-600" />
          Specialization &amp; Clinical Information
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoField label="Specialization" value={profile?.specialization || "—"} />
          <InfoField icon={<Award className="h-3.5 w-3.5" />} label="Qualification" value={profile?.qualification || "—"} />
          <InfoField label="Experience" value={profile?.experience || "—"} />
          <InfoField icon={<FileText className="h-3.5 w-3.5" />} label="License Number" value={profile?.licenseNumber || "—"} />
          <InfoField icon={<DollarSign className="h-3.5 w-3.5" />} label="Consultation Fee" value={profile?.consultationFee ? `$${profile.consultationFee}` : "—"} />
          <InfoField icon={<Building className="h-3.5 w-3.5" />} label="Room Number" value={profile?.roomNumber || "—"} />
        </div>

        {profile?.biography && (
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Biography</p>
            <p className="text-xs text-slate-700 bg-slate-50 rounded-xl p-3 border border-slate-100 leading-relaxed">
              {profile.biography}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Reusable read-only field component ── */
function InfoField({ icon, label, value }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase text-slate-400 mb-1 flex items-center gap-1">
        {icon && <span className="text-slate-400">{icon}</span>}
        {label}
      </p>
      <div className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700 font-semibold">
        {value}
      </div>
    </div>
  );
}
