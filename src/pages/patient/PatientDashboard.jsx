import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  PlusCircle,
  HeartPulse,
  LogOut,
  ChevronRight,
  ArrowRight,
  Stethoscope,
  Lock,
} from "lucide-react";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import DeleteConfirmModal from "../../components/ui/DeleteConfirmModal";

export default function PatientDashboard() {
  const { currentUser, userProfile } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cancel modal state
  const [cancelModal, setCancelModal] = useState({ open: false, appt: null });
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    // Fetch ONLY appointments belonging to this patient
    const q = query(
      collection(db, "appointments"),
      where("patientId", "==", currentUser.uid)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAppointments(list);
      setLoading(false);
    }, (err) => {
      // Fallback query with userId
      const qFallback = query(
        collection(db, "appointments"),
        where("userId", "==", currentUser.uid)
      );
      onSnapshot(qFallback, (s) => {
        setAppointments(s.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });
    });

    return () => unsub();
  }, [currentUser]);

  const handleCancelClick = (appt) => {
    setCancelModal({ open: true, appt });
  };

  const confirmCancel = async () => {
    if (!cancelModal.appt) return;
    setCancelling(true);
    try {
      await updateDoc(doc(db, "appointments", cancelModal.appt.id), {
        status: "cancelled",
        updatedAt: serverTimestamp(),
      });
      setCancelModal({ open: false, appt: null });
    } catch (err) {
      alert("Failed to cancel appointment: " + err.message);
    } finally {
      setCancelling(false);
    }
  };

  const patientName = userProfile?.fullName || currentUser?.displayName || "Patient";

  const pending = appointments.filter((a) => (a.status || "").toLowerCase() === "pending");
  const approved = appointments.filter((a) => (a.status || "").toLowerCase() === "approved" || (a.status || "").toLowerCase() === "confirmed");
  const completed = appointments.filter((a) => (a.status || "").toLowerCase() === "completed");
  const cancelled = appointments.filter((a) => (a.status || "").toLowerCase() === "cancelled" || (a.status || "").toLowerCase() === "rejected");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <div>
        <Navbar hideHero={true} />

        <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8 space-y-8">
          {/* Welcome Banner */}
          <div className="rounded-3xl bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-900 p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-sky-200 backdrop-blur-md mb-3 border border-white/10">
                Patient Medical Portal
              </span>
              <h1 className="text-3xl font-black tracking-tight">
                Welcome, {patientName}
              </h1>
              <p className="text-sm text-sky-100 mt-1 max-w-xl leading-relaxed">
                Access your consultation schedule, track appointment confirmations, and view clinical history.
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                to="/doctors"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-black text-sky-900 shadow-md hover:bg-sky-50 transition"
              >
                <PlusCircle className="h-4 w-4 text-sky-600" />
                Book New Visit
              </Link>
            </div>
          </div>

          {/* KPI Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total</span>
                <div className="rounded-xl bg-sky-50 p-2 text-sky-600">
                  <Calendar className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{appointments.length}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">All visits recorded</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending</span>
                <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-amber-600 mt-2">{pending.length}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Awaiting clinic review</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Approved</span>
                <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-blue-600 mt-2">{approved.length}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Confirmed bookings</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Completed</span>
                <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-600 mt-2">{completed.length}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Consultations done</p>
            </div>
          </div>

          {/* Appointments Table */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Your Appointment Records</h2>
                <p className="text-xs text-slate-500 mt-0.5">History of consultations and live status updates.</p>
              </div>
              <Link to="/patient/appointments" className="text-xs font-bold text-sky-700 hover:text-sky-800 inline-flex items-center gap-1">
                Full Records <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">Practitioner & Specialty</th>
                    <th className="px-6 py-4">Date & Time</th>
                    <th className="px-6 py-4">Reason / Notes</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-slate-400">Loading appointments...</td>
                    </tr>
                  ) : appointments.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-slate-400">
                        No appointments found. Click "Book New Visit" to schedule your first consultation.
                      </td>
                    </tr>
                  ) : (
                    appointments.map((appt) => (
                      <tr key={appt.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">Dr. {appt.doctorName || appt.doctor}</p>
                          <p className="text-[11px] text-sky-700 font-semibold">{appt.specialty || "Specialist"}</p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800">{appt.date}</p>
                          <p className="text-[11px] text-slate-400">{appt.time}</p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-slate-700">{appt.reason || "Routine Checkup"}</p>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                              appt.status === "completed"
                                ? "bg-emerald-100 text-emerald-800"
                                : appt.status === "approved" || appt.status === "confirmed"
                                ? "bg-blue-100 text-blue-800"
                                : appt.status === "rejected" || appt.status === "cancelled"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {appt.status || "Pending"}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          {appt.status === "approved" || appt.status === "confirmed" ? (
                            <div className="relative group inline-flex items-center">
                              {/* Hover Tooltip - Positioned to the left to avoid header clipping and horizontal scroll */}
                              <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 hidden group-hover:flex items-center z-30 pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95">
                                <div className="bg-slate-900/95 backdrop-blur-xs text-white text-[11px] font-medium px-3 py-1.5 rounded-xl shadow-xl border border-slate-800 text-left whitespace-nowrap flex items-center gap-1.5">
                                  <span className="text-amber-400 font-bold">🔒 Approved:</span>
                                  <span className="text-slate-200">Cannot be cancelled online</span>
                                </div>
                                <div className="w-1.5 h-1.5 bg-slate-900/95 rotate-45 -ml-1 shrink-0" />
                              </div>

                              <button
                                type="button"
                                disabled
                                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100/90 px-3 py-1.5 text-xs font-semibold text-slate-400 border border-slate-200/80 cursor-not-allowed select-none transition"
                                title="Already Approved: This appointment is confirmed and cannot be cancelled online."
                              >
                                <Lock className="h-3 w-3 text-slate-400" />
                                <span>Cancel Appointment</span>
                              </button>
                            </div>
                          ) : (appt.status || "pending").toLowerCase() === "pending" ? (
                            <button
                              type="button"
                              onClick={() => handleCancelClick(appt)}
                              className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                            >
                              Cancel Appointment
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Delete/Cancel Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={cancelModal.open}
        onClose={() => setCancelModal({ open: false, appt: null })}
        onConfirm={confirmCancel}
        isLoading={cancelling}
        title="Cancel Appointment Request?"
        subtitle="This action will cancel your scheduled consultation."
        confirmText="Yes, Cancel Appointment"
        description={
          cancelModal.appt ? (
            <>
              <p className="font-bold">
                Doctor: Dr. {cancelModal.appt.doctorName || cancelModal.appt.doctor}
              </p>
              <p className="text-slate-600">
                Date: {cancelModal.appt.date} at {cancelModal.appt.time} • Specialty: {cancelModal.appt.specialty || "General"}
              </p>
            </>
          ) : null
        }
      />

      <Footer />
    </div>
  );
}
