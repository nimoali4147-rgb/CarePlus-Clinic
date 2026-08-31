import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, adminAuth } from "../lib/firebase";
import { HeartPulse } from "lucide-react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [role, setRole] = useState("User");

  const navigate = useNavigate();
  const location = useLocation();
  const doctor = location.state?.doctor;

 const handleLogin = async (e) => {
  e.preventDefault();
  setError("");

  try {
    setLoading(true);

    const selectedAuth =
      role === "Admin" || role === "Doctor"
        ? adminAuth
        : auth;

    await signInWithEmailAndPassword(
      selectedAuth,
      email,
      password
    );

    if (role === "Doctor" || role === "Admin") {
      navigate("/dashboard");
    } else {
      navigate("/booking", { state: { doctor } });
    }
  } catch (err) {
    setError("Wrong Email or Password");
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl md:flex">
        
        <div className="hidden md:flex md:w-1/2 flex-col justify-center bg-sky-700 p-12 text-white">
          <div className="flex items-center">
            <HeartPulse className="text-white h-10 w-10" />
            <h1 className="text-3xl font-bold ml-4">CarePlus</h1>
          </div>

          <h2 className="mt-10 text-4xl font-bold leading-tight">
            Your Health, <br /> Our Priority
          </h2>

          <p className="mt-5 max-w-md text-sky-100">
            Connect with trusted doctors and manage your healthcare appointments easily with CarePlus.
          </p>

          <div className="mt-10 rounded-xl bg-white/10 p-5">
            <p className="font-medium">Quality healthcare made simple.</p>
            <p className="mt-2 text-sm text-sky-100">
              Book appointments, find doctors and take control of your healthcare journey.
            </p>
          </div>
        </div>

        <div className="w-full p-8 md:w-1/2 md:p-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-sky-700">Welcome Back</h1>
            <p className="mt-2 text-gray-500">Sign in to continue to your CarePlus account.</p>
          </div>

          {error && (
            <p className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-sky-700">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-sky-600 focus:ring-0"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-sky-700">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-sky-600 focus:ring-0"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-sky-700">Login As</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-sky-600 focus:ring-0"
              >
                <option value="User">User</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <div className="text-right">
              <button type="button" className="text-sm font-medium text-sky-700 hover:underline">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-sky-700 px-4 py-3 font-semibold text-white hover:bg-sky-800 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link to="/signup" state={{ doctor }} className="font-semibold text-sky-700 hover:underline">
              Sign Up
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}

export default Login;