import React, { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Users, Calendar, Stethoscope, CheckCircle2, DollarSign } from "lucide-react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function AdminReports() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAppts = onSnapshot(collection(db, "appointments"), (snap) => {
      setAppointments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    const unsubDocs = onSnapshot(collection(db, "doctors"), (snap) => {
      setDoctors(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPatients(all.filter((u) => (u.role || "").toLowerCase() === "patient" || (u.role || "").toLowerCase() === "user"));
    });

    return () => {
      unsubAppts();
      unsubDocs();
      unsubUsers();
    };
  }, []);

  // Specialty Breakdown
  const specialtyCounts = {};
  appointments.forEach((a) => {
    const spec = a.specialty || "General";
    specialtyCounts[spec] = (specialtyCounts[spec] || 0) + 1;
  });

  // Estimated Revenue from Completed visits
  const completedAppts = appointments.filter((a) => (a.status || "").toLowerCase() === "completed");
  const estimatedRevenue = completedAppts.reduce((sum, a) => sum + (Number(a.consultationFee) || 50), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Clinical Reports & Metrics
        </h2>
        <p className="text-xs text-slate-500">
          Aggregated analytics on patient traffic, doctor appointment distribution, and treatment outcomes.
        </p>
      </div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-500">Total Appointments</p>
          <h3 className="text-3xl font-black text-slate-900 mt-2">{appointments.length}</h3>
          <p className="text-xs text-slate-400 mt-1">Across all medical departments</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-500">Completed Consultations</p>
          <h3 className="text-3xl font-black text-emerald-600 mt-2">{completedAppts.length}</h3>
          <p className="text-xs text-slate-400 mt-1">Treated patients</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-500">Estimated Clinic Inflow</p>
          <h3 className="text-3xl font-black text-sky-700 mt-2">${estimatedRevenue.toLocaleString()}</h3>
          <p className="text-xs text-slate-400 mt-1">From completed appointments</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-500">Registered Patient Base</p>
          <h3 className="text-3xl font-black text-purple-700 mt-2">{patients.length}</h3>
          <p className="text-xs text-slate-400 mt-1">Active verified accounts</p>
        </div>
      </div>

      {/* Specialty Breakdown */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4 border-b border-slate-100 pb-3">
          Appointments by Medical Specialty
        </h3>

        {Object.keys(specialtyCounts).length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No appointment data available yet.
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(specialtyCounts).map(([spec, count]) => {
              const percentage = Math.round((count / (appointments.length || 1)) * 100);
              return (
                <div key={spec} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>{spec}</span>
                    <span>{count} appointments ({percentage}%)</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-sky-600 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
