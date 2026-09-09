import React, { useState, useEffect } from "react";
import {
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  CheckCheck,
  Trash2,
  Edit,
  User,
  Stethoscope,
  X,
  AlertCircle,
} from "lucide-react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { notifyAppointmentApproved } from "../../lib/notificationService";
import DeleteConfirmModal from "../../components/ui/DeleteConfirmModal";

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [loading, setLoading] = useState(true);

  // Edit / Note modal state
  const [editingAppt, setEditingAppt] = useState(null);
  const [editStatus, setEditStatus] = useState("");
  const [editAdminNote, setEditAdminNote] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    type: "single", // 'single' | 'all'
    appt: null,
  });
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  useEffect(() => {
    // 1. Listen to all appointments
    const unsubAppts = onSnapshot(collection(db, "appointments"), (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAppointments(list);
      setLoading(false);
    });

    // 2. Fetch doctors for filter dropdown
    const unsubDocs = onSnapshot(collection(db, "doctors"), (snapshot) => {
      const docList = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setDoctors(docList);
    });

    // 3. Fetch users to get patient images
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      setUsers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubAppts();
      unsubDocs();
      unsubUsers();
    };
  }, []);

  const updateStatus = async (apptId, newStatus) => {
    try {
      const appt = appointments.find((a) => a.id === apptId);
      await updateDoc(doc(db, "appointments", apptId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      if (newStatus === "approved" && appt) {
        notifyAppointmentApproved({
          ...appt,
          id: apptId,
          status: "approved",
        });
      }

      setFeedback({
        type: "success",
        message: `Appointment status updated to ${newStatus}.`,
      });
      setTimeout(() => setFeedback({ type: "", message: "" }), 3000);
    } catch (err) {
      console.error("Error updating appointment status:", err);
      setFeedback({ type: "error", message: "Failed to update status: " + err.message });
    }
  };

  const handleDeleteTrigger = (appt) => {
    setDeleteModal({ open: true, type: "single", appt });
  };

  const handleDeleteAllTrigger = () => {
    if (appointments.length === 0) return;
    setDeleteModal({ open: true, type: "all", appt: null });
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      if (deleteModal.type === "single" && deleteModal.appt) {
        await deleteDoc(doc(db, "appointments", deleteModal.appt.id));
        setFeedback({
          type: "success",
          message: `Appointment for ${deleteModal.appt.patientName || "Patient"} was deleted successfully.`,
        });
      } else if (deleteModal.type === "all") {
        const batch = writeBatch(db);
        appointments.forEach((a) => {
          batch.delete(doc(db, "appointments", a.id));
        });
        await batch.commit();
        setFeedback({
          type: "success",
          message: `All ${appointments.length} appointments were deleted successfully.`,
        });
      }
      setDeleteModal({ open: false, type: "single", appt: null });
      setTimeout(() => setFeedback({ type: "", message: "" }), 4000);
    } catch (err) {
      console.error("Error deleting appointment(s):", err);
      setFeedback({ type: "error", message: "Failed to delete: " + err.message });
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveModal = async (e) => {
    e.preventDefault();
    if (!editingAppt) return;
    try {
      await updateDoc(doc(db, "appointments", editingAppt.id), {
        status: editStatus,
        adminNote: editAdminNote,
        date: editDate || editingAppt.date,
        time: editTime || editingAppt.time,
        updatedAt: serverTimestamp(),
      });

      if (editStatus === "approved" && editingAppt.status !== "approved") {
        notifyAppointmentApproved({
          ...editingAppt,
          status: "approved",
          date: editDate || editingAppt.date,
          time: editTime || editingAppt.time,
        });
      }

      setEditingAppt(null);
      setFeedback({
        type: "success",
        message: "Appointment details updated successfully!",
      });
      setTimeout(() => setFeedback({ type: "", message: "" }), 3000);
    } catch (err) {
      console.error("Error saving appointment details:", err);
      setFeedback({ type: "error", message: "Failed to save changes: " + err.message });
    }
  };

  const openEditModal = (appt) => {
    setEditingAppt(appt);
    setEditStatus(appt.status || "pending");
    setEditAdminNote(appt.adminNote || "");
    setEditDate(appt.date || "");
    setEditTime(appt.time || "");
  };

  const filteredAppointments = appointments.filter((appt) => {
    const term = search.toLowerCase();
    const matchesSearch =
      (appt.patientName || "").toLowerCase().includes(term) ||
      (appt.doctorName || appt.doctor || "").toLowerCase().includes(term) ||
      (appt.reason || "").toLowerCase().includes(term) ||
      (appt.specialty || "").toLowerCase().includes(term);

    const matchesDoctor =
      doctorFilter === "All" ||
      appt.doctorName === doctorFilter ||
      appt.doctor === doctorFilter;

    const matchesStatus =
      statusFilter === "All" ||
      (appt.status || "").toLowerCase() === statusFilter.toLowerCase();

    const matchesDate = !dateFilter || appt.date === dateFilter;

    return matchesSearch && matchesDoctor && matchesStatus && matchesDate;
  });

  // Build patient image lookup map from users
  const patientImageMap = {};
  users.forEach((u) => {
    if (u.image) patientImageMap[u.id] = u.image;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Appointment Management
          </h2>
          <p className="text-xs text-slate-500">
            Review patient requests, approve or reject consultation slots, reschedule appointments, and track treatment lifecycle.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-sky-50 px-3.5 py-1 text-xs font-bold text-sky-700 border border-sky-100">
            {appointments.length} Total Appointments
          </span>

          {appointments.length > 0 && (
            <button
              onClick={handleDeleteAllTrigger}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
              title="Delete all appointments"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete All Appointments
            </button>
          )}
        </div>
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

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient name, doctor, reason, or symptoms..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-xs text-slate-900 outline-none focus:border-sky-600 focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Doctor Filter */}
          <select
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-sky-600"
          >
            <option value="All">All Doctors</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.fullName}>
                {d.fullName}
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
            <option value="pending">Pending Verification</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Date Filter */}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-sky-600"
          />

          {(doctorFilter !== "All" || statusFilter !== "All" || dateFilter || search) && (
            <button
              onClick={() => {
                setDoctorFilter("All");
                setStatusFilter("All");
                setDateFilter("");
                setSearch("");
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 transition cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Appointments Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">Patient</th>
                <th className="px-6 py-4">Doctor & Specialty</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Reason / Notes</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    Loading appointments...
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No appointments found matching your search or filters.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-50/70 transition">
                    {/* Patient */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {(() => {
                          const pImg = patientImageMap[appt.userId] || patientImageMap[appt.patientId];
                          return pImg ? (
                            <img
                              src={pImg}
                              alt={appt.patientName || "Patient"}
                              className="h-9 w-9 rounded-xl object-cover border border-sky-200 shrink-0"
                            />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 font-bold text-xs text-sky-700 shrink-0">
                              {(appt.patientName || "P").charAt(0).toUpperCase()}
                            </div>
                          );
                        })()}
                        <div>
                          <p className="font-bold text-slate-900">{appt.patientName || "Patient"}</p>
                          <p className="text-[11px] text-slate-400">{appt.patientPhone || appt.patientEmail || "No contact"}</p>
                        </div>
                      </div>
                    </td>

                    {/* Doctor */}
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">Dr. {appt.doctorName || appt.doctor || "Assigned Doctor"}</p>
                      <span className="inline-flex items-center gap-1 text-[11px] text-sky-700">
                        <Stethoscope className="h-3 w-3" />
                        {appt.specialty || "General"}
                      </span>
                    </td>

                    {/* Date & Time */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {appt.date}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {appt.time}
                      </div>
                    </td>

                    {/* Reason / Admin Note */}
                    <td className="px-6 py-4 max-w-xs">
                      <p className="font-semibold text-slate-800 truncate" title={appt.reason}>
                        {appt.reason || "General Consultation"}
                      </p>
                      {appt.adminNote && (
                        <p className="text-[11px] text-amber-700 bg-amber-50 rounded-md px-1.5 py-0.5 mt-1 truncate border border-amber-200/60" title={appt.adminNote}>
                          Note: {appt.adminNote}
                        </p>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                          appt.status === "approved" || appt.status === "confirmed"
                            ? "bg-blue-100 text-blue-800 border border-blue-200"
                            : appt.status === "completed"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : appt.status === "rejected" || appt.status === "cancelled"
                            ? "bg-rose-100 text-rose-800 border border-rose-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            appt.status === "approved" || appt.status === "confirmed"
                              ? "bg-blue-600"
                              : appt.status === "completed"
                              ? "bg-emerald-600"
                              : appt.status === "rejected" || appt.status === "cancelled"
                              ? "bg-rose-600"
                              : "bg-amber-600"
                          }`}
                        />
                        {appt.status || "pending"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick Approve button if pending */}
                        {appt.status === "pending" && (
                          <button
                            onClick={() => updateStatus(appt.id, "approved")}
                            className="rounded-lg bg-sky-50 p-1.5 text-sky-700 hover:bg-sky-100 transition cursor-pointer"
                            title="Approve Appointment"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}

                        {/* Quick Reject button if pending */}
                        {appt.status === "pending" && (
                          <button
                            onClick={() => updateStatus(appt.id, "rejected")}
                            className="rounded-lg bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                            title="Reject Appointment"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}

                        {/* Quick Complete button if approved */}
                        {(appt.status === "approved" || appt.status === "confirmed") && (
                          <button
                            onClick={() => updateStatus(appt.id, "completed")}
                            className="rounded-lg bg-emerald-50 p-1.5 text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
                            title="Mark as Completed"
                          >
                            <CheckCheck className="h-4 w-4" />
                          </button>
                        )}

                        {/* Edit / Reschedule Modal trigger */}
                        <button
                          onClick={() => openEditModal(appt)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-sky-50 hover:text-sky-700 transition cursor-pointer"
                          title="Edit details / Reschedule"
                        >
                          <Edit className="h-4 w-4" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteTrigger(appt)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                          title="Delete record"
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

      {/* Edit & Reschedule Modal */}
      {editingAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Manage Appointment
                </h3>
                <p className="text-xs text-slate-500">
                  Patient: {editingAppt.patientName} • Dr. {editingAppt.doctorName || editingAppt.doctor}
                </p>
              </div>
              <button
                onClick={() => setEditingAppt(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              {/* Status selection */}
              <div>
                <label className="mb-1 block font-bold uppercase text-slate-700">
                  Update Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 outline-none focus:border-sky-600"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Date & Time Rescheduling */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-bold uppercase text-slate-700">
                    Date
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 outline-none focus:border-sky-600"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold uppercase text-slate-700">
                    Time Slot
                  </label>
                  <input
                    type="text"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    placeholder="e.g. 10:00 AM"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 outline-none focus:border-sky-600"
                  />
                </div>
              </div>

              {/* Admin Note */}
              <div>
                <label className="mb-1 block font-bold uppercase text-slate-700">
                  Admin Internal Note
                </label>
                <textarea
                  rows={3}
                  value={editAdminNote}
                  onChange={(e) => setEditAdminNote(e.target.value)}
                  placeholder="Internal notes regarding consultation, verification, or patient instructions..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 outline-none focus:border-sky-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingAppt(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-sky-700 px-5 py-2 font-bold text-white hover:bg-sky-800 shadow-md shadow-sky-700/20 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, type: "single", appt: null })}
        onConfirm={confirmDelete}
        isLoading={deleting}
        title={
          deleteModal.type === "all"
            ? `Delete All ${appointments.length} Appointments?`
            : "Delete Appointment Record?"
        }
        subtitle="This action cannot be undone and will permanently remove records."
        description={
          deleteModal.type === "all" ? (
            <p className="font-bold">
              ⚠️ WARNING: You are about to permanently delete all {appointments.length} appointments in the system.
            </p>
          ) : deleteModal.appt ? (
            <>
              <p className="font-bold">
                Patient: {deleteModal.appt.patientName || "Patient"} • Dr. {deleteModal.appt.doctorName || deleteModal.appt.doctor}
              </p>
              <p className="text-slate-600">
                Date: {deleteModal.appt.date} at {deleteModal.appt.time} • Reason: {deleteModal.appt.reason || "General Consultation"}
              </p>
            </>
          ) : null
        }
      />
    </div>
  );
}
