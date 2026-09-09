import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Phone,
  Calendar,
  Mail,
  Save,
  CheckCircle2,
  AlertCircle,
  Upload,
  Camera,
  X,
  Lock,
  ShieldAlert,
} from "lucide-react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  verifyBeforeUpdateEmail,
} from "firebase/auth";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { processImageFile, MAX_IMAGE_SIZE_MB } from "../../lib/imageUtils";
import { validateFullName, validateEmail, validatePhone } from "../../lib/validationUtils";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function PatientProfile() {
  const { currentUser, userProfile, refreshUserProfile } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    gender: "Male",
    dateOfBirth: "",
  });
  const [initialEmail, setInitialEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Email change confirmation modal state
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailVerifyPassword, setEmailVerifyPassword] = useState("");
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [emailVerifyError, setEmailVerifyError] = useState("");

  // Image upload state
  const [previewImage, setPreviewImage] = useState(null);
  const [imageBase64, setImageBase64] = useState("");
  const [imageProcessing, setImageProcessing] = useState(false);
  const [imageError, setImageError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (userProfile) {
      const emailVal = userProfile.email || currentUser?.email || "";
      setFormData({
        fullName: userProfile.fullName || "",
        email: emailVal,
        phone: userProfile.phone || "",
        gender: userProfile.gender || "Male",
        dateOfBirth: userProfile.dateOfBirth || "",
      });
      setInitialEmail(emailVal);
      if (userProfile.image) {
        setPreviewImage(userProfile.image);
        setImageBase64(userProfile.image);
      }
    }
  }, [userProfile, currentUser]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Image file upload handler with instant validation and fast compression
  const handleImageFileChange = async (e) => {
    setImageError("");
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;

    setImageProcessing(true);
    const result = await processImageFile(file, { maxSizeMB: MAX_IMAGE_SIZE_MB });
    setImageProcessing(false);

    if (!result.success) {
      setImageError(result.error);
      setError(result.error);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setPreviewImage(result.base64);
    setImageBase64(result.base64);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveImage = () => {
    setPreviewImage(null);
    setImageBase64("");
    setImageError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (imageError) {
      setError(imageError);
      return;
    }

    // Safety check: prevent saving oversized base64 images
    if (imageBase64 && imageBase64.length > 500 * 1024) {
      const err = `Selected image is too large. Maximum allowed size is ${MAX_IMAGE_SIZE_MB}MB.`;
      setImageError(err);
      setError(err);
      return;
    }

    const newEmail = formData.email.trim().toLowerCase();
    const currentAuthEmail = (currentUser?.email || initialEmail || "").toLowerCase();

    // If email is being changed, open password re-authentication modal to update Firebase Auth
    if (newEmail && newEmail !== currentAuthEmail) {
      setEmailVerifyPassword("");
      setEmailVerifyError("");
      setEmailModalOpen(true);
      return;
    }

    // Normal profile update without email change
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        image: imageBase64 || "",
        updatedAt: serverTimestamp(),
      });
      if (refreshUserProfile) await refreshUserProfile();
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError("Failed to update profile: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Re-authenticate and update email in Firebase Auth AND Firestore
  const handleConfirmEmailChange = async (e) => {
    e.preventDefault();
    setEmailVerifyError("");

    if (!emailVerifyPassword) {
      setEmailVerifyError("Please enter your current account password to confirm.");
      return;
    }

    if (imageError) {
      setEmailVerifyError(imageError);
      return;
    }

    if (imageBase64 && imageBase64.length > 500 * 1024) {
      setEmailVerifyError(`Selected image is too large. Maximum allowed size is ${MAX_IMAGE_SIZE_MB}MB.`);
      return;
    }

    setEmailVerifying(true);
    const newEmail = formData.email.trim().toLowerCase();
    const oldEmail = currentUser?.email || initialEmail;

    try {
      // 1. Re-authenticate user in Firebase Auth with current password
      const credential = EmailAuthProvider.credential(oldEmail, emailVerifyPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);

      // 2. Update real login email in Firebase Auth
      try {
        await updateEmail(auth.currentUser, newEmail);
      } catch (authErr) {
        if (authErr.code === "auth/operation-not-allowed") {
          await verifyBeforeUpdateEmail(auth.currentUser, newEmail);
        } else {
          throw authErr;
        }
      }

      // 3. Update Firestore user document
      await updateDoc(doc(db, "users", currentUser.uid), {
        fullName: formData.fullName.trim(),
        email: newEmail,
        phone: formData.phone.trim(),
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        image: imageBase64 || "",
        updatedAt: serverTimestamp(),
      });

      // 4. Cascade update all patient's appointments across the clinic
      try {
        const apptsQuery = query(
          collection(db, "appointments"),
          where("userId", "==", currentUser.uid)
        );
        const apptsSnap = await getDocs(apptsQuery);
        const apptUpdates = apptsSnap.docs.map((aDoc) =>
          updateDoc(doc(db, "appointments", aDoc.id), {
            patientEmail: newEmail,
            updatedAt: serverTimestamp(),
          })
        );
        await Promise.all(apptUpdates);
      } catch (apptErr) {
        console.warn("Could not cascade email to appointments:", apptErr);
      }

      // 5. Cascade update all notifications for this patient
      try {
        const notifsQuery = query(
          collection(db, "notifications"),
          where("userId", "==", currentUser.uid)
        );
        const notifsSnap = await getDocs(notifsQuery);
        const notifUpdates = notifsSnap.docs.map((nDoc) =>
          updateDoc(doc(db, "notifications", nDoc.id), {
            recipientEmail: newEmail,
          })
        );
        await Promise.all(notifUpdates);
      } catch (notifErr) {
        console.warn("Could not cascade email to notifications:", notifErr);
      }

      // 6. Refresh context and state
      if (refreshUserProfile) await refreshUserProfile();
      setInitialEmail(newEmail);
      setEmailModalOpen(false);
      setEmailVerifyPassword("");
      setSuccess(`Profile and login email updated successfully! Your new login email is: ${newEmail}`);
      setTimeout(() => setSuccess(""), 6000);
    } catch (err) {
      console.error("Email update error:", err);
      if (
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        setEmailVerifyError("Incorrect password. Please verify your current password.");
      } else if (err.code === "auth/email-already-in-use") {
        setEmailVerifyError("This email is already registered to another account. Please choose a different email.");
      } else if (err.code === "auth/invalid-email") {
        setEmailVerifyError("Invalid email format. Please provide a valid email address.");
      } else {
        setEmailVerifyError(err.message || "Failed to update email.");
      }
    } finally {
      setEmailVerifying(false);
    }
  };

  const initials = (formData.fullName || "U").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <div>
        <Navbar hideHero={true} />

        <main className="mx-auto max-w-3xl px-6 py-10 lg:px-8 space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Patient Profile & Preferences
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Keep your contact details, login email, and patient information up to date.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-2xl bg-rose-50 p-4 text-xs font-semibold text-rose-700 border border-rose-100">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-700 border border-emerald-100">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Photo Section */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Profile Photo
              </h3>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative group">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt="Profile preview"
                      className="h-24 w-24 rounded-3xl object-cover border-2 border-sky-300 shadow-md"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-sky-700 text-3xl font-black text-white shadow-md">
                      {initials}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-xl bg-sky-700 text-white shadow-md hover:bg-sky-800 transition cursor-pointer"
                    title="Upload photo"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageFileChange}
                    accept="image/*"
                    className="hidden"
                  />

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                    <button
                      type="button"
                      disabled={imageProcessing}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-xl bg-sky-50 px-4 py-2 text-xs font-bold text-sky-700 border border-sky-200 hover:bg-sky-100 transition cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>{imageProcessing ? "Processing..." : previewImage ? "Change Photo" : "Upload Photo"}</span>
                    </button>

                    {previewImage && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 px-3 py-2 rounded-xl hover:bg-rose-50 transition cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Remove Photo</span>
                      </button>
                    )}
                  </div>

                  {imageError ? (
                    <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                      <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                      <span>{imageError}</span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400">
                      JPG, PNG or WEBP up to {MAX_IMAGE_SIZE_MB}MB. Photo will appear on your appointments and top navbar.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Personal Details Section */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">
                  Email Address (Login ID) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 p-2.5 pl-10 outline-none focus:border-sky-600 font-medium text-slate-800"
                  />
                </div>
                {formData.email.trim().toLowerCase() !== initialEmail.toLowerCase() && (
                  <p className="text-[11px] text-sky-700 font-semibold mt-1">
                    ℹ️ Changing your email will update your login credentials. You will be asked to confirm your password.
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-sky-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-sky-600"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-sky-600"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-sky-700 px-8 py-3 text-xs font-bold text-white shadow-lg shadow-sky-700/20 hover:bg-sky-800 disabled:opacity-50 transition cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? "Saving..." : "Save Profile"}</span>
              </button>
            </div>
          </form>
        </main>
      </div>

      {/* Re-authentication modal for Email Change */}
      {emailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                  <Lock className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900">
                  Confirm Email Address Change
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEmailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-2xl bg-sky-50/70 p-3 text-xs text-sky-950 space-y-1">
              <p>
                Old Login Email: <span className="font-bold">{initialEmail}</span>
              </p>
              <p>
                New Login Email: <span className="font-black text-sky-700">{formData.email}</span>
              </p>
            </div>

            <p className="text-xs text-slate-500">
              For security, please enter your current account password to update your login email in Firebase Authentication. Once changed, your old email will no longer be able to log in.
            </p>

            {emailVerifyError && (
              <div className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-100">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{emailVerifyError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmEmailChange} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                  Current Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={emailVerifyPassword}
                  onChange={(e) => setEmailVerifyPassword(e.target.value)}
                  placeholder="Enter your current password"
                  required
                  autoFocus
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-sky-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={emailVerifying}
                  onClick={() => setEmailModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={emailVerifying}
                  className="flex items-center gap-2 rounded-xl bg-sky-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-700/20 hover:bg-sky-800 disabled:opacity-50 transition cursor-pointer"
                >
                  {emailVerifying ? "Verifying & Updating..." : "Confirm & Update Email"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
