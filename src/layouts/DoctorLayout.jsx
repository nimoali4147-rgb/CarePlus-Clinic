import React, { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Clock,
  User,
  LogOut,
  HeartPulse,
  Menu,
  X,
  Stethoscope,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "../components/NotificationBell";

export default function DoctorLayout() {
  const { currentUser, userProfile, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(
      doc(db, "doctors", currentUser.uid),
      (snap) => {
        if (snap.exists()) {
          setDoctorProfile(snap.data());
        }
      },
      (err) => {
        console.error("Error loading doctor profile:", err);
      }
    );
    return () => unsub();
  }, [currentUser]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", path: "/doctor/dashboard", icon: LayoutDashboard },
    { name: "My Appointments", path: "/doctor/appointments", icon: Calendar },
    { name: "My Schedule", path: "/doctor/schedule", icon: Clock },
    { name: "Doctor Profile", path: "/doctor/profile", icon: User },
  ];

  const doctorName = doctorProfile?.fullName || userProfile?.fullName || currentUser?.displayName || "Doctor";
  const doctorSpecialty = doctorProfile?.specialization || "Specialist Doctor";
  const doctorImage = doctorProfile?.image || userProfile?.image || "";

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 font-sans">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Desktop & Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 shrink-0 flex-col bg-sky-950 text-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ scrollbarWidth: "thin", scrollbarColor: "#0369a1 transparent" }}
      >
        <div className="flex flex-col flex-1 overflow-y-auto px-4 py-5 gap-0">
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-4 border-b border-sky-900">
            <Link to="/doctor/dashboard" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-600/30">
                <HeartPulse className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-lg font-black tracking-tight text-white">
                  CarePlus
                </span>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-sky-400">
                  Doctor Portal
                </span>
              </div>
            </Link>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg p-1.5 text-sky-400 hover:bg-sky-900 hover:text-white lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 space-y-1 pt-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === "/doctor/dashboard"
                  ? location.pathname === "/doctor/dashboard"
                  : location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? "bg-sky-600 text-white shadow-md shadow-sky-600/20"
                      : "text-sky-200 hover:bg-sky-900/60 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-sky-300"}`} />
                    <span>{item.name}</span>
                  </div>
                  {isActive && <ChevronRight className="h-3.5 w-3.5 text-white/80" />}
                </NavLink>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="mt-3 space-y-1 border-t border-sky-900 pt-3">
            <Link
              to="/"
              target="_blank"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-sky-300 hover:bg-sky-900 hover:text-white transition"
            >
              <ExternalLink className="h-4 w-4" />
              Public Website
            </Link>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Sticky Header / Navbar */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/95 px-6 backdrop-blur-md lg:px-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Doctor Portal
              </h1>
              <p className="hidden sm:block text-xs text-slate-500">
                CarePlus Clinical Workspace & Patient Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Real-time Notification Bell */}
            <NotificationBell
              role="doctor"
              doctorId={currentUser?.uid}
              doctorName={doctorName}
            />

            {/* Doctor Profile Chip */}
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              {doctorImage ? (
                <img
                  src={doctorImage}
                  alt={doctorName}
                  className="h-10 w-10 rounded-xl object-cover border-2 border-sky-600 shadow-sm"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-700 font-extrabold text-sm text-white shadow-sm shadow-sky-700/20">
                  {doctorName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="hidden md:block">
                <p className="text-xs font-bold text-slate-900 leading-tight">{doctorName}</p>
                <p className="text-[10px] font-semibold text-sky-700 uppercase tracking-wider">
                  {doctorSpecialty}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Nested Page Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
