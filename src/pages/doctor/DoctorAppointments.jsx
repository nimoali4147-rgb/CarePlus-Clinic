import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  HeartPulse,
  LayoutDashboard,
  Calendar,
  Clock,
  CheckCircle2,
  CheckCheck,
  Search,
  User,
  LogOut,
  Stethoscope,
} from "lucide-react";
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "../../components/NotificationBell";
import { notifyAppointmentApproved } from "../../lib/notificationService";

export default function DoctorAppointments() {
  const { currentUser, userProfile, logout } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    getDoc(doc(db, "doctors", currentUser.uid)).then((s) => {
      if (s.exists()) setDoctorProfile(s.data());
    }).catch(() => {});
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "appointments"),
      where("doctorId", "==", currentUser.uid)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setAppointments(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.warn("Doctor appointment query error:", err);
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser]);

  const approveAppointment = async (apptId) => {
    try {
      const appt = appointments.find((a) => a.id === apptId);
      await updateDoc(doc(db, "appointments", apptId), {
        status: "approved",
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Send in-app notification to patient
      if (appt) {
        notifyAppointmentApproved({
          ...appt,
          id: apptId,
          doctorName: doctorProfile?.fullName || appt.doctorName || userProfile?.fullName || "Doctor",
          status: "approved",
        });
      }
    } catch (err) {
      alert("Failed to approve appointment: " + err.message);
    }
  };

  const markCompleted = async (apptId) => {
    try {
      await updateDoc(doc(db, "appointments", apptId), {
        status: "completed",
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      alert("Failed to mark completed: " + err.message);
    }
  };

  const filtered = appointments.filter((appt) => {
    const term = search.toLowerCase();
    const matchesSearch =
      (appt.patientName || "").toLowerCase().includes(term) ||
      (appt.reason || "").toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === "All" || (appt.status || "").toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            All My Patient Appointments
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Search and filter consultations strictly assigned to your schedule.
          </p>
        </div>

        <span className="rounded-full bg-sky-50 px-3.5 py-1.5 text-xs font-bold text-sky-700 border border-sky-100 self-start sm:self-auto">
          {appointments.length} Total Assigned
        </span>
      </div>

      {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm mb-6">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by patient name or reason..."
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
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Appointments Table */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/60 border-b border-slate-100 text-slate-500 text-[11px] uppercase font-bold tracking-wider">
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Reason & Notes</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-400">Loading appointments...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-400">No appointments found matching your filters.</td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {item.date}
                        <p className="text-[11px] text-slate-400 font-semibold">{item.time}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{item.patientName || "Patient"}</p>
                        <p className="text-[10px] text-slate-400">{item.phone || "—"}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-600 max-w-xs truncate">
                        {item.reason || "Checkup"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                            item.status === "completed"
                              ? "bg-emerald-100 text-emerald-800"
                              : item.status === "approved" || item.status === "confirmed"
                              ? "bg-blue-100 text-blue-800"
                              : item.status === "rejected"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {item.status || "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {item.status === "pending" ? (
                          <button
                            onClick={() => approveAppointment(item.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-sky-700 transition cursor-pointer shadow-xs"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                          </button>
                        ) : (item.status === "approved" || item.status === "confirmed") ? (
                          <button
                            onClick={() => markCompleted(item.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition cursor-pointer shadow-xs"
                          >
                            <CheckCheck className="h-3.5 w-3.5" /> Complete
                          </button>
                        ) : item.status === "completed" ? (
                          <span className="text-[11px] font-bold text-emerald-600 inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 capitalize">
                            {item.status || "Cancelled"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
}
