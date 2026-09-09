import React, { useState } from "react";
import { useNavigate, useLocation, Link, useSearchParams } from "react-router-dom";
import { HeartPulse, Mail, Lock, AlertCircle, ArrowRight, CheckCircle2, ShieldCheck, KeyRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Destination if redirected from booking or protected route
  const redirectParam = searchParams.get("redirect") || location.state?.from?.pathname || location.state?.doctor ? "/doctors" : null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      const { role } = await login(email.trim(), password);

      // Automated role-based routing
      if (role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (role === "doctor") {
        navigate("/doctor/dashboard", { replace: true });
      } else {
        // Patient role
        if (redirectParam) {
          navigate(redirectParam, { replace: true, state: location.state });
        } else {
          navigate("/patient/dashboard", { replace: true });
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please try again later.");
      } else {
        setError("Invalid email address or password. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!resetEmail) return;
    try {
      setResetLoading(true);
      setResetMessage("");
      await resetPassword(resetEmail.trim());
      setResetMessage("Password reset email sent! Check your inbox.");
      setTimeout(() => {
        setResetModalOpen(false);
        setResetMessage("");
      }, 3500);
    } catch (err) {
      setResetMessage(err.message || "Failed to send password reset email.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-slate-50 to-blue-50 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl shadow-sky-950/10 border border-slate-100 md:flex">
        
        {/* Left Visual Hero */}
        <div className="hidden md:flex md:w-5/12 relative overflow-hidden bg-sky-800 text-white flex-col justify-between p-10">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-800 via-sky-900 to-slate-900 opacity-95"></div>
          
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl"></div>
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl"></div>

          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sky-700 shadow-md">
                <HeartPulse className="h-6 w-6" />
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight text-white">CarePlus</span>
                <span className="text-xs uppercase tracking-widest text-sky-300 block font-semibold">Clinic Portal</span>
              </div>
            </Link>

            <div className="mt-14">
              <span className="inline-block rounded-full bg-sky-400/20 px-3 py-1 text-xs font-semibold text-sky-200 backdrop-blur-md mb-3 border border-sky-400/30">
                Unified Portal Authentication
              </span>
              <h2 className="text-3xl font-extrabold leading-tight text-white">
                Welcome Back to CarePlus Clinic.
              </h2>
              <p className="mt-4 text-sm text-sky-100/90 leading-relaxed">
                Sign in to access your personalized clinic dashboard, manage appointments, schedules, and clinical records.
              </p>
            </div>
          </div>

          <div className="relative z-10 space-y-2 mt-8">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-md border border-white/10 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-sky-300 shrink-0" />
              <p className="text-xs text-sky-100 font-medium">
                Protected by automated role-based authentication.
              </p>
            </div>
          </div>
        </div>

        {/* Right Form */}
        <div className="w-full p-8 md:w-7/12 md:p-12">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Sign In to CarePlus
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Enter your email and password to continue.
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700 border border-rose-100">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-500" />
              <div>
                <p className="font-semibold">Authentication Error</p>
                <p className="text-xs text-rose-600 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-600/10"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setResetModalOpen(true)}
                  className="text-xs font-bold text-sky-700 hover:text-sky-800 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-600/10"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 accent-sky-600"
                />
                <span>Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-700 py-3 text-sm font-bold text-white shadow-lg shadow-sky-700/20 transition hover:bg-sky-800 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 border-t border-slate-100 pt-6 text-center">
            <p className="text-xs text-slate-500">
              Are you a new patient?{" "}
              <Link to="/register" className="font-bold text-sky-700 hover:underline">
                Create Patient Account
              </Link>
            </p>
          </div>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Reset Password</h3>
                <p className="text-xs text-slate-500">Receive a password reset email</p>
              </div>
            </div>

            {resetMessage && (
              <div className="mb-4 rounded-xl bg-sky-50 p-3 text-xs text-sky-800 border border-sky-200">
                {resetMessage}
              </div>
            )}

            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Account Email</label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  required
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-sky-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="rounded-xl bg-sky-700 px-4 py-2 text-xs font-bold text-white hover:bg-sky-800 disabled:opacity-50"
                >
                  {resetLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}