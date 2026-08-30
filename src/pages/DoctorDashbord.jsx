import React, { useState, useEffect } from "react";
import { auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Link } from "react-router-dom";
import { UserRound, HeartPulse } from "lucide-react";


function DoctorDashboard() {
    const [appointments, setAppointments] = useState([]);
    const [doctorName, setDoctorName] = useState("");

   

useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user?.email) {
            const name = user.email.split("@")[0];

            setDoctorName(
                name.charAt(0).toUpperCase() + name.slice(1)
            );
        }
    });

    return () => unsubscribe();
}, []);

useEffect(() => {
    const savedAppointments =
        JSON.parse(localStorage.getItem("appointments")) || [];

    setAppointments(savedAppointments);
}, []);
const handleConfirm = (id) => {
  const appointments =
    JSON.parse(localStorage.getItem("appointments")) || [];

  const updatedAppointments = appointments.map((item) =>
    item.id === id
      ? { ...item, status: "Confirmed" }
      : item
  );

  localStorage.setItem(
    "appointments",
    JSON.stringify(updatedAppointments)
  );

  setAppointments(updatedAppointments);
};

const handleCancel = (id) => {
  const appointments =
    JSON.parse(localStorage.getItem("appointments")) || [];

  const updatedAppointments = appointments.map((item) =>
    item.id === id
      ? { ...item, status: "Cancelled" }
      : item
  );

  localStorage.setItem(
    "appointments",
    JSON.stringify(updatedAppointments)
  );

  setAppointments(updatedAppointments);
};
const handleDelete = (id) => {
    const appointments =
        JSON.parse(localStorage.getItem("appointments")) || [];

    const updatedAppointments = appointments.filter(
        (item) => item.id !== id
    );

    localStorage.setItem(
        "appointments",
        JSON.stringify(updatedAppointments)
    );

    setAppointments(updatedAppointments);
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
    <div className="flex min-h-screen bg-slate-100 font-sans">

        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 p-6">

            <div className="flex items-center gap-2 mb-10">
                <HeartPulse className="h-8 w-8 text-sky-700" />

                <h1 className="text-2xl font-bold text-sky-700">
                    CarePlus
                </h1>
            </div>

            <nav>
                <ul className="space-y-3 font-semibold text-sky-700">

                    <li className="rounded-xl bg-sky-700 px-4 py-3 text-white">
                        Dashboard
                    </li>

                    <li className="rounded-xl px-4 py-3 hover:bg-sky-50 cursor-pointer">
                        <Link to="/appointments" className="block">
                            Appointments
                        </Link>
                    </li>

                    <li className="rounded-xl px-4 py-3 hover:bg-sky-50 cursor-pointer">
                        <Link to="/patients" className="block">
                            Patients
                        </Link>
                    </li>

                    <li className="rounded-xl px-4 py-3 hover:bg-sky-50 cursor-pointer">
                        <Link to="/profile" className="block">
                            Profile
                        </Link>
                    </li>

                    <li className="mt-10 rounded-xl px-4 py-3 text-red-600 hover:bg-red-50 cursor-pointer">
                        <Link to="/" className="block">
                            Logout
                        </Link>
                    </li>

                </ul>
            </nav>
        </aside>


        {/* Main Content */}
        <main className="flex-1 p-8">

            {/* Header */}
            <div className="flex items-center justify-between mb-8">

                <div>
                    <p className="text-sm font-medium text-slate-500">
                        Doctor Dashboard
                    </p>

                    <h1 className="mt-1 text-3xl font-bold text-sky-800">
                        Welcome back, {doctorName}! 👋
                    </h1>
                </div>

                <div className="flex items-center gap-3">

                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100">
                        <UserRound className="h-6 w-6 text-sky-700" />
                    </div>

                    <div>
                        <p className="font-bold text-sky-800">
                            {doctorName}
                        </p>

                        <p className="text-sm text-slate-500">
                            Doctor
                        </p>
                    </div>

                </div>
            </div>


            {/* Statistics */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">

                <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">
                        Total Appointments
                    </p>

                    <h2 className="mt-3 text-3xl font-bold text-sky-700">
                        {appointments.length}
                    </h2>
                </div>


                <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">
                        Pending
                    </p>

                    <h2 className="mt-3 text-3xl font-bold text-amber-500">
                        {pendingCount}
                    </h2>
                </div>


                <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">
                        Confirmed
                    </p>

                    <h2 className="mt-3 text-3xl font-bold text-emerald-600">
                        {confirmedCount}
                    </h2>
                </div>


                <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">
                        Cancelled
                    </p>

                    <h2 className="mt-3 text-3xl font-bold text-red-500">
                        {cancelledCount}
                    </h2>
                </div>

            </div>


            {/* Appointments */}
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm">

                {/* Section Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

                    <div>
                        <h2 className="text-xl font-bold text-sky-800">
                            Appointments
                        </h2>
                    </div>

                    <div className="rounded-full bg-sky-50 px-4 py-2">
                        <span className="text-sm font-semibold text-sky-700">
                            {appointments.length} Appointments
                        </span>
                    </div>

                </div>


                {/* Table */}
                <div className="overflow-x-auto p-6">

                    <table className="w-full text-left">

                        <thead>
                            <tr className="bg-slate-100 text-sky-700">

                                <th className="rounded-l-xl px-5 py-4 text-sm font-bold">
                                    Date
                                </th>

                                <th className="px-5 py-4 text-sm font-bold">
                                    Time
                                </th>

                                <th className="px-5 py-4 text-sm font-bold">
                                    Patient
                                </th>

                                <th className="px-5 py-4 text-sm font-bold">
                                    Reason
                                </th>

                                <th className="px-5 py-4 text-sm font-bold">
                                    Status
                                </th>

                                <th className="rounded-r-xl px-5 py-4 text-sm font-bold">
                                    Action
                                </th>

                            </tr>
                        </thead>


                        <tbody>

                            {appointments.map((item) => (

                                <tr
                                    key={item.id}
                                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition"
                                >

                                    <td className="px-5 py-5 text-sm text-slate-700 whitespace-nowrap">
                                        {item.date}
                                    </td>


                                    <td className="px-5 py-5 text-sm text-slate-700 whitespace-nowrap">
                                        {item.time}
                                    </td>


                                    <td className="px-5 py-5 text-sm font-bold text-slate-900">
                                        {item.patientName || item.patient}
                                    </td>


                                    <td className="px-5 py-5 text-sm text-slate-700">
                                        {item.reason}
                                    </td>


                                    <td className="px-5 py-5">

                                        <span
                                            className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold
                                            ${
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


                                    <td className="px-5 py-5">

                                        <div className="flex items-center gap-2 whitespace-nowrap">

                                            {item.status === "Pending" && (
                                                <>
                                                    <button
                                                        onClick={() =>
                                                            handleConfirm(item.id)
                                                        }
                                                        className="rounded-lg bg-sky-700 px-4 py-2 text-xs font-bold text-white hover:bg-sky-800 transition"
                                                    >
                                                        Confirm
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            handleCancel(item.id)
                                                        }
                                                        className="rounded-lg bg-red-50 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100 transition"
                                                    >
                                                        Cancel
                                                    </button>
                                                </>
                                            )}

                                            <button
                                                onClick={() =>
                                                    handleDelete(item.id)
                                                }
                                                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition"
                                            >
                                                Delete
                                            </button>

                                        </div>

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

            </div>

        </main>

    </div>
);
}

export default DoctorDashboard;