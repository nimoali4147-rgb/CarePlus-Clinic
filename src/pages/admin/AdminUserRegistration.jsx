import React, { useState, useEffect, useRef } from "react";
import {
  UserPlus,
  ShieldCheck,
  Mail,
  Lock,
  User,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Trash2,
  Search,
  Users,
  Calendar,
  X,
  Edit2,
  Pencil,
  RotateCcw,
} from "lucide-react";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { db, secondaryAuth } from "../../lib/firebase";
import { processImageFile, MAX_IMAGE_SIZE_MB } from "../../lib/imageUtils";
import { validateFullName, validateEmail } from "../../lib/validationUtils";
import { useAuth } from "../../context/AuthContext";

export default function AdminUserRegistration() {
  const { currentUser, refreshUserProfile } = useAuth();
  const fileInputRef = useRef(null);
  const formRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    image: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [editingUser, setEditingUser] = useState(null);

  // Admin Users List State
  const [adminUsers, setAdminUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null });
  const [deleting, setDeleting] = useState(false);

  // Listen to admin users in real time
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        const admins = all.filter(
          (u) => (u.role || "").toLowerCase() === "admin"
        );
        // Sort newest first
        admins.sort((a, b) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return tB - tA;
        });
        setAdminUsers(admins);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching admin users:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // Handle local image file selection from computer
  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await processImageFile(file, { maxSizeMB: MAX_IMAGE_SIZE_MB });
    if (!result.success) {
      setFeedback({
        type: "error",
        message: result.error,
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setPreviewImage(result.base64);
    setFormData((prev) => ({ ...prev, image: result.base64 }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveImage = () => {
    setPreviewImage("");
    setFormData((prev) => ({ ...prev, image: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Start editing an administrator
  const handleStartEdit = (user) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName || "",
      email: user.email || "",
      password: "",
      image: user.image || user.profileImage || "",
    });
    setPreviewImage(user.image || user.profileImage || "");
    setFeedback({ type: "", message: "" });
    // Scroll smoothly to form
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Cancel editing mode
  const handleCancelEdit = () => {
    setEditingUser(null);
    setFormData({
      fullName: "",
      email: "",
      password: "",
      image: "",
    });
    setPreviewImage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Submit Form (handles both Create and Update)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFeedback({ type: "", message: "" });

    // Validation
    const nameErr = validateFullName(formData.fullName);
    if (nameErr) {
      setFeedback({ type: "error", message: nameErr });
      return;
    }

    const emailErr = validateEmail(formData.email);
    if (emailErr) {
      setFeedback({ type: "error", message: emailErr });
      return;
    }

    // UPDATE MODE
    if (editingUser) {

      setSubmitting(true);
      try {
        await updateDoc(doc(db, "users", editingUser.id), {
          fullName: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          image: formData.image || "",
          updatedAt: serverTimestamp(),
        });

        if (currentUser?.uid === editingUser.id && refreshUserProfile) {
          await refreshUserProfile();
        }

        setFeedback({
          type: "success",
          message: `Administrator "${formData.fullName.trim()}" has been updated successfully!`,
        });
        handleCancelEdit();
        setTimeout(() => setFeedback({ type: "", message: "" }), 5000);
      } catch (err) {
        console.error("Error updating admin user:", err);
        setFeedback({
          type: "error",
          message: "Failed to update administrator: " + err.message,
        });
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // CREATE MODE
    if (!formData.email.trim()) {
      setFeedback({ type: "error", message: "Please enter a valid email address." });
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setFeedback({
        type: "error",
        message: "Password must be at least 6 characters long.",
      });
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create user in Firebase Auth via isolated secondaryAuth
      const cred = await createUserWithEmailAndPassword(
        secondaryAuth,
        formData.email.trim(),
        formData.password
      );
      const newUid = cred.user.uid;

      // 2. Create User document in Firestore with role="admin"
      await setDoc(doc(db, "users", newUid), {
        uid: newUid,
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        role: "admin",
        image: formData.image || "",
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 3. Immediately sign out secondary auth to clean up
      await signOut(secondaryAuth);

      // 4. Success feedback and reset form
      setFeedback({
        type: "success",
        message: `Admin user "${formData.fullName.trim()}" has been registered successfully with Super Admin privileges!`,
      });
      handleCancelEdit();
      setTimeout(() => setFeedback({ type: "", message: "" }), 6000);
    } catch (err) {
      console.error("Admin registration error:", err);
      let msg = err.message;
      if (err.code === "auth/email-already-in-use") {
        msg = "This email is already registered in the system.";
      } else if (err.code === "auth/invalid-email") {
        msg = "The provided email address is invalid.";
      } else if (err.code === "auth/weak-password") {
        msg = "Password should be at least 6 characters.";
      }
      setFeedback({ type: "error", message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Admin User Handler (cascade: removes notifications too)
  const handleDeleteAdmin = async () => {
    if (!deleteModal.user) return;
    setDeleting(true);
    try {
      const userId = deleteModal.user.id;

      // 1. Delete all notifications linked to this user
      const notifsQuery = query(collection(db, "notifications"), where("userId", "==", userId));
      const notifsSnap = await getDocs(notifsQuery);
      if (!notifsSnap.empty) {
        const notifBatch = writeBatch(db);
        notifsSnap.forEach((d) => notifBatch.delete(d.ref));
        await notifBatch.commit();
      }

      // 2. Delete the user document
      await deleteDoc(doc(db, "users", userId));

      setFeedback({
        type: "success",
        message: `Admin user "${deleteModal.user.fullName || deleteModal.user.email}" removed successfully.`,
      });
      setDeleteModal({ open: false, user: null });
      if (editingUser?.id === userId) {
        handleCancelEdit();
      }
      setTimeout(() => setFeedback({ type: "", message: "" }), 4000);
    } catch (err) {
      console.error("Error deleting admin user:", err);
      setFeedback({
        type: "error",
        message: "Failed to delete admin user: " + err.message,
      });
    } finally {
      setDeleting(false);
    }
  };

  const filteredAdmins = adminUsers.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.fullName || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-extrabold text-purple-800 mb-2">
            <ShieldCheck className="h-3.5 w-3.5 text-purple-700" />
            Super Admin Access Management
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            User Registration & Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Register, edit, and manage authorized clinic administrators with Super Admin privileges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-purple-50 px-3.5 py-1.5 text-xs font-bold text-purple-700 border border-purple-100">
            {adminUsers.length} Active Administrator{adminUsers.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback.message && (
        <div
          className={`flex items-start gap-3 rounded-2xl p-4 text-xs font-semibold border transition-all animate-in fade-in ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Grid: Form on Left + Admin Directory on Right */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Registration & Edit Form (5 cols on large) */}
        <div className="lg:col-span-5" ref={formRef}>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl shadow-sm ${
                    editingUser
                      ? "bg-amber-100 text-amber-700"
                      : "bg-purple-100 text-purple-700"
                  }`}
                >
                  {editingUser ? <Pencil className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingUser ? "Edit Administrator" : "Register New Administrator"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingUser
                      ? `Updating ${editingUser.fullName || editingUser.email}`
                      : "Enter administrator details and upload photo"}
                  </p>
                </div>
              </div>

              {editingUser && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Computer Image Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Profile Photo (Upload from Computer)
                </label>

                {previewImage ? (
                  <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="h-16 w-16 rounded-xl object-cover border-2 border-purple-600 shadow-sm shrink-0"
                    />
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        Photo Loaded
                      </p>
                      <p className="text-[11px] text-emerald-600 font-semibold">
                        ✓ Ready to save with administrator
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[11px] font-bold text-purple-700 hover:text-purple-800 hover:underline cursor-pointer"
                        >
                          Change Photo
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                        >
                          Remove Photo
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-6 text-center hover:border-purple-500 hover:bg-purple-50/30 transition cursor-pointer group"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 group-hover:scale-110 transition shrink-0 mb-2">
                      <Upload className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-700">
                      Click to browse image from computer
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Supports PNG, JPG, WEBP (Max 5MB)
                    </p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    placeholder="e.g. Dr. Ahmed Hassan"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs outline-none focus:border-purple-600 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="admin@careplus.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs outline-none focus:border-purple-600 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Password (Only in create mode) */}
              {!editingUser && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Account Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      placeholder="Minimum 6 characters"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-10 text-xs outline-none focus:border-purple-600 focus:bg-white transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Assigned Role (Fixed as Super Admin) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Assigned System Role
                </label>
                <div className="flex items-center justify-between rounded-xl border border-purple-200 bg-purple-50/60 p-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-purple-700" />
                    <div>
                      <p className="text-xs font-bold text-purple-900 leading-tight">
                        SUPER ADMIN
                      </p>
                      <p className="text-[10px] text-purple-600">
                        Full Super Admin Control & Operational Privileges
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-purple-600 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                    SUPER ADMIN
                  </span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold text-white shadow-lg transition cursor-pointer disabled:opacity-50 ${
                    editingUser
                      ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
                      : "bg-purple-600 hover:bg-purple-700 shadow-purple-600/20"
                  }`}
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>{editingUser ? "Updating..." : "Registering..."}</span>
                    </>
                  ) : (
                    <>
                      {editingUser ? <Pencil className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                      <span>{editingUser ? "Update Administrator" : "Register Admin User"}</span>
                    </>
                  )}
                </button>

                {editingUser && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Existing Admin Directory (7 cols on large) */}
        <div className="lg:col-span-7">
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 p-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Registered Administrators ({adminUsers.length})
                </h3>
                <p className="text-xs text-slate-400">
                  Authorized accounts with Super Admin privileges
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search administrators..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-1.5 pl-9 pr-3 text-xs outline-none focus:border-purple-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/60 border-b border-slate-100 text-slate-500 text-[11px] uppercase font-bold tracking-wider">
                    <th className="px-6 py-4">Administrator</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-slate-400">
                        Loading administrators...
                      </td>
                    </tr>
                  ) : filteredAdmins.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-slate-400">
                        No administrator accounts found.
                      </td>
                    </tr>
                  ) : (
                    filteredAdmins.map((u) => {
                      const isMe = currentUser?.uid === u.id || currentUser?.email === u.email;
                      const isEditingThis = editingUser?.id === u.id;
                      return (
                        <tr
                          key={u.id}
                          className={`transition ${
                            isEditingThis ? "bg-amber-50/60" : "hover:bg-slate-50/80"
                          }`}
                        >
                          {/* Admin Identity */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {u.image ? (
                                <img
                                  src={u.image}
                                  alt={u.fullName}
                                  className="h-10 w-10 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 font-extrabold text-xs shadow-xs shrink-0">
                                  {(u.fullName || "A").charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{u.fullName || "Administrator"}</span>
                                  {isMe && (
                                    <span className="rounded-md bg-purple-100 px-1.5 py-0.2 text-[9px] font-bold text-purple-700">
                                      You
                                    </span>
                                  )}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  Status: {u.status || "Active"}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="px-6 py-4 text-slate-600 font-medium">
                            {u.email}
                          </td>

                          {/* Role */}
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-purple-800">
                              <ShieldCheck className="h-3 w-3 text-purple-700" />
                              SUPER ADMIN
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* Edit Button */}
                              <button
                                onClick={() => handleStartEdit(u)}
                                className={`inline-flex items-center gap-1 rounded-xl p-2 transition cursor-pointer ${
                                  isEditingThis
                                    ? "bg-amber-600 text-white"
                                    : "text-purple-600 hover:bg-purple-50"
                                }`}
                                title="Edit Administrator"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>

                              {/* Delete Button (disabled for self) */}
                              {!isMe && (
                                <button
                                  onClick={() =>
                                    setDeleteModal({ open: true, user: u })
                                  }
                                  className="inline-flex items-center gap-1 rounded-xl p-2 text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                                  title="Remove Administrator"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.open && deleteModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Remove Administrator
                </h3>
                <p className="text-xs text-slate-500">
                  Revoke administrative privileges
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove{" "}
              <strong className="text-slate-900">
                {deleteModal.user.fullName || deleteModal.user.email}
              </strong>{" "}
              from the administrator system? This account will lose all Super Admin access.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, user: null })}
                disabled={deleting}
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAdmin}
                disabled={deleting}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 transition cursor-pointer disabled:opacity-50"
              >
                {deleting ? "Removing..." : "Confirm Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
