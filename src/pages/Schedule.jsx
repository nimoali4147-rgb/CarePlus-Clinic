import React, { useState, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Link } from "react-router-dom";
import {
  HeartPulse,
  Stethoscope,
  LayoutDashboard,
  CalendarCheck,
  Users,
  Clock,
  LogOut,
  Save,
  CheckCircle2,
  CalendarDays
} from "lucide-react";

function Schedule() {
  const [schedule, setSchedule] = useState([
    { id: "mon", day: "Monday", available: true, start: "09:00", end: "17:00" },
    { id: "tue", day: "Tuesday", available: true, start: "09:00", end: "17:00" },
    { id: "wed", day: "Wednesday", available: true, start: "09:00", end: "17:00" },
    { id: "thu", day: "Thursday", available: true, start: "09:00", end: "17:00" },
    { id: "fri", day: "Friday", available: true, start: "09:00", end: "17:00" },
    { id: "sat", day: "Saturday", available: false, start: "09:00", end: "13:00" },
    { id: "sun", day: "Sunday", available: false, start: "09:00", end: "13:00" }
  ]);

  const [isSaved, setIsSaved] = useState(false);
  const [doctorName, setDoctorName] = useState("");
  const [doctorSpecialty, setDoctorSpecialty] = useState("General Specialist");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const emailName = user.email ? user.email.split("@")[0] : "Doctor";
        setDoctorName(emailName.charAt(0).toUpperCase() + emailName.slice(1));

        try {
          const docRef = doc(db, "doctors", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists() && docSnap.data().specialty) {
            setDoctorSpecialty(docSnap.data().specialty);
            if (docSnap.data().name) {
              setDoctorName(docSnap.data().name);
            }
          } else {
            const localRole = localStorage.getItem("doctorSpecialty");
            if (localRole) setDoctorSpecialty(localRole);
          }
        } catch (error) {
          console.error("Error fetching doctor role:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const toggleAvailability = (id) => {
    setSchedule((prevSchedule) =>
      prevSchedule.map((item) =>
        item.id === id ? { ...item, available: !item.available } : item
      )
    );
  };

  const handleTimeChange = (id, field, value) => {
    setSchedule((prevSchedule) =>
      prevSchedule.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSave = () => {
    localStorage.setItem("doctorSchedule", JSON.stringify(schedule));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const workingDaysCount = schedule.filter((item) => item.available).length;

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-800">
      {/* Sidebar */}
      <aside className="w-64  bg-sky-800 text-white p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <HeartPulse className="h-6 w-6 text-sky-200" />
            <h1 className="text-xl font-bold">CarePlus</h1>
          </div>

          <nav className="space-y-3 font-medium">
            <Link to="/dashboard" className="flex items-center gap-3 hover:text-sky-200">
              <LayoutDashboard className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
            <Link to="/schedule" className="flex items-center gap-3 font-bold text-sky-200">
              <Clock className="h-5 w-5" />
              <span>Schedule</span>
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
     
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="inline-flex items-center gap-1 text-xs font-bold bg-sky-100 text-sky-800 px-3 py-1 rounded-full">
              <Stethoscope className="h-4 w-4" />
              {doctorSpecialty}
            </span>
            <h1 className="text-3xl font-bold text-sky-800 mt-2">
              My Schedule
            </h1>
          </div>

          <div className="flex items-center gap-3 bg-white p-2 px-4 rounded-full border shadow-sm">
            <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center font-bold">
              {doctorName ? doctorName.charAt(0) : "D"}
            </div>
            <p className="text-sm font-bold text-sky-800">
              Dr. {doctorName || "Doctor"}
            </p>
          </div>
        </div>

     
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border shadow-sm flex items-center gap-4">
            <CalendarDays className="h-6 w-6 text-sky-600" />
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">Working Days</p>
              <p className="text-lg font-bold text-sky-800">{workingDaysCount} Days / Week</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border shadow-sm flex items-center gap-4">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">Status</p>
              <p className="text-lg font-bold text-emerald-600">
                {workingDaysCount > 0 ? "Available for Consultation" : "Unavailable"}
              </p>
            </div>
          </div>
        </div>

        
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4 pb-4 border-b">
            <h2 className="text-lg font-bold text-sky-800">Weekly Schedule Settings</h2>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
            >
              <Save className="h-4 w-4" />
              {isSaved ? "Saved!" : "Save Changes"}
            </button>
          </div>

          <div className="space-y-4">
            {schedule.map((item) => {
            
              const rowBackground = item.available ? "bg-white" : "bg-gray-50";
              const statusColor = item.available ? "text-emerald-600" : "text-gray-400";
              const statusText = item.available ? "Available" : "Unavailable";

              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-3 border-b ${rowBackground}`}
                >
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={item.available}
                      onChange={() => toggleAvailability(item.id)}
                      className="h-5 w-5 accent-sky-600 cursor-pointer"
                    />
                    <div>
                      <p className="font-semibold text-sm">{item.day}</p>
                      <p className={`text-xs ${statusColor}`}>{statusText}</p>
                    </div>
                  </div>

                  {item.available ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Start</span>
                      <input
                        type="time"
                        value={item.start}
                        onChange={(e) => handleTimeChange(item.id, "start", e.target.value)}
                        className="border rounded p-1 text-xs"
                      />
                      <span className="text-gray-400">—</span>
                      <span className="text-xs text-gray-400">End</span>
                      <input
                        type="time"
                        value={item.end}
                        onChange={(e) => handleTimeChange(item.id, "end", e.target.value)}
                        className="border rounded p-1 text-xs"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded">
                      Off Day
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Schedule;