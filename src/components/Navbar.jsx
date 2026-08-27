

import { Link } from "react-router-dom";
import { HeartPulse } from "lucide-react";

function Navbar() {
  return (
    <>
   
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white">
        <nav className="mx-auto flex h-20 w-full  items-center justify-between px-6 lg:px-8">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-700">
              <HeartPulse className="h-6 w-6 text-white" />
            </div>

            <div className="leading-tight">
              <span className="block text-2xl font-bold text-sky-700">
                CarePlus
              </span>
              <span className="block text-l font-medium text-slate-700">
                Clinic
              </span>
            </div>
          

       
          <div className="hidden items-center ml-90 gap-8 md:flex">

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

            <Link
              to="/booking"
              className="text-l font-bold text-sky-700 transition hover:text-blue-600"
            >
              Appointment
            </Link>

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

  
          <Link
            to="/login"
            className="rounded-md border border-sky-700 px-5 py-2 text-xl font-bold text-sky-700 transition hover:bg-blue-50"
          >
            Login
          </Link>

        </nav>
      </header>

      <section className="relative min-h-[500px] w-full bg-stone-50 overflow-hidden flex items-center">

        <div className="absolute inset-y-0 right-0 w-full md:w-[80%] lg:w-[60%] z-0 flex justify-end">
          
          <img
            src="../src/assets/photos/image.png"
            alt=""
            className="absolute right-0 top-0 bottom-0 h-full w-full max-w-[100%]  object-container object-left z-0"
          />
      
         <div className="absolute inset-0 bg-gradient-to-r from-gray-50 via-gray-50/20 to-transparent w-full md:w-3/4" />
      </div>

        <div className="relative z-10 ml-10 mx-auto px-4 py-6 md:px-12 w-full">
          <div className="max-w-xl">
           
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 tracking-tight leading-tight">
              Your Health, <br />
              <span className="text-sky-800">Our Priority</span>
            </h1>

       
            <p className="mt-4 text-lg text-slate-700 leading-relaxed font-normal">
              Book an appointment with trusted doctors easily <br /> and get the best
              care for you and your family.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button className="px-6 py-3.5 bg-sky-700 hover:bg-sky-300 text-white font-bold text-xl rounded-xl shadow-md transition-all duration-200">
                Book Appointment
              </button>

            </div>
          </div>
        </div>
      </section>


    </>
  );
}

export default Navbar;
