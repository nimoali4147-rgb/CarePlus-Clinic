import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HeartPulse } from "lucide-react";

export default function ProtectedRoute({ allowedRoles, children }) {
  const { currentUser, role, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 animate-bounce items-center justify-center rounded-2xl bg-sky-700 text-white shadow-lg shadow-sky-700/30">
            <HeartPulse className="h-8 w-8 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 animate-ping rounded-full bg-sky-600" />
            <span className="text-sm font-semibold text-slate-600">
              Verifying credentials & role...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    // Preserve current path for redirection after login
    const targetUrl = location.pathname + location.search;
    return <Navigate to={`/login?redirect=${encodeURIComponent(targetUrl)}`} state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && (!role || !allowedRoles.includes(role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
