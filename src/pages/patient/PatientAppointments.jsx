import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Search,
  Clock,
  PlusCircle,
  User,
  Stethoscope,
  XCircle,
  AlertCircle,
  CheckCircle2,
  Lock,
} from "lucide-react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function PatientAppointments() {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  // Cancellation modal state
  const [cancelModal, setCancelModal] = useState({ open: false, appt: null });
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "appointments"),
      where("patientId", "==", currentUser.uid)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setAppointments(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        const qFallback = query(
          collection(db, "appointments"),
          where("userId", "==", currentUser.uid)
        );
        onSnapshot(qFallback, (s) => {
          setAppointments(s.docs.map((d) => ({ id: d.id, ...d.data() })));
          setLoading(false);
        });
      }
    );

    return () => unsub();
  }, [currentUser]);

  const confirmCancel = async () => {
    if (!cancelModal.appt) return;
    setCancelling(true);
    try {
      await updateDoc(doc(db, "appointments", cancelModal.appt.id), {
        status: "cancelled",
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setCancelModal({ open: false, appt: null });
    } catch (err) {
      alert("Failed to cancel appointment: " + err.message);
    } finally {
      setCancelling(false);
    }
  };

  const filtered = appointments.filter((appt) => {
    const term = search.toLowerCase();
    const matchesSearch =
      (appt.doctorName || appt.doctor || "").toLowerCase().includes(term) ||
      (appt.specialty || "").toLowerCase().includes(term) ||
      (appt.reason || "").toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === "All" ||
      (appt.status || "").toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <div>
        <Navbar hideHero={true} />

        <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                My Appointments
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Complete log of your scheduled appointments, active statuses, and past medical visits.
              </p>
            </div>

            <Link
              to="/doctors"
              className="flex items-center gap-2 rounded-xl bg-sky-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-700/20 hover:bg-sky-800 transition"
            >
              <PlusCircle className="h-4 w-4" />
              Schedule Appointment
            </Link>
          </div>

          {/* Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by doctor or specialty..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-xs outline-none focus:border-sky-600 focus:bg-white"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-sky-600 w-full sm:w-auto"
            >
              <option value="All">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Appointments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full py-12 text-center text-xs text-slate-400">
                Loading appointments...
              </div>
            ) : filtered.length === 0 ? (
              <div className="col-span-full rounded-3xl border border-dashed border-slate-200 p-12 text-center text-xs text-slate-400">
                No appointments found.
              </div>
            ) : (
              filtered.map((appt) => {
                const statusLower = (appt.status || "pending").toLowerCase();
                const isApproved =
                  statusLower === "approved" || statusLower === "confirmed";
                const canCancel =
                  statusLower === "pending" || isApproved;

                return (
                  <div
                    key={appt.id}
                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">
                            Dr. {appt.doctorName || appt.doctor}
                          </h3>
                          <p className="text-xs text-sky-700 font-semibold">
                            {appt.specialty || "Specialist"}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                            statusLower === "completed"
                              ? "bg-emerald-100 text-emerald-800"
                              : isApproved
                              ? "bg-blue-100 text-blue-800"
                              : statusLower === "rejected" || statusLower === "cancelled"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {appt.status || "Pending"}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600">
                        <p className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>
                            {appt.dayName ? `${appt.dayName}, ` : ""}
                            {appt.date}
                          </span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>{appt.time}</span>
                        </p>
                        <p className="text-slate-500 pt-1">
                          <strong>Reason:</strong> {appt.reason || "General Visit"}
                        </p>
                      </div>
                    </div>

                    {/* Cancel action */}
                    {canCancel && (
                      <div className="pt-3 border-t border-slate-100 flex justify-end">
                        {isApproved ? (
                          <div className="relative group inline-flex items-center">
                            {/* Hover Tooltip positioned cleanly to the left */}
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
                              className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-slate-100/90 border border-slate-200 px-3 py-1.5 rounded-xl cursor-not-allowed select-none transition"
                              title="Already Approved: This appointment is confirmed and cannot be cancelled online."
                            >
                              <Lock className="h-3.5 w-3.5 text-slate-400" />
                              <span>Cancel Appointment</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setCancelModal({ open: true, appt })}
                            className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-xl transition cursor-pointer"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Cancel Appointment</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>

      {/* Cancel Confirmation Modal */}
      {cancelModal.open && cancelModal.appt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <AlertCircle className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">
                Cancel this Appointment?
              </h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to cancel your consultation with{" "}
                <strong>Dr. {cancelModal.appt.doctorName || "Doctor"}</strong> on{" "}
                <strong>{cancelModal.appt.date}</strong>? Once cancelled, you will be able to schedule a new appointment.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={cancelling}
                onClick={() => setCancelModal({ open: false, appt: null })}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                No, Keep It
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={confirmCancel}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition cursor-pointer"
              >
                {cancelling ? "Cancelling..." : "Yes, Cancel Appointment"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
