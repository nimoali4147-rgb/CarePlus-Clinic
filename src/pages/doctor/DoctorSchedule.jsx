import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  HeartPulse,
  LayoutDashboard,
  Calendar,
  Clock,
  CheckCircle2,
  User,
  LogOut,
  CalendarDays,
  ShieldCheck,
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";

export default function DoctorSchedule() {
  const { currentUser, userProfile, logout } = useAuth();
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [schedule, setSchedule] = useState([
    { id: "monday", day: "Monday", available: false, start: "09:00", end: "17:00" },
    { id: "tuesday", day: "Tuesday", available: false, start: "09:00", end: "17:00" },
    { id: "wednesday", day: "Wednesday", available: false, start: "09:00", end: "17:00" },
    { id: "thursday", day: "Thursday", available: false, start: "09:00", end: "17:00" },
    { id: "friday", day: "Friday", available: false, start: "09:00", end: "17:00" },
    { id: "saturday", day: "Saturday", available: false, start: "09:00", end: "13:00" },
    { id: "sunday", day: "Sunday", available: false, start: "09:00", end: "13:00" },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const fetchDoc = async () => {
      try {
        const snap = await getDoc(doc(db, "doctors", currentUser.uid));
        if (snap.exists()) {
          setDoctorProfile(snap.data());
          const avail = snap.data().availability;
          if (avail) {
            setSchedule((prev) =>
              prev.map((item) => {
                const key = item.id;
                if (avail[key]) return { ...item, ...avail[key] };
                return item;
              })
            );
          }
        }
      } catch (err) {
        console.error("Error loading doctor schedule:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [currentUser]);

  const workingDaysCount = schedule.filter((s) => s.available).length;
  const doctorName = doctorProfile?.fullName || userProfile?.fullName || "Doctor";

  const formatTime = (t) => {
    if (!t) return "—";
    const [h, m] = t.split(":");
    const hr = parseInt(h, 10);
    const ampm = hr >= 12 ? "PM" : "AM";
    const display = hr > 12 ? hr - 12 : hr === 0 ? 12 : hr;
    return `${display}:${m} ${ampm}`;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">

          {/* Header */}
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              My Weekly Schedule
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Your consultation hours as configured by the clinic administrator.
            </p>
          </div>

          {/* Admin notice */}
          <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-xs font-semibold text-amber-800 border border-amber-200">
            <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
            <span>Your schedule is managed by the clinic admin. Contact your administrator to request changes to your working hours.</span>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-sky-50 text-sky-700 rounded-2xl">
                <CalendarDays className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Active Duty</p>
                <p className="text-lg font-black text-slate-900">{workingDaysCount} Days / Week</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Status</p>
                <p className={`text-lg font-black ${workingDaysCount > 0 ? "text-emerald-600" : "text-slate-400"}`}>
                  {workingDaysCount > 0 ? "Open for Appointments" : "Unavailable"}
                </p>
              </div>
            </div>
          </div>

          {/* Schedule List (Read-Only) */}
          <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3">
              Weekly Working Hours
            </h2>

            <div className="space-y-2.5">
              {schedule.map((item) => (
                <div
                  key={item.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border transition ${
                    item.available
                      ? "border-sky-100 bg-sky-50/25"
                      : "border-slate-100 bg-slate-50/50 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`h-3 w-3 rounded-full ${item.available ? "bg-emerald-500" : "bg-slate-300"}`} />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{item.day}</p>
                      <span className={`text-[10px] font-extrabold uppercase ${item.available ? "text-emerald-600" : "text-slate-400"}`}>
                        {item.available ? "Available" : "Off Duty"}
                      </span>
                    </div>
                  </div>

                  {item.available ? (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-1.5 font-semibold text-slate-700">
                        {formatTime(item.start)}
                      </span>
                      <span className="text-slate-400 font-bold">→</span>
                      <span className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-1.5 font-semibold text-slate-700">
                        {formatTime(item.end)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">No slots scheduled</span>
                  )}
                </div>
              ))}
            </div>
          </div>
    </div>
  );
}
