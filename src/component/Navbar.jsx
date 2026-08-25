import { Link } from "react-router-dom";
import { HeartPulse } from "lucide-react";

function Navbar() {
  return (
    <>
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-gray-100">
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
              <HeartPulse className="h-6 w-6 text-white" />
            </div>

            <div className="leading-tight">
              <span className="block text-xl font-bold text-blue-700">
                CarePlus
              </span>
              <span className="block text-md font-medium text-slate-500">
                Clinic
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <div className="hidden items-center gap-8 md:flex">

            <Link
              to="/"
              className="text-l font-bold text-sky-700 transition hover:text-blue-600"
            >
              Home
            </Link>

            <Link
              to="/doctors"
              className="text-l font-bold  text-sky-700 transition hover:text-blue-600"
            >
              Doctors
            </Link>

            <a
              href="#Appointment"
              className="text-l font-bold text-sky-700 transition hover:text-blue-600"
            >
              Appointment
            </a>

            <a
              href="#about"
              className="text-l font-bold text-sky-700 transition hover:text-blue-600"
            >
              About Us
            </a>

            <a
              href="#contact"
              className="text-l font-bold text-sky-700 transition hover:text-blue-600"
            >
              Contact
            </a>

          </div>

          {/* Login */}
          <Link
            to="/login"
            className="rounded-md border border-blue-600 px-5 py-2 text-xl font-bold text-blue-600 transition hover:bg-blue-50"
          >
            Login
          </Link>

        </nav>
      </header>

      {/* Hero */}
      <div className="relative ">

    <div className="bg w-170 h-120 ">
        <img
          src="../src/assets/photos/image.png"
          alt="clinic"
          className="h-120 w-full object-cover ml-143"
        />

        {/* Text */}
        <div className="absolute left-10 top-1/2 -translate-y-1/2 max-w-xl">
      
          <h1 className="text-5xl font-bold leading-tight mt-6 text-slate-700">Your Health is <br /><span className="text-sky-700">Our Priority</span></h1>

          <p className="mt-5 text-lg mt-6 text-slate-900">
           Book an appointment with trusted doctors easily  <br />
           and get the best care for you and your family.  <br />
           Manage your appointments and stay connected <br /> with your healthcare team anytime.
          </p>

          <button className="mt-6 rounded-lg  mt-12 bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700">
            Book an Appointment
          </button>
        </div>
       
</div>
      </div>
    </>
  );
}

export default Navbar;