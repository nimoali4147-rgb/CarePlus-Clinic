import { Link } from "react-router-dom";
import { HeartPulse } from "lucide-react";

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex h-30 bg-gray-100  max-w-7xl items-center justify-between px-6 lg:px-8">

       
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600">
            <HeartPulse className="h-6 w-6 text-white" />
          </div>

          <div className="leading-tight">
            <span className="block text-2xl font-bold text-blue-700">CarePlus</span>
            <span className="block text-md font-medium text-slate-500">Clinic</span>
          </div>
        </Link>

       
        <div className="hidden items-center ml-70 gap-9 md:flex">
          <Link
            to="/"
            className="text-xl font-bold text-slate-700 transition hover:text-blue-700">Home
          </Link>

          <Link
            to="/doctors"
            className="text-xl font-bold text-slate-700 transition hover:text-blue-600">Doctors
          </Link>

          <a
            href="#services"
            className="text-xl font-bold text-slate-700 transition hover:text-blue-600">Services
          </a>

          <a
            href="#about"
            className="text-xl font-bold text-slate-700 transition hover:text-blue-600">About Us
          </a>

          <a
            href="#contact"
            className="text-xl font-bold text-slate-700 transition hover:text-blue-600">Contact
          </a>
        </div>

       
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-lg border border-blue-600 px-5 py-2 text-xl font-bold text-blue-600 transition hover:bg-blue-50">Login
          </Link>

          <Link
            to="/signup"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-xl font-bold text-white shadow-sm transition hover:bg-blue-700">Sign Up
          </Link>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;