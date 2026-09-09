import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Mail,
  Phone,
  Calendar,
  Eye,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Trash2,
  AlertTriangle,
  CheckSquare,
  Square,
  AlertCircle,
} from "lucide-react";
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  deleteDoc,
  writeBatch,
  getDocs,
} from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function AdminPatients() {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  // Selection & Bulk delete state
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    type: "single", // 'single' | 'selected' | 'all'
    patient: null,
  });
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  useEffect(() => {
    // 1. Listen to users with role patient
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const allUsers = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      const patientList = allUsers.filter(
        (u) =>
          (u.role || "").toLowerCase() === "patient" ||
          (u.role || "").toLowerCase() === "user"
      );
      setPatients(patientList);
      setLoading(false);
    });

    // 2. Listen to all appointments to count patient bookings
    const unsubAppts = onSnapshot(collection(db, "appointments"), (snapshot) => {
      const appts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAppointments(appts);
    });

    return () => {
      unsubUsers();
      unsubAppts();
    };
  }, []);

  const filteredPatients = patients.filter((pt) => {
    const term = search.toLowerCase();
    return (
      (pt.fullName || "").toLowerCase().includes(term) ||
      (pt.email || "").toLowerCase().includes(term) ||
      (pt.phone || "").toLowerCase().includes(term)
    );
  });

  const getPatientAppointments = (patientUid, patientEmail) => {
    return appointments.filter(
      (a) =>
        a.userId === patientUid ||
        a.patientId === patientUid ||
        a.patientEmail === patientEmail
    );
  };

  // Selection toggles
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredPatients.length && filteredPatients.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPatients.map((p) => p.id));
    }
  };

  // Delete helpers
  const triggerDeleteSingle = (patient) => {
    setDeleteModal({
      open: true,
      type: "single",
      patient,
    });
  };

  const triggerDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    setDeleteModal({
      open: true,
      type: "selected",
      patient: null,
    });
  };

  const triggerDeleteAll = () => {
    if (patients.length === 0) return;
    setDeleteModal({
      open: true,
      type: "all",
      patient: null,
    });
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setFeedback({ type: "", message: "" });

    try {
      if (deleteModal.type === "single" && deleteModal.patient) {
        const ptId = deleteModal.patient.id;
        // 1. Delete associated appointments
        const q1 = query(collection(db, "appointments"), where("userId", "==", ptId));
        const q2 = query(collection(db, "appointments"), where("patientId", "==", ptId));
        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
        const apptBatch = writeBatch(db);
        snap1.forEach((d) => apptBatch.delete(d.ref));
        snap2.forEach((d) => apptBatch.delete(d.ref));
        await apptBatch.commit();

        // 2. Delete patient user record
        await deleteDoc(doc(db, "users", ptId));

        setSelectedIds((prev) => prev.filter((id) => id !== ptId));
        if (selectedPatient?.id === ptId) setSelectedPatient(null);

        setFeedback({
          type: "success",
          message: `Patient "${deleteModal.patient.fullName || deleteModal.patient.email}" was deleted successfully.`,
        });
      } else if (deleteModal.type === "selected") {
        const idsToDelete = [...selectedIds];
        // Delete appointments and users in batches
        for (const ptId of idsToDelete) {
          const q1 = query(collection(db, "appointments"), where("userId", "==", ptId));
          const q2 = query(collection(db, "appointments"), where("patientId", "==", ptId));
          const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
          const batch = writeBatch(db);
          snap1.forEach((d) => batch.delete(d.ref));
          snap2.forEach((d) => batch.delete(d.ref));
          batch.delete(doc(db, "users", ptId));
          await batch.commit();
        }

        setSelectedIds([]);
        if (selectedPatient && idsToDelete.includes(selectedPatient.id)) {
          setSelectedPatient(null);
        }

        setFeedback({
          type: "success",
          message: `${idsToDelete.length} selected patients were deleted successfully.`,
        });
      } else if (deleteModal.type === "all") {
        const allPatientIds = patients.map((p) => p.id);
        for (const ptId of allPatientIds) {
          const q1 = query(collection(db, "appointments"), where("userId", "==", ptId));
          const q2 = query(collection(db, "appointments"), where("patientId", "==", ptId));
          const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
          const batch = writeBatch(db);
          snap1.forEach((d) => batch.delete(d.ref));
          snap2.forEach((d) => batch.delete(d.ref));
          batch.delete(doc(db, "users", ptId));
          await batch.commit();
        }

        setSelectedIds([]);
        setSelectedPatient(null);

        setFeedback({
          type: "success",
          message: `All ${allPatientIds.length} patients were deleted successfully.`,
        });
      }

      setDeleteModal({ open: false, type: "single", patient: null });
      setTimeout(() => setFeedback({ type: "", message: "" }), 5000);
    } catch (err) {
      console.error("Error deleting patient(s):", err);
      setFeedback({
        type: "error",
        message: err.message || "Failed to delete patient(s). Please try again.",
      });
    } finally {
      setDeleting(false);
    }
  };

  const isAllSelected =
    filteredPatients.length > 0 && selectedIds.length === filteredPatients.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Registered Patients
          </h2>
          <p className="text-xs text-slate-500">
            View verified patient profiles, contact records, and manage account records.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
            {patients.length} Active Patients
          </span>

          {patients.length > 0 && (
            <button
              onClick={triggerDeleteAll}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
              title="Delete all patient accounts"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete All Patients
            </button>
          )}
        </div>
      </div>

      {/* Feedback alerts */}
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

      {/* Search Bar & Bulk Actions Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patients by name, email address, or phone number..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-xs text-slate-900 outline-none focus:border-sky-600 focus:bg-white transition"
          />
        </div>

        {/* Bulk Action Strip when items are selected */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-4 py-2 text-xs">
            <span className="font-bold text-slate-700">
              {selectedIds.length} patient{selectedIds.length > 1 ? "s" : ""} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedIds([])}
                className="rounded-lg px-2.5 py-1 font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-200/60"
              >
                Clear Selection
              </button>
              <button
                onClick={triggerDeleteSelected}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1 font-bold text-white hover:bg-rose-700 transition cursor-pointer shadow-xs"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Selected ({selectedIds.length})
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Patients Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-sky-600 accent-sky-600 cursor-pointer"
                    title="Select all"
                  />
                </th>
                <th className="px-4 py-4">Patient Name</th>
                <th className="px-4 py-4">Email</th>
                <th className="px-4 py-4">Phone</th>
                <th className="px-4 py-4">Gender & DOB</th>
                <th className="px-4 py-4">Total Appointments</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    Loading registered patients...
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No patients found matching your search.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((pt) => {
                  const ptAppts = getPatientAppointments(pt.uid || pt.id, pt.email);
                  const isChecked = selectedIds.includes(pt.id);

                  return (
                    <tr
                      key={pt.id}
                      className={`hover:bg-slate-50/70 transition ${
                        isChecked ? "bg-sky-50/40" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(pt.id)}
                          className="h-4 w-4 rounded border-slate-300 text-sky-600 accent-sky-600 cursor-pointer"
                        />
                      </td>

                      {/* Name */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {pt.image ? (
                            <img
                              src={pt.image}
                              alt={pt.fullName || "Patient"}
                              className="h-9 w-9 rounded-xl object-cover border border-sky-200 shrink-0"
                            />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 font-bold text-xs text-sky-700 shrink-0">
                              {(pt.fullName || pt.email || "P").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900">
                              {pt.fullName || "Patient"}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              UID: {pt.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-4 font-medium text-slate-700">
                        {pt.email}
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-4 text-slate-600">
                        {pt.phone || "—"}
                      </td>

                      {/* Gender & DOB */}
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-800">
                          {pt.gender || "Unspecified"}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {pt.dateOfBirth || "DOB not set"}
                        </p>
                      </td>

                      {/* Total Bookings */}
                      <td className="px-4 py-4">
                        <span className="inline-block rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700">
                          {ptAppts.length} appointments
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span className="inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-emerald-700 border border-emerald-200">
                          {pt.status || "active"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() =>
                              setSelectedPatient({ ...pt, appointments: ptAppts })
                            }
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-50 transition cursor-pointer"
                            title="View patient details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>View</span>
                          </button>

                          <button
                            onClick={() => triggerDeleteSingle(pt)}
                            className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Delete patient"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete</span>
                          </button>
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

      {/* ── Patient Details Modal ── */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                {selectedPatient.image ? (
                  <img
                    src={selectedPatient.image}
                    alt={selectedPatient.fullName || "Patient"}
                    className="h-12 w-12 rounded-2xl object-cover border-2 border-sky-200 shadow-sm"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 font-bold text-lg">
                    {(
                      selectedPatient.fullName ||
                      selectedPatient.email ||
                      "P"
                    ).charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedPatient.fullName || "Patient Profile"}
                  </h3>
                  <p className="text-xs text-slate-500">{selectedPatient.email}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedPatient(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Profile Information Grid */}
            <div className="grid grid-cols-2 gap-4 rounded-2xl bg-slate-50/70 p-4 border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px]">
                  Phone Number
                </span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {selectedPatient.phone || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px]">
                  Gender
                </span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {selectedPatient.gender || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px]">
                  Date of Birth
                </span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {selectedPatient.dateOfBirth || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px]">
                  Account Role
                </span>
                <p className="font-semibold text-sky-700 mt-0.5 capitalize">
                  {selectedPatient.role || "Patient"}
                </p>
              </div>
            </div>

            {/* Appointment History */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Patient Appointment History ({selectedPatient.appointments?.length || 0})
              </h4>

              {selectedPatient.appointments?.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                  This patient has not booked any appointments yet.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-60 overflow-y-auto">
                  {selectedPatient.appointments.map((appt) => (
                    <div
                      key={appt.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 shadow-xs text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">
                          Dr. {appt.doctorName || appt.doctor}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          📅 {appt.date} at {appt.time} • {appt.reason || "Checkup"}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                          appt.status === "completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : appt.status === "approved" || appt.status === "confirmed"
                            ? "bg-blue-100 text-blue-800"
                            : appt.status === "rejected" || appt.status === "cancelled"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {appt.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => {
                  const pt = selectedPatient;
                  setSelectedPatient(null);
                  triggerDeleteSingle(pt);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                Delete Patient
              </button>

              <button
                onClick={() => setSelectedPatient(null)}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation Modal for Single / Bulk / All Deletion ── */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900">
                  {deleteModal.type === "single"
                    ? "Delete Patient Account?"
                    : deleteModal.type === "selected"
                    ? `Delete ${selectedIds.length} Selected Patients?`
                    : `Delete All ${patients.length} Patients?`}
                </h4>
                <p className="text-xs text-slate-500">
                  This action cannot be undone and will permanently remove records.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800 space-y-1">
              {deleteModal.type === "single" && deleteModal.patient && (
                <>
                  <p className="font-bold">
                    Patient: {deleteModal.patient.fullName || "Unnamed Patient"}
                  </p>
                  <p className="text-slate-600">Email: {deleteModal.patient.email}</p>
                </>
              )}
              {deleteModal.type === "selected" && (
                <p className="font-semibold">
                  You are about to delete {selectedIds.length} patient profile(s) and their
                  associated appointment records.
                </p>
              )}
              {deleteModal.type === "all" && (
                <p className="font-bold">
                  ⚠️ WARNING: This will delete all {patients.length} registered patients in the
                  entire clinic database!
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() =>
                  setDeleteModal({ open: false, type: "single", patient: null })
                }
                disabled={deleting}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50 shadow-md shadow-rose-600/20 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? "Deleting..." : "Yes, Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
