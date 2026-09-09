import React, { useState } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Stethoscope,
  Users,
  Calendar,
  Clock,
  BarChart3,
  Settings,
  LogOut,
  HeartPulse,
  Bell,
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  UserCog,
  UserPlus,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "../components/NotificationBell";

export default function AdminLayout() {
  const { currentUser, userProfile, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Doctors", path: "/admin/doctors", icon: Stethoscope },
    { name: "Patients", path: "/admin/patients", icon: Users },
    { name: "User Registration", path: "/admin/users", icon: UserPlus },
    { name: "Appointments", path: "/admin/appointments", icon: Calendar },
    { name: "Schedules", path: "/admin/schedules", icon: Clock },
    { name: "Reports & Analytics", path: "/admin/reports", icon: BarChart3 },
    { name: "Clinic Settings", path: "/admin/settings", icon: Settings },
    { name: "My Profile", path: "/admin/profile", icon: UserCog },
  ];

  const adminName = userProfile?.fullName || currentUser?.displayName || "System Administrator";

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 font-sans">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Desktop & Mobile Sidebar — scrollable so Sign Out is never cut off */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 shrink-0 flex-col bg-slate-900 text-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ scrollbarWidth: "thin", scrollbarColor: "#334155 transparent" }}
      >
        {/* ── Scrollable inner wrapper ── */}
        <div className="flex flex-col flex-1 overflow-y-auto px-4 py-5 gap-0">

          {/* Brand Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <Link to="/admin/dashboard" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-600/30">
                <HeartPulse className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-lg font-black tracking-tight text-white">
                  CarePlus
                </span>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-sky-400">
                  Admin Portal
                </span>
              </div>
            </Link>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Items — takes all remaining space */}
          <nav className="flex-1 space-y-1 pt-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === "/admin/dashboard"
                  ? location.pathname === "/admin/dashboard"
                  : location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? "bg-sky-600 text-white shadow-md shadow-sky-600/20"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                    <span>{item.name}</span>
                  </div>
                  {isActive && <ChevronRight className="h-3.5 w-3.5 text-white/80" />}
                </NavLink>
              );
            })}
          </nav>

          {/* ── Sidebar Footer — always visible at bottom of scroll ── */}
          <div className="mt-3 space-y-1 border-t border-slate-800 pt-3">
            <Link
              to="/"
              target="_blank"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
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

        </div>{/* end scrollable inner */}
      </aside>

      {/* Main Administrative Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Sticky Header */}
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
                Clinic Administration
              </h1>
              <p className="hidden sm:block text-xs text-slate-500">
                CarePlus Central Operational & Clinical Control
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Real-time Notification Bell */}
            <NotificationBell role="admin" />

            {/* Admin Profile Chip */}
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              {userProfile?.image || userProfile?.profileImage || currentUser?.photoURL ? (
                <img
                  src={userProfile?.image || userProfile?.profileImage || currentUser?.photoURL}
                  alt={adminName}
                  className="h-10 w-10 rounded-xl object-cover border-2 border-purple-600 shadow-sm shadow-purple-600/20 shrink-0"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 font-extrabold text-sm text-white shadow-sm shadow-purple-600/20 shrink-0">
                  {adminName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="hidden md:block">
                <p className="text-xs font-bold text-slate-900 leading-tight">{adminName}</p>
                <p className="text-[10px] font-extrabold text-purple-700 uppercase tracking-wider">
                  SUPER ADMIN
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
