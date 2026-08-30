import React, { useState, useEffect } from "react";
import { db, auth } from "../lib/firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";

function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [doctorName, setDoctorName] = useState("");

  // Get the currently logged-in doctor's name
  useEffect(() => {
    const user = auth.currentUser;

if (user?.email) {
  const name = user.email.split("@")[0];
  setDoctorName(name.charAt(0).toUpperCase() + name.slice(1));
}
  }, []);

  // Get appointments from Firestore
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "appointments"),
      (snapshot) => {
        const data = [];

        snapshot.forEach((doc) => {
          data.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        setAppointments(data);
      }
    );

    return () => unsub();
  }, []);

  // Confirm appointment
  const handleConfirm = async (id) => {
    const docRef = doc(db, "appointments", id);

    await updateDoc(docRef, {
      status: "Confirmed",
    });
  };

  // Cancel appointment
  const handleCancel = async (id) => {
    const docRef = doc(db, "appointments", id);

    await updateDoc(docRef, {
      status: "Cancelled",
    });
  };

  // Appointment counts
  const pendingCount = appointments.filter(
    (item) => item.status === "Pending"
  ).length;

  const confirmedCount = appointments.filter(
    (item) => item.status === "Confirmed"
  ).length;

  const cancelledCount = appointments.filter(
    (item) => item.status === "Cancelled"
  ).length;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">

      {/* Sidebar */}
      <div className="w-56 bg-white border-r p-5">
        <h2 className="text-xl font-bold text-blue-600 mb-8">
          CarePlus
        </h2>

        <ul className="space-y-3 font-medium text-slate-600">
          <li className="bg-blue-600 text-white p-2.5 rounded-lg cursor-pointer">
            Dashboard
          </li>

          <li className="p-2.5 cursor-pointer">
            Appointments
          </li>

          <li className="p-2.5 cursor-pointer">
            Patients
          </li>

          <li className="p-2.5 cursor-pointer">
            Profile
          </li>

          <li className="p-2.5 mt-10 cursor-pointer">
            Logout
          </li>
        </ul>
      </div>

      {/* Main Dashboard */}
      <div className="flex-1 p-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">

          <h1 className="text-2xl font-bold text-slate-800">
            Welcome back, {doctorName}! 👋
          </h1>

          <div className="text-right">
            <p className="font-bold text-slate-800">
              {doctorName}
            </p>

            <p className="text-xs text-slate-500">
              Doctor
            </p>
          </div>

        </div>

        {/* Statistics */}
        <div className="grid grid-cols-4 gap-4 mb-8">

          <div className="bg-white p-4 rounded-xl border text-center">
            <p className="text-sm text-slate-500">
              Total Appointments
            </p>

            <h3 className="text-2xl font-bold text-blue-600 mt-2">
              {appointments.length}
            </h3>
          </div>

          <div className="bg-white p-4 rounded-xl border text-center">
            <p className="text-sm text-slate-500">
              Pending
            </p>

            <h3 className="text-2xl font-bold text-amber-500 mt-2">
              {pendingCount}
            </h3>
          </div>

          <div className="bg-white p-4 rounded-xl border text-center">
            <p className="text-sm text-slate-500">
              Confirmed
            </p>

            <h3 className="text-2xl font-bold text-emerald-600 mt-2">
              {confirmedCount}
            </h3>
          </div>

          <div className="bg-white p-4 rounded-xl border text-center">
            <p className="text-sm text-slate-500">
              Cancelled
            </p>

            <h3 className="text-2xl font-bold text-red-500 mt-2">
              {cancelledCount}
            </h3>
          </div>

        </div>

        {/* Appointments */}
        <div className="bg-white p-6 rounded-xl border">

          <h2 className="text-lg font-bold text-slate-800 mb-4">
            Today's Appointments
          </h2>

          <table className="w-full text-left border-collapse">

            <thead>
              <tr className="bg-slate-100 text-slate-600 text-sm">
                <th className="p-3">Time</th>
                <th className="p-3">Patient</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y text-sm text-slate-700">

              {appointments.map((item) => (

                <tr key={item.id}>

                  <td className="p-3">
                    {item.time}
                  </td>

                  <td className="p-3 font-semibold text-slate-900">
                    {item.patientName || item.patient}
                  </td>

                  <td className="p-3">
                    {item.reason}
                  </td>

                  <td className="p-3">

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        item.status === "Confirmed"
                          ? "bg-emerald-100 text-emerald-700"
                          : item.status === "Cancelled"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {item.status}
                    </span>

                  </td>

                  <td className="p-3">

                    {item.status === "Pending" ? (

                      <div className="space-x-2">

                        <button
                          onClick={() =>
                            handleConfirm(item.id)
                          }
                          className="bg-blue-600 text-white px-3 py-1 rounded-md text-xs font-semibold"
                        >
                          Confirm
                        </button>

                        <button
                          onClick={() =>
                            handleCancel(item.id)
                          }
                          className="bg-red-100 text-red-600 px-3 py-1 rounded-md text-xs font-semibold"
                        >
                          Cancel
                        </button>

                      </div>

                    ) : (

                      <button className="bg-slate-100 text-slate-600 px-3 py-1 rounded-md text-xs font-semibold">
                        View
                      </button>

                    )}

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>
    </div>
  );
}

export default DoctorDashboard;