import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, Stethoscope, Calendar, CheckCircle2, XCircle, Edit, ArrowRight } from "lucide-react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function AdminSchedules() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "doctors"), (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setDoctors(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Clinic Schedules & Doctor Rosters
          </h2>
          <p className="text-xs text-slate-500">
            Overview of working days, consultation hours, and off-duty schedules across all clinic specialists.
          </p>
        </div>
      </div>

      {/* Grid of Doctor Rosters */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">
            Loading clinic schedules...
          </div>
        ) : doctors.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-dashed border-slate-200 p-12 text-center text-xs text-slate-400">
            No doctors available to display schedules.
          </div>
        ) : (
          doctors.map((doctor) => {
            const availability = doctor.availability || {};
            return (
              <div
                key={doctor.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
              >
                {/* Doctor Head */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={doctor.image || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=60"}
                      alt={doctor.fullName}
                      className="h-11 w-11 rounded-2xl object-cover border border-slate-200"
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{doctor.fullName}</h3>
                      <p className="text-xs text-sky-700 font-semibold">{doctor.specialization}</p>
                    </div>
                  </div>

                  <Link
                    to={`/admin/doctors/${doctor.id}/edit`}
                    className="flex items-center gap-1 text-xs font-bold text-sky-700 hover:underline"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Edit Roster
                  </Link>
                </div>

                {/* Days matrix */}
                <div className="space-y-1.5 text-xs">
                  {days.map((d) => {
                    const slot = availability[d] || { available: false, start: "09:00", end: "17:00" };
                    return (
                      <div
                        key={d}
                        className={`flex items-center justify-between rounded-xl px-3.5 py-2 ${
                          slot.available ? "bg-sky-50/50 text-slate-800" : "bg-slate-50 text-slate-400"
                        }`}
                      >
                        <span className="capitalize font-semibold">{d}</span>
                        {slot.available ? (
                          <span className="font-bold text-sky-800">
                            {slot.start} — {slot.end}
                          </span>
                        ) : (
                          <span className="text-[11px] italic">Off Day</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
