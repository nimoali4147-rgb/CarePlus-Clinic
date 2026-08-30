import React from "react";
import { Link } from "react-router-dom";
import { HeartPulse } from "lucide-react";

function Navbar() {
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
          </div>

          <Link
            to="/login"
            className="rounded-md border border-sky-700 px-5 py-2 text-base font-bold text-sky-700 transition hover:bg-blue-50"
          >
            Login
          </Link>
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