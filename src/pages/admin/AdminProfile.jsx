import React, { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  Save,
  AlertCircle,
  CheckCircle2,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  X,
  Upload,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import {
  updatePassword,
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { db, auth } from "../../lib/firebase";
import { processImageFile, MAX_IMAGE_SIZE_MB } from "../../lib/imageUtils";
import { useAuth } from "../../context/AuthContext";

export default function AdminProfile() {
  const { currentUser, refreshUserProfile } = useAuth();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Profile fields
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    image: "",
  });
  const [initialEmail, setInitialEmail] = useState("");

  // Email verification modal state
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailVerifyPassword, setEmailVerifyPassword] = useState("");
  const [showEmailVerifyPw, setShowEmailVerifyPw] = useState(false);
  const [emailVerifyError, setEmailVerifyError] = useState("");
  const [emailVerifying, setEmailVerifying] = useState(false);

  // Password change
  const [pwData, setPwData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    const fetchAdmin = async () => {
      if (!currentUser) return;
      try {
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        if (snap.exists()) {
          const d = snap.data();
          const emailVal = currentUser.email || d.email || "";
          setFormData({
            fullName: d.fullName || currentUser.displayName || "",
            phone: d.phone || "",
            email: emailVal,
            image: d.image || d.profileImage || "",
          });
          setInitialEmail(emailVal);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchAdmin();
  }, [currentUser]);

  const handleChange = (e) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  // Handle local image file upload from computer
  const handleImageFileChange = async (e) => {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await processImageFile(file, { maxSizeMB: MAX_IMAGE_SIZE_MB });
    if (!result.success) {
      setError(result.error);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFormData((prev) => ({ ...prev, image: result.base64 }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, image: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Triggered when submitting the Personal Information form
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    if (!formData.email.trim()) {
      setError("Email address is required.");
      return;
    }

    const trimmedEmail = formData.email.trim().toLowerCase();
    const currentEmailNorm = (currentUser?.email || initialEmail || "").toLowerCase();

    // If email has changed, require current password verification
    if (trimmedEmail !== currentEmailNorm) {
      setEmailVerifyPassword("");
      setEmailVerifyError("");
      setEmailModalOpen(true);
      return;
    }

    // Email hasn't changed, save name, phone and image directly
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        image: formData.image || "",
        updatedAt: serverTimestamp(),
      });
      if (refreshUserProfile) await refreshUserProfile();
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  // Confirm and apply email change with re-authentication
  const handleConfirmEmailChange = async (e) => {
    e.preventDefault();
    setEmailVerifyError("");

    if (!emailVerifyPassword) {
      setEmailVerifyError("Please enter your current password to confirm.");
      return;
    }

    setEmailVerifying(true);
    const newEmail = formData.email.trim();
    const oldEmail = currentUser?.email || initialEmail;

    try {
      // 1. Re-authenticate user
      const credential = EmailAuthProvider.credential(oldEmail, emailVerifyPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);

      // 2. Update email in Firebase Auth
      await updateEmail(auth.currentUser, newEmail);

      // 3. Update Firestore user document
      await updateDoc(doc(db, "users", currentUser.uid), {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: newEmail,
        image: formData.image || "",
        updatedAt: serverTimestamp(),
      });

      // 4. Refresh context and state
      if (refreshUserProfile) await refreshUserProfile();
      setInitialEmail(newEmail);
      setEmailModalOpen(false);
      setEmailVerifyPassword("");
      setSuccess(`Profile and Email updated successfully! Your new login email is ${newEmail}`);
      setTimeout(() => setSuccess(""), 6000);
    } catch (err) {
      console.error("Email update error:", err);
      if (
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        setEmailVerifyError("Incorrect password. Please verify and try again.");
      } else if (err.code === "auth/email-already-in-use") {
        setEmailVerifyError("This email address is already registered to another account.");
      } else if (err.code === "auth/invalid-email") {
        setEmailVerifyError("Invalid email format. Please provide a valid email.");
      } else {
        setEmailVerifyError(err.message || "Failed to update email address.");
      }
    } finally {
      setEmailVerifying(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");

    if (!pwData.currentPassword) {
      setPwError("Enter your current password.");
      return;
    }
    if (pwData.newPassword.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    if (pwData.newPassword !== pwData.confirmPassword) {
      setPwError("New passwords do not match.");
      return;
    }

    setSavingPw(true);
    try {
      const activeEmail = auth.currentUser?.email || currentUser?.email || initialEmail;
      const credential = EmailAuthProvider.credential(
        activeEmail,
        pwData.currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, pwData.newPassword);
      setPwSuccess("Password changed successfully!");
      setPwData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setPwSuccess(""), 4000);
    } catch (err) {
      console.error(err);
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setPwError("Current password is incorrect.");
      } else {
        setPwError(err.message || "Failed to change password.");
      }
    } finally {
      setSavingPw(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-slate-400">
        Loading profile...
      </div>
    );
  }

  const initials = formData.fullName
    ? formData.fullName.charAt(0).toUpperCase()
    : "A";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Admin Profile
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Manage your administrator account information and security settings.
        </p>
      </div>

      {/* Identity Card with Photo Upload */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="flex items-center gap-5">
          <div className="relative group">
            {formData.image ? (
              <img
                src={formData.image}
                alt={formData.fullName}
                className="h-20 w-20 rounded-2xl object-cover border-2 border-purple-600 shadow-md shadow-purple-600/20 shrink-0"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-purple-600 text-white font-black text-2xl shadow-md shadow-purple-600/20">
                {initials}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-purple-600 text-white shadow-md hover:bg-purple-700 transition cursor-pointer"
              title="Upload Profile Photo"
            >
              <Upload className="h-3.5 w-3.5" />
            </button>
          </div>
          <div>
            <p className="text-lg font-black text-slate-900 leading-tight">
              {formData.fullName || "System Administrator"}
            </p>
            <p className="text-xs text-slate-500">{formData.email}</p>
            <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-purple-700">
              <ShieldCheck className="h-3 w-3" />
              Super Admin
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 transition cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>{formData.image ? "Change Photo" : "Upload Photo"}</span>
          </button>
          {formData.image && (
            <button
              type="button"
              onClick={handleRemoveImage}
              className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
              title="Remove Photo"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Profile Info Form ── */}
      <form onSubmit={handleSaveProfile} className="space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
            <User className="h-4 w-4 text-sky-600" />
            Personal Information
          </h3>

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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  placeholder="System Administrator"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-3 text-xs text-slate-900 outline-none focus:border-sky-600 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="admin@clinic.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-3 text-xs text-slate-900 outline-none focus:border-sky-600 focus:bg-white transition"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Updating your email will update your login credentials.
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+254 700 000 000"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-3 text-xs text-slate-900 outline-none focus:border-sky-600 focus:bg-white transition"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-sky-700 px-7 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-700/20 hover:bg-sky-800 disabled:opacity-50 transition cursor-pointer"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </div>
      </form>

      {/* ── Change Password Form ── */}
      <form onSubmit={handleChangePassword} className="space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-sky-600" />
            Change Password
          </h3>

          {pwError && (
            <div className="flex items-start gap-3 rounded-2xl bg-rose-50 p-4 text-xs font-semibold text-rose-700 border border-rose-100">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{pwError}</span>
            </div>
          )}
          {pwSuccess && (
            <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-700 border border-emerald-100">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
              <span>{pwSuccess}</span>
            </div>
          )}

          <div className="space-y-3">
            {/* Current Password */}
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                Current Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type={showCurrent ? "text" : "password"}
                  value={pwData.currentPassword}
                  onChange={(e) =>
                    setPwData((p) => ({ ...p, currentPassword: e.target.value }))
                  }
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-10 text-xs text-slate-900 outline-none focus:border-sky-600 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCurrent ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type={showNew ? "text" : "password"}
                  value={pwData.newPassword}
                  onChange={(e) =>
                    setPwData((p) => ({ ...p, newPassword: e.target.value }))
                  }
                  placeholder="Min 8 characters"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-10 text-xs text-slate-900 outline-none focus:border-sky-600 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNew ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type={showConfirm ? "text" : "password"}
                  value={pwData.confirmPassword}
                  onChange={(e) =>
                    setPwData((p) => ({ ...p, confirmPassword: e.target.value }))
                  }
                  placeholder="Re-enter new password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-10 text-xs text-slate-900 outline-none focus:border-sky-600 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingPw}
              className="flex items-center gap-2 rounded-xl bg-purple-700 px-7 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-700/20 hover:bg-purple-800 disabled:opacity-50 transition cursor-pointer"
            >
              <KeyRound className="h-4 w-4" />
              {savingPw ? "Changing..." : "Change Password"}
            </button>
          </div>
        </div>
      </form>

      {/* ── Security Modal for Email Change Confirmation ── */}
      {emailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    Security Verification
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Confirm changing your admin email address
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEmailModalOpen(false);
                  setEmailVerifyPassword("");
                  setEmailVerifyError("");
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-2xl bg-amber-50/70 border border-amber-200/60 p-3.5 text-xs text-amber-900 space-y-1">
              <p className="font-bold">You are changing your admin login email to:</p>
              <p className="font-mono text-sky-800 bg-white/70 px-2 py-1 rounded-md border border-amber-200/50 break-all font-semibold">
                {formData.email.trim()}
              </p>
              <p className="text-[11px] text-amber-700 pt-1">
                Please enter your current password to authorize this security update.
              </p>
            </div>

            {emailVerifyError && (
              <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{emailVerifyError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmEmailChange} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type={showEmailVerifyPw ? "text" : "password"}
                    autoFocus
                    value={emailVerifyPassword}
                    onChange={(e) => setEmailVerifyPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-10 text-xs text-slate-900 outline-none focus:border-sky-600 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmailVerifyPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showEmailVerifyPw ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmailModalOpen(false);
                    setEmailVerifyPassword("");
                    setEmailVerifyError("");
                  }}
                  disabled={emailVerifying}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={emailVerifying}
                  className="flex items-center gap-2 rounded-xl bg-sky-700 px-5 py-2 text-xs font-bold text-white hover:bg-sky-800 disabled:opacity-50 shadow-md shadow-sky-700/20"
                >
                  <ShieldCheck className="h-4 w-4" />
                  {emailVerifying ? "Verifying & Updating..." : "Confirm & Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
