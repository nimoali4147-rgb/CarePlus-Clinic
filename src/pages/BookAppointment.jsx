import React from 'react';
import { Link } from "react-router-dom";
import { HeartPulse } from "lucide-react";

function BookAppointment() {
  return (
    <>
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white">
      <nav className="mx-auto flex h-20 w-full items-center justify-between px-6 lg:px-8">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-700">
            <HeartPulse className="h-6 w-6 text-white" />
          </div>

          <div className="leading-tight">
            <span className="block text-xl font-bold text-sky-700">
              CarePlus
            </span>
            <span className="block text-sm font-medium text-slate-500">
              Clinic
            </span>
          </div>
       

        <div className="hidden items-center gap-8 md:flex">
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
            to="/booking"
            className="text-base font-bold text-sky-700 transition hover:text-blue-600"
          >
            Appointment
          </Link>

          <a
            href="#about"
            className="text-base font-bold text-sky-700 transition hover:text-blue-600"
          >
            About Us
          </a>

          <a
            href="#contact"
            className="text-base font-bold text-sky-700 transition hover:text-blue-600"
          >
            Contact
          </a>
        </div>

        <Link
          to="/login"
          className="rounded-md border border-sky-700 px-5 py-2 text-base font-bold text-sky-700 transition hover:bg-sky-50"
        >
          Login
        </Link>
      </nav>
    </header>
  </>
  );
}

export default BookAppointment;