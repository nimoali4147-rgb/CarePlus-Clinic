import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  HeartPulse,
  UserRound,
  LogOut,
  ShieldCheck,
  Stethoscope,
  LayoutDashboard,
  Calendar,
  User,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

function Navbar({ hideHero = false }) {
  const { currentUser, userProfile, role, authLoading, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const displayName =
    userProfile?.fullName ||
    currentUser?.displayName ||
    currentUser?.email?.split("@")[0] ||
    "User";

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-md">
        <nav className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6 lg:px-8">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-700 text-white shadow-md shadow-sky-700/20">
              <HeartPulse className="h-6 w-6" />
            </div>

            <div className="leading-tight">
              <span className="block text-2xl font-black tracking-tight text-sky-800">
                CarePlus
              </span>
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Clinic Management
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="hidden items-center gap-8 md:flex">
            <Link
              to="/"
              className="text-sm font-bold text-slate-700 transition hover:text-sky-700"
            >
              Home
            </Link>

            <Link
              to="/doctors"
              className="text-sm font-bold text-slate-700 transition hover:text-sky-700"
            >
              Doctors
            </Link>

            {currentUser && role === "patient" && (
              <>
                <Link
                  to="/patient/appointments"
                  className="text-sm font-bold text-slate-700 transition hover:text-sky-700"
                >
                  My Appointments
                </Link>

                <Link
                  to="/patient/dashboard"
                  className="text-sm font-bold text-slate-700 transition hover:text-sky-700"
                >
                  Dashboard
                </Link>
              </>
            )}

            <Link
              to="/about"
              className="text-sm font-bold text-slate-700 transition hover:text-sky-700"
            >
              About
            </Link>

            <Link
              to="/contact"
              className="text-sm font-bold text-slate-700 transition hover:text-sky-700"
            >
              Contact
            </Link>
          </div>

          {/* Auth Action Section */}
          <div className="flex items-center gap-3">
            {authLoading ? (
              /* Skeleton loader during auth check — prevents Sign In/Register flash on refresh */
              <div className="flex items-center gap-2 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-slate-200" />
                <div className="hidden sm:block space-y-1">
                  <div className="h-3 w-16 rounded bg-slate-200" />
                  <div className="h-2 w-10 rounded bg-slate-100" />
                </div>
              </div>
            ) : !currentUser ? (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-sky-600 hover:text-sky-700"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-sky-700 px-5 py-2 text-sm font-bold text-white shadow-md shadow-sky-700/20 transition hover:bg-sky-800"
                >
                  Register
                </Link>
              </div>
            ) : (
              <div className="relative flex items-center gap-3">
                {/* Role Portals shortcut */}
                {role === "admin" && (
                  <Link
                    to="/admin/dashboard"
                    className="hidden sm:flex items-center gap-1.5 rounded-xl bg-purple-50 px-3.5 py-2 text-xs font-bold text-purple-700 border border-purple-200 hover:bg-purple-100 transition"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Admin Portal</span>
                  </Link>
                )}

                {role === "doctor" && (
                  <Link
                    to="/doctor/dashboard"
                    className="hidden sm:flex items-center gap-1.5 rounded-xl bg-sky-50 px-3.5 py-2 text-xs font-bold text-sky-700 border border-sky-200 hover:bg-sky-100 transition"
                  >
                    <Stethoscope className="h-4 w-4" />
                    <span>Doctor Portal</span>
                  </Link>
                )}

                {/* Real-time Notification Bell */}
                <NotificationBell
                  role={role || "patient"}
                  patientId={currentUser?.uid}
                  userEmail={userProfile?.email || currentUser?.email}
                  doctorId={role === "doctor" ? currentUser?.uid : null}
                  doctorName={userProfile?.fullName || currentUser?.displayName || ""}
                />

                {/* Profile pill dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1.5 pr-3 text-left shadow-sm hover:border-sky-300 transition"
                  >
                    {userProfile?.image ? (
                      <img
                        src={userProfile.image}
                        alt={displayName}
                        className="h-8 w-8 rounded-full object-cover border border-sky-200"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-700 font-bold text-xs text-white">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="hidden sm:block">
                      <p className="text-xs font-bold text-slate-800 leading-tight">
                        {displayName}
                      </p>
                      <p className="text-[10px] capitalize text-slate-500 font-medium leading-none">
                        {role || "Patient"}
                      </p>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-slate-100 bg-white p-2 shadow-xl shadow-slate-200/50 z-50">
                      <div className="border-b border-slate-100 px-3 py-2">
                        <p className="text-xs font-bold text-slate-900">{displayName}</p>
                        <p className="truncate text-[11px] text-slate-500 font-medium">
                          {userProfile?.email || currentUser?.email}
                        </p>
                      </div>

                      <div className="py-1">
                        {role === "admin" && (
                          <Link
                            to="/admin/dashboard"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-700"
                          >
                            <LayoutDashboard className="h-4 w-4" />
                            Admin Dashboard
                          </Link>
                        )}

                        {role === "doctor" && (
                          <>
                            <Link
                              to="/doctor/dashboard"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-700"
                            >
                              <LayoutDashboard className="h-4 w-4" />
                              Doctor Dashboard
                            </Link>
                            <Link
                              to="/doctor/schedule"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-700"
                            >
                              <Calendar className="h-4 w-4" />
                              My Schedule
                            </Link>
                          </>
                        )}

                        {role === "patient" && (
                          <>
                            <Link
                              to="/patient/dashboard"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-700"
                            >
                              <LayoutDashboard className="h-4 w-4" />
                              Patient Dashboard
                            </Link>
                            <Link
                              to="/patient/appointments"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-700"
                            >
                              <Calendar className="h-4 w-4" />
                              My Appointments
                            </Link>
                            <Link
                              to="/patient/profile"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-700"
                            >
                              <User className="h-4 w-4" />
                              Profile Settings
                            </Link>
                          </>
                        )}
                      </div>

                      <div className="border-t border-slate-100 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            handleLogout();
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
                        >
                          <LogOut className="h-4 w-4" />
                          Log Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Optional Hero section for landing page */}
      {!hideHero && (
        <section className="relative flex min-h-[520px] w-full items-center overflow-hidden bg-gradient-to-r from-slate-50 via-sky-50/50 to-blue-50">
          <div className="absolute inset-y-0 right-0 z-0 flex w-full justify-end md:w-[65%] lg:w-[50%]">
            <img
              src="/src/assets/photos/image.png"
              alt="CarePlus Healthcare Specialists"
              className="h-full w-full object-cover object-left"
            />
            <div className="absolute inset-0 w-full bg-gradient-to-r from-slate-50 via-slate-50/70 to-transparent md:w-3/4" />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-16 md:px-12">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3.5 py-1 text-xs font-extrabold text-sky-800 mb-4 border border-sky-200">
                <HeartPulse className="h-3.5 w-3.5 text-sky-600" />
                Next-Gen Healthcare Management
              </span>

              <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-900 md:text-5xl">
                Your Health, <br />
                <span className="text-sky-700">Our Highest Priority</span>
              </h1>

              <p className="mt-4 text-base font-normal leading-relaxed text-slate-600">
                Book consultations with certified medical specialists, manage clinic appointments in real-time, and take full control of your wellness journey.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to="/doctors"
                  className="rounded-xl bg-sky-700 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-700/25 transition hover:bg-sky-800"
                >
                  Find a Doctor & Book
                </Link>
                {!currentUser && (
                  <Link
                    to="/register"
                    className="rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    Create Patient Account
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export default Navbar;