import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Stethoscope,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Edit,
  ExternalLink,
  ShieldCheck,
  Calendar,
  AlertCircle,
} from "lucide-react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import DeleteConfirmModal from "../../components/ui/DeleteConfirmModal";

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({ open: false, doctor: null });
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "doctors"), (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setDoctors(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const toggleStatus = async (doctorId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      await updateDoc(doc(db, "doctors", doctorId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "users", doctorId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      setFeedback({
        type: "success",
        message: `Doctor status updated to ${newStatus}.`,
      });
      setTimeout(() => setFeedback({ type: "", message: "" }), 3000);
    } catch (err) {
      console.error("Error toggling doctor status:", err);
      setFeedback({ type: "error", message: "Failed to update status: " + err.message });
    }
  };

  const handleDeleteDoctor = (docItem) => {
    setDeleteModal({ open: true, doctor: docItem });
  };

  const confirmDeleteDoctor = async () => {
    if (!deleteModal.doctor) return;
    setDeleting(true);
    try {
      const doctorId = deleteModal.doctor.id;
      const doctorEmail = deleteModal.doctor.email || "";

      // 1. Delete all appointments linked to this doctor (by doctorId or doctorEmail)
      const q1 = query(collection(db, "appointments"), where("doctorId", "==", doctorId));
      const q2 = query(collection(db, "appointments"), where("doctorEmail", "==", doctorEmail));
      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

      // Deduplicate by doc id so we don't double-delete
      const seenIds = new Set();
      const apptBatch = writeBatch(db);
      [...snap1.docs, ...snap2.docs].forEach((d) => {
        if (!seenIds.has(d.id)) {
          seenIds.add(d.id);
          apptBatch.delete(d.ref);
        }
      });
      await apptBatch.commit();

      // 2. Delete doctor profile & user record
      await deleteDoc(doc(db, "doctors", doctorId));
      await deleteDoc(doc(db, "users", doctorId));

      setFeedback({
        type: "success",
        message: `Dr. ${deleteModal.doctor.fullName || "Doctor"} and ${seenIds.size} related appointment(s) were deleted successfully.`,
      });
      setDeleteModal({ open: false, doctor: null });
      setTimeout(() => setFeedback({ type: "", message: "" }), 4000);
    } catch (err) {
      console.error("Error deleting doctor:", err);
      setFeedback({ type: "error", message: "Failed to delete doctor: " + err.message });
    } finally {
      setDeleting(false);
    }
  };

  const specialties = ["All", ...new Set(doctors.map((d) => d.specialization).filter(Boolean))];

  const filteredDoctors = doctors.filter((docItem) => {
    const matchesSearch =
      (docItem.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
      (docItem.specialization || "").toLowerCase().includes(search.toLowerCase()) ||
      (docItem.email || "").toLowerCase().includes(search.toLowerCase());

    const matchesSpecialty = specialtyFilter === "All" || docItem.specialization === specialtyFilter;
    const matchesStatus = statusFilter === "All" || docItem.status === statusFilter;

    return matchesSearch && matchesSpecialty && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Doctors Directory
          </h2>
          <p className="text-xs text-slate-500">
            Manage clinic practitioners, clinical specializations, consultation fees, and account status.
          </p>
        </div>
        <Link
          to="/admin/doctors/new"
          className="inline-flex items-center gap-2 rounded-xl bg-sky-700 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-700/20 hover:bg-sky-800 transition cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          Add New Doctor
        </Link>
      </div>

      {/* Feedback Banner */}
      {feedback.message && (
        <div
          className={`flex items-start gap-3 rounded-2xl p-4 text-xs font-semibold border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search doctors by name, email, or specialty..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-xs text-slate-900 outline-none focus:border-sky-600 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Specialty Filter */}
          <select
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-sky-600"
          >
            {specialties.map((s) => (
              <option key={s} value={s}>
                {s === "All" ? "All Specialties" : s}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-sky-600"
          >
            <option value="All">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Doctors Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">Doctor Profile</th>
                <th className="px-6 py-4">Specialty</th>
                <th className="px-6 py-4">Room & Fee</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    Loading doctors directory...
                  </td>
                </tr>
              ) : filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No doctors found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredDoctors.map((docItem) => (
                  <tr key={docItem.id} className="hover:bg-slate-50/70 transition">
                    {/* Doctor Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={docItem.image || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=100&auto=format&fit=crop&q=80"}
                          alt={docItem.fullName}
                          className="h-10 w-10 rounded-xl object-cover border border-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{docItem.fullName}</p>
                          <p className="text-[11px] text-slate-400">{docItem.qualification || "Medical Practitioner"}</p>
                        </div>
                      </div>
                    </td>

                    {/* Specialty */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-700">
                        <Stethoscope className="h-3 w-3" />
                        {docItem.specialization || "General"}
                      </span>
                    </td>

                    {/* Room & Fee */}
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">${docItem.consultationFee || 50}</p>
                      <p className="text-[11px] text-slate-400">Room {docItem.roomNumber || "101"}</p>
                    </td>

                    {/* Contact */}
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-700">{docItem.email}</p>
                      <p className="text-[11px] text-slate-400">{docItem.phone || "No phone"}</p>
                    </td>

                    {/* Status Toggle */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleStatus(docItem.id, docItem.status)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase transition cursor-pointer ${
                          docItem.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                        }`}
                        title="Click to toggle status"
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            docItem.status === "active" ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                        />
                        {docItem.status === "active" ? "Active" : "Inactive"}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/admin/doctors/${docItem.id}/edit`}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-sky-50 hover:text-sky-700 transition"
                          title="Edit doctor profile"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteDoctor(docItem)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                          title="Delete doctor"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, doctor: null })}
        onConfirm={confirmDeleteDoctor}
        isLoading={deleting}
        title="Delete Doctor Account?"
        subtitle="This action cannot be undone and will permanently remove records."
        description={
          deleteModal.doctor ? (
            <>
              <p className="font-bold">
                Doctor: {deleteModal.doctor.fullName}
              </p>
              <p className="text-slate-600">
                Specialization: {deleteModal.doctor.specialization || "General"} • Email: {deleteModal.doctor.email}
              </p>
            </>
          ) : null
        }
      />
    </div>
  );
}
