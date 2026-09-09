import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  HeartPulse,
  LayoutDashboard,
  Calendar,
  Clock,
  CheckCircle2,
  CheckCheck,
  XCircle,
  User,
  LogOut,
  CalendarDays,
  UserCheck,
  Stethoscope,
  ChevronRight,
} from "lucide-react";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "../../components/NotificationBell";
import { notifyAppointmentApproved } from "../../lib/notificationService";

export default function DoctorDashboard() {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!currentUser) return;

    // Fetch Doctor Doc
    const fetchDocProfile = async () => {
      try {
        const snap = await getDoc(doc(db, "doctors", currentUser.uid));
        if (snap.exists()) {
          setDoctorProfile(snap.data());
        }
      } catch (err) {
        console.error("Error loading doctor profile:", err);
      }
    };
    fetchDocProfile();

    // Query ONLY appointments assigned to THIS doctor
    const q = query(
      collection(db, "appointments"),
      where("doctorId", "==", currentUser.uid)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAppointments(list);
      setLoading(false);
    }, (error) => {
      console.warn("Scoped query error, trying fallback query by doctor name:", error);
      // If doctorId is missing on legacy appointments, query by name
      const doctorName = userProfile?.fullName || currentUser.displayName;
      if (doctorName) {
        const qFallback = query(
          collection(db, "appointments"),
          where("doctorName", "==", doctorName)
        );
        onSnapshot(qFallback, (s) => {
          setAppointments(s.docs.map((d) => ({ id: d.id, ...d.data() })));
          setLoading(false);
        });
      }
    });

    return () => unsub();
  }, [currentUser, userProfile]);

  // Fetch users for patient image lookup
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      setUsers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

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
      console.error("Error approving appointment:", err);
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
      console.error("Error marking appointment completed:", err);
      alert("Failed to update status: " + err.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const doctorName = doctorProfile?.fullName || userProfile?.fullName || "Doctor";
  const doctorSpecialty = doctorProfile?.specialization || "Medical Specialist";

  const todayAppointments = appointments.filter((a) => a.date === todayStr);
  const pendingAppointments = appointments.filter((a) => (a.status || "").toLowerCase() === "pending");
  const approvedAppointments = appointments.filter((a) => (a.status || "").toLowerCase() === "approved" || (a.status || "").toLowerCase() === "confirmed");
  const completedAppointments = appointments.filter((a) => (a.status || "").toLowerCase() === "completed");

  // Build patient image lookup map
  const patientImageMap = {};
  users.forEach((u) => {
    if (u.image) patientImageMap[u.id] = u.image;
  });

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-xs font-extrabold text-sky-800 mb-2">
            <Stethoscope className="h-3.5 w-3.5 text-sky-700" />
            {doctorSpecialty}
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Welcome Back, {doctorName}! 👋
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Here are your assigned patients and scheduled consultations.
          </p>
        </div>
      </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase text-slate-500">Today's Visits</p>
            <h3 className="text-3xl font-black text-slate-900 mt-2">{todayAppointments.length}</h3>
            <p className="text-xs text-slate-400 mt-1">Scheduled for {todayStr}</p>
          </div>

          <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase text-slate-500">Pending Requests</p>
            <h3 className="text-3xl font-black text-amber-600 mt-2">{pendingAppointments.length}</h3>
            <p className="text-xs text-slate-400 mt-1">Awaiting admin review</p>
          </div>

          <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase text-slate-500">Approved Appointments</p>
            <h3 className="text-3xl font-black text-sky-700 mt-2">{approvedAppointments.length}</h3>
            <p className="text-xs text-slate-400 mt-1">Ready for consultation</p>
          </div>

          <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase text-slate-500">Completed Patients</p>
            <h3 className="text-3xl font-black text-emerald-600 mt-2">{completedAppointments.length}</h3>
            <p className="text-xs text-slate-400 mt-1">Treated visits</p>
          </div>
        </div>

        {/* Doctor's Appointments Table */}
        <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                My Assigned Appointments ({appointments.length})
              </h2>
              <p className="text-xs text-slate-500">
                You can mark approved visits as completed once consultation is finished.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/60 border-b border-slate-100 text-slate-500 text-[11px] uppercase font-bold tracking-wider">
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Patient Name</th>
                  <th className="px-6 py-4">Reason for Consultation</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Doctor Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-400">
                      Loading your appointments...
                    </td>
                  </tr>
                ) : appointments.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-400">
                      No appointments assigned to your medical schedule.
                    </td>
                  </tr>
                ) : (
                  appointments.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      {/* Date */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 font-bold text-slate-800">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {item.date}
                          {item.date === todayStr && (
                            <span className="rounded-md bg-sky-100 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-sky-700">
                              Today
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 ml-5 font-semibold">{item.time}</p>
                      </td>

                      {/* Patient */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          {(() => {
                            const pImg = patientImageMap[item.userId] || patientImageMap[item.patientId];
                            return pImg ? (
                              <img
                                src={pImg}
                                alt={item.patientName || "Patient"}
                                className="h-8 w-8 rounded-lg object-cover border border-sky-200 shrink-0"
                              />
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 font-bold text-[11px] text-sky-700 shrink-0">
                                {(item.patientName || "P").charAt(0).toUpperCase()}
                              </div>
                            );
                          })()}
                          <div>
                            <p className="font-bold text-slate-900">{item.patientName || "Patient"}</p>
                            <p className="text-[10px] text-slate-400">{item.phone || "—"}</p>
                          </div>
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="px-6 py-4 max-w-xs truncate font-medium text-slate-700">
                        {item.reason || "General Checkup"}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase ${
                            item.status === "completed"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : item.status === "approved" || item.status === "confirmed"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : item.status === "rejected" || item.status === "cancelled"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              item.status === "completed"
                                ? "bg-emerald-500"
                                : item.status === "approved" || item.status === "confirmed"
                                ? "bg-blue-500"
                                : item.status === "rejected" || item.status === "cancelled"
                                ? "bg-rose-500"
                                : "bg-amber-500"
                            }`}
                          />
                          {item.status || "Pending"}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {item.status === "pending" ? (
                          <button
                            onClick={() => approveAppointment(item.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-sky-700 transition cursor-pointer"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Approve
                          </button>
                        ) : (item.status === "approved" || item.status === "confirmed") ? (
                          <button
                            onClick={() => markCompleted(item.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition cursor-pointer"
                          >
                            <CheckCheck className="h-3.5 w-3.5" />
                            Mark Completed
                          </button>
                        ) : item.status === "completed" ? (
                          <span className="text-[11px] font-bold text-emerald-600 inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Done
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
