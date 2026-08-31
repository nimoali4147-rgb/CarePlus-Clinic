import React, { useState, useEffect } from "react";
import { adminAuth } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Link } from "react-router-dom";
import {
    UserRound,
    HeartPulse,
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    Trash2,
    LayoutDashboard,
    CalendarCheck,
    User,
    LogOut,
    UserPlus,
    CheckCheck,
    CalendarDays
} from "lucide-react";

function DoctorDashboard() {
    const [appointments, setAppointments] = useState([]);
    const [doctorName, setDoctorName] = useState("");

    const today = new Date();

    const todayStr =
        today.getFullYear() +
        "-" +
        String(today.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(today.getDate()).padStart(2, "0");

    useEffect(() => {
        const unsub = onAuthStateChanged(adminAuth, (usr) => {
            if (usr?.email) {
                const name = usr.email.split("@")[0];
                setDoctorName(name.charAt(0).toUpperCase() + name.slice(1));
            }
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        const data = JSON.parse(localStorage.getItem("appointments")) || [];
        setAppointments(data);
    }, []);

    const updateStatus = (id, newStatus) => {
        const list = JSON.parse(localStorage.getItem("appointments")) || [];
        const updated = list.map((item) =>
            item.id === id ? { ...item, status: newStatus } : item
        );
        localStorage.setItem("appointments", JSON.stringify(updated));
        setAppointments(updated);
    };

    const handleDelete = (id) => {
        const list = JSON.parse(localStorage.getItem("appointments")) || [];
        const updated = list.filter((item) => item.id !== id);
        localStorage.setItem("appointments", JSON.stringify(updated));
        setAppointments(updated);
    };

    const handleLogout = async () => {
        await signOut(adminAuth);
        navigate("/");
    };

    const todayCount = appointments.filter((item) => item.date === todayStr).length;
    const newReqCount = appointments.filter((item) => item.status === "Pending" || item.status === "New Request").length;
    const completedCount = appointments.filter((item) => item.status === "Completed").length;
    const confirmedCount = appointments.filter((item) => item.status === "Confirmed").length;

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800">
            <aside className="w-64 bg-sky-800  border-r border-slate-200 p-6 flex flex-col justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-8 px-2">
                        <div className="p-2 bg-sky-100 rounded-xl">
                            <HeartPulse className="h-6 w-6 text-sky-600" />
                        </div>
                        <h1 className="text-xl font-bold text-white tracking-tight">
                            CarePlus
                        </h1>
                    </div>

                    <nav>
                        <ul className="space-y-1 font-medium">
                            <li>
                                <Link to="/dashboard" className="flex items-center gap-3 rounded-xl bg-slate-100 px-4 py-3 text-sky-700 shadow-l shadow-sky-200 transition">
                                    <LayoutDashboard className="h-5 w-5" />
                                    <span>Dashboard</span>
                                </Link>
                            </li>

                            <li>
                                <Link to="/schedule" className="flex items-center gap-3 rounded-xl px-4 py-3 text-white">
                                    <Clock className="h-5 w-5" />
                                    <span>Schedule</span>
                                </Link>
                            </li>

                        </ul>
                    </nav>
                </div>

                <div>
                    <Link to="/" className="flex items-center gap-3 rounded-xl px-4 py-3 text-white">
                        <LogOut className="h-5 w-5" />
                        <span>Logout</span>
                    </Link>
                </div>
            </aside>

            <main className="flex-1 p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>

                        <h1 className="mt-1 text-2xl font-bold text-sky-700">
                            Welcome back, Dr. {doctorName || "Doctor"}! 👋
                        </h1>
                    </div>

                    <div className="flex items-center gap-3 bg-white p-2 pr-4 rounded-full border border-slate-200 shadow-sm">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-700 font-bold">
                            {doctorName ? doctorName.charAt(0) : <UserRound className="h-5 w-5" />}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-sky-800 leading-none">
                                Dr. {doctorName}
                            </p>
                            <p className="text-xs text-sky-700 mt-1">
                                Medical Specialist
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                    <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-sky-700 uppercase tracking-wider">
                                Today's Appointments
                            </p>
                            <h2 className="mt-2 text-3xl font-extrabold text-sky-700">
                                {todayCount}
                            </h2>
                        </div>
                        <div className="p-3 bg-sky-50 rounded-xl text-sky-600">
                            <CalendarDays className="h-6 w-6" />
                        </div>
                    </div>

                    <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                                New Patient Requests
                            </p>
                            <h2 className="mt-2 text-3xl font-extrabold text-amber-800">
                                {newReqCount}
                            </h2>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-xl text-amber-800">
                            <UserPlus className="h-6 w-6" />
                        </div>
                    </div>

                    <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-sky-700 uppercase tracking-wider">
                                Confirmed
                            </p>
                            <h2 className="mt-2 text-3xl font-extrabold text-sky-700">
                                {confirmedCount}
                            </h2>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-xl text-sky-700">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                    </div>

                    <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                                Completed Patients
                            </p>
                            <h2 className="mt-2 text-3xl font-extrabold text-emerald-700">
                                {completedCount}
                            </h2>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700">
                            <CheckCheck className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                        <h2 className="text-lg font-bold text-sky-7000">
                            Appointment Management
                        </h2>
                        <span className="text-xs font-semibold bg-sky-50 text-sky-700 px-3 py-1.5 rounded-full border border-sky-100">
                            {appointments.length} Total Bookings
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 text-xs uppercase font-semibold">
                                    <th className="px-6 py-4">Date & Time</th>
                                    <th className="px-6 py-4">Patient</th>
                                    <th className="px-6 py-4">Reason</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100 text-sm">
                                {appointments.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-12 text-slate-400">
                                            No patient appointments available.
                                        </td>
                                    </tr>
                                ) : (
                                    appointments.map((item) => {
                                        const isToday = item.date === todayStr;

                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                                                        <Calendar className="h-4 w-4 text-slate-400" />
                                                        {item.date}
                                                        {isToday && (
                                                            <span className="text-[10px] uppercase font-extrabold bg-sky-100 text-sky-700 px-2 py-0.5 rounded-md">
                                                                Today
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-slate-400 mt-0.5 ml-6">
                                                        {item.time}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">
                                                    {item.patientName || item.patient || "Unknown Patient"}
                                                </td>

                                                <td className="px-6 py-4 text-slate-600 max-w-xs truncate">
                                                    {item.reason || "N/A"}
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === "Completed"
                                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                            : item.status === "Confirmed"
                                                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                                                : item.status === "Cancelled"
                                                                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                                                                    : "bg-amber-50 text-amber-700 border border-amber-200"
                                                            }`}
                                                    >
                                                        <span className={`h-1.5 w-1.5 rounded-full ${item.status === "Completed"
                                                            ? "bg-emerald-500"
                                                            : item.status === "Confirmed"
                                                                ? "bg-blue-500"
                                                                : item.status === "Cancelled"
                                                                    ? "bg-rose-500"
                                                                    : "bg-amber-500"
                                                            }`} />
                                                        {item.status}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {(item.status === "Pending" || item.status === "New Request") && (
                                                            <>
                                                                <button
                                                                    onClick={() => updateStatus(item.id, "Confirmed")}
                                                                    className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition"
                                                                >
                                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                                    Confirm
                                                                </button>

                                                                <button
                                                                    onClick={() => updateStatus(item.id, "Cancelled")}
                                                                    className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition"
                                                                >
                                                                    <XCircle className="h-3.5 w-3.5" />
                                                                    Cancel
                                                                </button>
                                                            </>
                                                        )}

                                                        {item.status === "Confirmed" && (
                                                            <button
                                                                onClick={() => updateStatus(item.id, "Completed")}
                                                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-100 transition"
                                                            >
                                                                <CheckCheck className="h-3.5 w-3.5" />
                                                                Complete
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={() => handleDelete(item.id)}
                                                            className="inline-flex items-center p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                                            title="Delete appointment"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default DoctorDashboard;