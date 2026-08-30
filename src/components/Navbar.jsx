import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HeartPulse, UserRound, LogOut } from "lucide-react";
import { auth } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

function Navbar() {
  const [userName, setUserName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
        if (user.email) {
          const name = user.email.split("@")[0];
          setUserName(name.charAt(0).toUpperCase() + name.slice(1));
        }
      } else {
        setIsLoggedIn(false);
        setUserName("");
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white">
        <nav className="mx-auto flex h-20 w-full items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-700">
              <HeartPulse className="h-6 w-6 text-white" />
            </div>

            <div className="leading-tight">
              <span className="block text-2xl font-bold text-sky-700">
                CarePlus
              </span>
              <span className="block text-sm font-medium text-slate-700">
                Clinic
              </span>
            </div>
          </div>

          <div className="hidden items-center gap-8 ml-90 md:flex">
            <Link
              to="/"
              className="text-base font-bold text-sky-700 transition hover:text-blue-600"
            >
              Home
            </Link>

            <Link
              to="/doctors"
              className="text-base font-bold text-sky-700 transition hover:text-blue-600"
            >
              Doctors
            </Link>

            <Link
              to="/doctors"
              className="text-base font-bold text-sky-700 transition hover:text-blue-600"
            >
              Appointment
            </Link>
              <Link
              to="/login"
              className="rounded-md border border-sky-700 px-5 py-2 text-base font-bold text-sky-700 transition hover:bg-blue-50"
            >
              Login
            </Link>
          
          </div>

  
          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 bg-sky-50 border border-sky-200 py-1.5 px-3 rounded-full shadow-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-700 text-white font-bold text-sm">
                  {userName ? userName.charAt(0) : <UserRound className="h-4 w-4" />}
                </div>
                <span className="text-sm font-bold text-sky-800 pr-1">
                  {userName}
                </span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                title="Logout"
                className="flex items-center justify-center h-10 w-10 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="rounded-md border border-sky-700 px-5 py-2 text-base font-bold text-sky-700 transition hover:bg-blue-50"
            >
              Login
            </Link>
          )}
        </nav>
      </header>

      <section className="relative flex min-h-[500px] w-full items-center overflow-hidden bg-stone-50">
        <div className="absolute inset-y-0 right-0 z-0 flex w-full justify-end md:w-[80%] lg:w-[60%]">
          <img
            src="/src/assets/photos/image.png"
            alt="Hero Doctor"
            className="h-full w-full object-cover object-left"
          />

          <div className="absolute inset-0 w-full bg-gradient-to-r from-stone-50 via-stone-50/20 to-transparent md:w-3/4" />
        </div>

        <div className="relative z-10 mx-auto w-full px-6 py-12 md:px-12">
          <div className="max-w-xl">
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-800 md:text-5xl">
              Your Health, <br />
              <span className="text-sky-800">Our Priority</span>
            </h1>

            <p className="mt-4 text-lg font-normal leading-relaxed text-slate-700">
              Book an appointment with trusted doctors easily and get the best care for you and your family.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/doctors"
                className="rounded-xl bg-sky-700 px-6 py-3.5 text-lg font-bold text-white shadow-md transition hover:bg-sky-800"
              >
                Find a Doctor
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Navbar;