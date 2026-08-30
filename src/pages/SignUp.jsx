import { useState } from "react";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { HeartPulse } from "lucide-react";

function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("User");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const doctor = location.state?.doctor;

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const user = res.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        role: role,
      });

      alert("Account created successfully!");

      if (role === "Doctor") {
        navigate("/dashboard");
      } else {
        navigate("/login", { state: { doctor } });
      }
    } catch (err) {
      setError("Failed to create account. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError("");
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      const user = res.user;

      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          role: role,
        },
        { merge: true }
      );

      alert("Account created successfully!");

      if (role === "Doctor") {
        navigate("/dashboard");
      } else {
        navigate("/booking", { state: { doctor } });
      }
    } catch (err) {
      setError("Google sign up failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl md:flex">
        
        <div className="hidden md:flex md:w-1/2 relative overflow-hidden text-white">
          <img
            src="../src/assets/photos/image.png"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-sky-900/80"></div>

          <div className="relative z-10 flex flex-col justify-center p-8">
            <div className="flex items-center gap-2">
              <HeartPulse className="h-10 w-10 text-white" />
              <h1 className="text-4xl font-bold text-white">CarePlus</h1>
            </div>

            <h2 className="mt-4 text-3xl font-bold ml-4 leading-tight">
              Your Health, <br /> Our Priority
            </h2>

            <p className="mt-5 max-w-sm text-lg ml-2 text-white bg-sky-50/15 px-4 rounded-sm">
              Trusted healthcare and easy appointment booking.
            </p>
          </div>
        </div>

        <div className="w-full p-8 md:w-1/2 md:p-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-sky-700">Create an Account</h1>
            <p className="mt-2 text-gray-500">Sign up to get started with CarePlus.</p>
          </div>

          {error && (
            <p className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <form onSubmit={handleSignUp} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-sky-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-sky-600 focus:ring-0"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-sky-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-sky-600 focus:ring-0"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-sky-700">Register As</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-sky-600 focus:ring-0"
              >
                <option value="User">User</option>
                <option value="Doctor">Admin</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-sky-700 px-4 py-3 font-semibold text-white hover:bg-sky-800 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Account"}
            </button>

            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium text-sky-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Continue with Google
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-sky-600">
            Already have an account?{" "}
            <Link to="/login" state={{ doctor }} className="font-semibold text-sky-700 hover:underline">
              Log In
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}

export default SignUp;