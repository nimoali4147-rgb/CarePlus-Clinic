import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Stethoscope,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowUpRight,
  TrendingUp,
  UserPlus,
  CalendarCheck,
  CheckCheck,
  ChevronRight,
  ShieldAlert,
  Phone,
  Mail,
  Sparkles,
} from "lucide-react";
import { collection, onSnapshot, query, updateDoc, doc, serverTimestamp, orderBy, limit } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { notifyAppointmentApproved } from "../../lib/notificationService";

export default function AdminDashboard() {
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real-time Firestore Listeners
  useEffect(() => {
    // 1. Doctors listener
    const unsubDoctors = onSnapshot(collection(db, "doctors"), (snapshot) => {
      const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setDoctors(docs);
    });

    // 2. Patients (users with role === 'patient') listener
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersList = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAllUsers(usersList);
      const patientList = usersList.filter((u) => (u.role || "").toLowerCase() === "patient" || (u.role || "").toLowerCase() === "user");
      setPatients(patientList);
    });

    // 3. Appointments listener
    const unsubAppointments = onSnapshot(collection(db, "appointments"), (snapshot) => {
      const appts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAppointments(appts);
      setLoading(false);
    });

    return () => {
      unsubDoctors();
      unsubUsers();
      unsubAppointments();
    };
  }, []);

  // Quick action: update appointment status
  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      const appt = appointments.find((a) => a.id === appointmentId);
      const apptRef = doc(db, "appointments", appointmentId);
      await updateDoc(apptRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      if (newStatus === "approved" && appt) {
        notifyAppointmentApproved({
          ...appt,
          id: appointmentId,
          status: "approved",
        });
      }
    } catch (err) {
      console.error("Error updating appointment status:", err);
      alert("Failed to update status: " + err.message);
    }
  };

  // Calculations & Metrics
  const totalDoctors = doctors.length;
  const activeDoctors = doctors.filter((d) => d.status === "active").length;
  const totalPatients = patients.length;
  const totalAppointments = appointments.length;

  const pendingAppointments = appointments.filter((a) => (a.status || "").toLowerCase() === "pending");
  const approvedAppointments = appointments.filter((a) => (a.status || "").toLowerCase() === "approved" || (a.status || "").toLowerCase() === "confirmed");
  const completedAppointments = appointments.filter((a) => (a.status || "").toLowerCase() === "completed");
  const rejectedAppointments = appointments.filter((a) => (a.status || "").toLowerCase() === "rejected" || (a.status || "").toLowerCase() === "cancelled");

  const todayStr = new Date().toISOString().split("T")[0];
  const todayAppointments = appointments.filter((a) => a.date === todayStr);

  // Patient Image Map
  const patientImageMap = {};
  allUsers.forEach((u) => {
    const img = u.image || u.photoURL || u.profileImage;
    if (img) {
      patientImageMap[u.id] = img;
      if (u.email) patientImageMap[u.email.toLowerCase().trim()] = img;
    }
  });

  // Doctor Image Map
  const doctorImageMap = {};
  doctors.forEach((d) => {
    const img = d.image || d.photoURL || d.profileImage;
    if (img) {
      doctorImageMap[d.id] = img;
      if (d.fullName) doctorImageMap[d.fullName.toLowerCase().trim()] = img;
      if (d.name) doctorImageMap[d.name.toLowerCase().trim()] = img;
    }
  });

  const sortedPatients = [...patients].sort((a, b) => {
    const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
    const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
    return tB - tA;
  });

  const stats = [
    { title: "Total Doctors", value: totalDoctors, sub: `${activeDoctors} active`, icon: Stethoscope, color: "sky" },
    { title: "Registered Patients", value: totalPatients, sub: "Verified profiles", icon: Users, color: "emerald" },
    { title: "Total Appointments", value: totalAppointments, sub: `${todayAppointments.length} scheduled today`, icon: Calendar, color: "blue" },
    { title: "Pending Requests", value: pendingAppointments.length, sub: "Requires approval", icon: Clock, color: "amber" },
    { title: "Approved Visits", value: approvedAppointments.length, sub: "Confirmed slots", icon: CheckCircle2, color: "indigo" },
    { title: "Completed Visits", value: completedAppointments.length, sub: "Successfully treated", icon: CheckCheck, color: "teal" },
    { title: "Rejected / Cancelled", value: rejectedAppointments.length, sub: "Cancelled slots", icon: XCircle, color: "rose" },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl bg-gradient-to-r from-sky-800 via-sky-900 to-slate-900 p-8 text-white shadow-xl shadow-sky-950/10 lg:flex-row lg:items-center">
        <div>
          <span className="inline-block rounded-full bg-sky-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-sky-200 border border-sky-400/30">
            Real-Time System Overview
          </span>
          <h2 className="mt-2 text-2xl md:text-3xl font-black tracking-tight text-white">
            Welcome to CarePlus Control Center
          </h2>
          <p className="mt-2 text-sm text-sky-100/90 max-w-xl">
            Live clinical operational data synced directly with Firestore. Manage medical specialists, patient appointments, and schedules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/admin/doctors/new"
            className="flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-sky-500/25 hover:bg-sky-400 transition"
          >
            <UserPlus className="h-4 w-4" />
            Add New Doctor
          </Link>
          <Link
            to="/admin/appointments"
            className="flex items-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-xs font-bold text-white backdrop-blur-md hover:bg-white/20 transition border border-white/15"
          >
            <CalendarCheck className="h-4 w-4" />
            Manage Appointments
          </Link>
        </div>
      </div>

      {/* Grid of 7 Live Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {item.title}
                </p>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <h3 className="text-3xl font-black text-slate-900">
                  {loading ? "-" : item.value}
                </h3>
              </div>
              <p className="mt-1 text-xs text-slate-500 font-medium">
                {item.sub}
              </p>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout: Pending Requests & Today's Schedule */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Pending Requests Section */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Clock className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Pending Appointment Requests
              </h3>
            </div>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
              {pendingAppointments.length} Action Needed
            </span>
          </div>

          <div className="space-y-3">
            {pendingAppointments.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 shadow-xs mb-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">All Caught Up!</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  No pending appointment requests waiting for review. All patient bookings are up to date.
                </p>
                <Link
                  to="/admin/appointments"
                  className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-3.5 py-1.5 rounded-xl transition border border-sky-200/60"
                >
                  <span>All Appointments</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              pendingAppointments.slice(0, 5).map((appt) => {
                const pImg =
                  appt.patientImage ||
                  patientImageMap[appt.userId] ||
                  patientImageMap[appt.patientId] ||
                  (appt.patientEmail && patientImageMap[appt.patientEmail.toLowerCase().trim()]);

                return (
                  <div
                    key={appt.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl border border-slate-200/70 bg-slate-50/50 hover:bg-slate-50 p-4 transition shadow-xs"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {pImg ? (
                        <img
                          src={pImg}
                          alt={appt.patientName || "Patient"}
                          className="h-10 w-10 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const fb = e.currentTarget.parentElement?.querySelector(".p-fallback");
                            if (fb) fb.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        style={pImg ? { display: "none" } : {}}
                        className="p-fallback flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100/70 font-bold text-xs text-amber-800 shrink-0 border border-amber-200/60 shadow-xs"
                      >
                        {(appt.patientName || "P").charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {appt.patientName || "Patient"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">for</span>
                          <span className="text-xs font-bold text-sky-700 truncate">
                            Dr. {appt.doctorName || appt.doctor || "Specialist"}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500 font-medium">
                          <span className="inline-flex items-center gap-1 text-slate-600 bg-white px-2 py-0.5 rounded-lg border border-slate-200/60 shadow-xs">
                            <Calendar className="h-3 w-3 text-sky-600" />
                            {appt.date}
                          </span>
                          {appt.time && (
                            <span className="inline-flex items-center gap-1 text-slate-600 bg-white px-2 py-0.5 rounded-lg border border-slate-200/60 shadow-xs">
                              <Clock className="h-3 w-3 text-amber-600" />
                              {appt.time}
                            </span>
                          )}
                          {appt.reason && (
                            <span className="text-slate-500 truncate italic">
                              "{appt.reason}"
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => updateAppointmentStatus(appt.id, "approved")}
                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition cursor-pointer"
                        title="Approve appointment"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => updateAppointmentStatus(appt.id, "rejected")}
                        className="inline-flex items-center gap-1 rounded-xl bg-rose-50 hover:bg-rose-100 px-3 py-1.5 text-xs font-bold text-rose-600 transition cursor-pointer border border-rose-100"
                        title="Reject appointment"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {pendingAppointments.length > 5 && (
            <Link
              to="/admin/appointments"
              className="mt-4 flex items-center justify-center gap-1 text-xs font-bold text-sky-700 hover:underline"
            >
              View all {pendingAppointments.length} pending requests <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {/* Today's Appointments */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <Calendar className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Today's Clinic Schedule
              </h3>
            </div>
            <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-800">
              {todayAppointments.length} Today
            </span>
          </div>

          <div className="space-y-3">
            {todayAppointments.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 border border-sky-200/60 shadow-xs mb-3">
                  <Calendar className="h-6 w-6 text-sky-600" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">No Appointments Today</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Clinic schedule is clear for today. Specialists are available for emergency walk-ins or on-call duties.
                </p>
                <Link
                  to="/admin/schedules"
                  className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-3.5 py-1.5 rounded-xl transition border border-sky-200/60"
                >
                  <span>View Doctors Roster</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              todayAppointments.map((appt) => {
                const pImg =
                  appt.patientImage ||
                  patientImageMap[appt.userId] ||
                  patientImageMap[appt.patientId] ||
                  (appt.patientEmail && patientImageMap[appt.patientEmail.toLowerCase().trim()]);
                const isApproved =
                  (appt.status || "").toLowerCase() === "approved" ||
                  (appt.status || "").toLowerCase() === "confirmed";
                const isCompleted = (appt.status || "").toLowerCase() === "completed";

                return (
                  <div
                    key={appt.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white hover:bg-slate-50/60 p-3.5 transition shadow-xs gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {pImg ? (
                        <img
                          src={pImg}
                          alt={appt.patientName || "Patient"}
                          className="h-10 w-10 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const fb = e.currentTarget.parentElement?.querySelector(".today-fb");
                            if (fb) fb.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        style={pImg ? { display: "none" } : {}}
                        className="today-fb flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100/70 text-sky-800 font-bold text-xs shrink-0 border border-sky-200/60 shadow-xs"
                      >
                        {(appt.patientName || "P").charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {appt.patientName || "Patient"}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                          <Stethoscope className="h-3 w-3 text-sky-600 shrink-0" />
                          <span className="truncate font-medium">
                            Dr. {appt.doctorName || appt.doctor || "Doctor"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100/80 px-2.5 py-1 rounded-xl border border-slate-200/60">
                        <Clock className="h-3 w-3 text-sky-600" />
                        <span>{appt.time || "09:00 AM"}</span>
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                          isCompleted
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : isApproved
                            ? "bg-blue-100 text-blue-800 border border-blue-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {appt.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Registered Patients & Doctor Availability */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Recent Patients */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
            <h3 className="text-base font-bold text-slate-900">
              Recently Registered Patients
            </h3>
            <Link
              to="/admin/patients"
              className="text-xs font-bold text-sky-700 hover:underline"
            >
              View All Patients
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {patients.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No patients registered yet.
              </div>
            ) : (
              sortedPatients.slice(0, 5).map((pt) => {
                const ptImg = pt.image || pt.photoURL || pt.profileImage;
                return (
                  <div
                    key={pt.id}
                    className="flex items-center justify-between py-3 hover:bg-slate-50/70 px-2 rounded-2xl transition -mx-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {ptImg ? (
                        <img
                          src={ptImg}
                          alt={pt.fullName || "Patient"}
                          className="h-10 w-10 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const fallback = e.currentTarget.parentElement?.querySelector(".pt-fallback");
                            if (fallback) fallback.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        style={ptImg ? { display: "none" } : {}}
                        className="pt-fallback flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100/70 font-bold text-xs text-sky-700 shrink-0 border border-sky-200/60 shadow-xs"
                      >
                        {(pt.fullName || pt.email || "P").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {pt.fullName || "Patient"}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {pt.email}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-3">
                      <span className="inline-block text-[11px] font-medium text-slate-600 bg-slate-100/80 px-2.5 py-1 rounded-xl border border-slate-200/60">
                        {pt.phone || "No phone"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Doctor Availability Overview */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
            <h3 className="text-base font-bold text-slate-900">
              Doctors Directory & Status
            </h3>
            <Link
              to="/admin/doctors"
              className="text-xs font-bold text-sky-700 hover:underline"
            >
              Manage Doctors
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {doctors.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No doctors configured in clinic database.
              </div>
            ) : (
              doctors.slice(0, 5).map((docItem) => (
                <div key={docItem.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    {docItem.image ? (
                      <img
                        src={docItem.image}
                        alt={docItem.fullName}
                        className="h-10 w-10 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700 font-bold text-xs shrink-0 border border-sky-100">
                        {docItem.fullName ? docItem.fullName.charAt(0).toUpperCase() : "D"}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-slate-900">{docItem.fullName}</p>
                      <p className="text-[11px] text-slate-500">{docItem.specialization}</p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      docItem.status === "active"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {docItem.status === "active" ? "Active" : "Inactive"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
