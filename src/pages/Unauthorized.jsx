import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldAlert, ArrowLeft, Home, LayoutDashboard } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Unauthorized() {
  const { role, currentUser } = useAuth();
  const navigate = useNavigate();

  const getDashboardPath = () => {
    if (!currentUser) return "/login";
    if (role === "admin") return "/admin/dashboard";
    if (role === "doctor") return "/doctor/dashboard";
    return "/patient/dashboard";
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/60 border border-slate-100">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 mb-6">
          <ShieldAlert className="h-10 w-10" />
        </div>

        <span className="inline-block rounded-full bg-rose-100/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-rose-700 mb-3">
          403 Forbidden
        </span>

        <h1 className="text-2xl font-extrabold text-slate-900">
          Access Restricted
        </h1>

        <p className="mt-3 text-sm text-slate-500 leading-relaxed">
          You do not have administrative or authorized permissions to view this resource.
          Your current account is registered as:{" "}
          <strong className="text-sky-700 capitalize">
            {role || "Unauthenticated"}
          </strong>.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            to={getDashboardPath()}
            className="flex items-center justify-center gap-2 rounded-xl bg-sky-700 px-5 py-3 text-sm font-bold text-white shadow-md shadow-sky-700/20 hover:bg-sky-800 transition"
          >
            <LayoutDashboard className="h-4 w-4" />
            Go to Your Dashboard
          </Link>

          <Link
            to="/"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Home className="h-4 w-4" />
            Return to Public Home
          </Link>
        </div>
      </div>
    </div>
  );
}
