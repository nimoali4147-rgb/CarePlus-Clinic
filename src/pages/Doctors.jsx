import { Search, UserRound, Headset } from "lucide-react";
import { Link } from "react-router-dom";
import { HeartPulse } from "lucide-react";


function Doctors() {
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
     
    <section className="bg-[#F8FBFD] px-6 py-14">
      <div className="mx-auto max-w-6xl">

        <div className="text-center mb-8">
          <p className="text-[#085A93] text-sm font-semibold uppercase">
            Our Doctors
          </p>

          <h1 className="text-[#102A43] text-3xl font-bold mt-2">
            Meet Our Trusted Doctors
          </h1>

          <p className="text-gray-500 text-sm mt-3">
            Choose a doctor and book an appointment that works for you.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search doctors or specialty..."
              className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-[#085A93]"
            />
          </div>

          <select className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 outline-none focus:border-[#085A93]">
            <option>All Specialties</option>
            <option>General Physician</option>
            <option>Pediatrics</option>
            <option>Cardiology</option>
            <option>Dermatology</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <img
              src="/src/assets/photos/phy.png"
              alt="Dr. Ahmed Hassan"
              className="h-48 w-full rounded-xl object-cover"
            />

            <h2 className="mt-4 text-base font-bold text-[#102A43]">
              Dr. Ahmed Hassan
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              General Physician
            </p>

            <p className="mt-2 text-xs text-gray-500">
              8+ years experience
            </p>

            <p className="mt-3 text-xs font-medium text-green-600">
              ● Available Today
            </p>

            <button className="mt-4 w-full rounded-lg bg-[#085A93] py-2.5 text-sm font-semibold text-white hover:bg-[#064b7b]">
              Book Appointment
            </button>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <img
             src="/src/assets/photos/sar.png"
              alt="Dr. Sarah Ali"
              className="h-48 w-full rounded-xl object-cover"
            />

            <h2 className="mt-4 text-base font-bold text-[#102A43]">
              Dr. Sarah Ali
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Pediatrician
            </p>

            <p className="mt-2 text-xs text-gray-500">
              6+ years experience
            </p>

            <p className="mt-3 text-xs font-medium text-green-600">
              ● Available Today
            </p>

            <button className="mt-4 w-full rounded-lg bg-[#085A93] py-2.5 text-sm font-semibold text-white hover:bg-[#064b7b]">
              Book Appointment
            </button>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <img
             src="/src/assets/photos/moh.png"
              alt="Dr. Mohamed Yusuf"
              className="h-48 w-full rounded-xl object-cover"
            />

            <h2 className="mt-4 text-base font-bold text-[#102A43]">
              Dr. Mohamed Yusuf
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Cardiologist
            </p>

            <p className="mt-2 text-xs text-gray-500">
              10+ years experience
            </p>

            <p className="mt-3 text-xs font-medium text-green-600">
              ● Available Tomorrow
            </p>

            <button className="mt-4 w-full rounded-lg bg-[#085A93] py-2.5 text-sm font-semibold text-white hover:bg-[#064b7b]">
              Book Appointment
            </button>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <img
           src="/src/assets/photos/der.png"
              alt="Dr. Amina Abdullahi"
              className="h-48 w-full rounded-xl object-cover"
            />

            <h2 className="mt-4 text-base font-bold text-[#102A43]">
              Dr. Yussuf Abdullahi
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Dermatologist
            </p>

            <p className="mt-2 text-xs text-gray-500">
              7+ years experience
            </p>

            <p className="mt-3 text-xs font-medium text-green-600">
              ● Available Today
            </p>

            <button className="mt-4 w-full rounded-lg bg-[#085A93] py-2.5 text-sm font-semibold text-white hover:bg-[#064b7b]">
              Book Appointment
            </button>
          </div>

        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl bg-[#EAF5FB] px-6 py-5 sm:flex-row">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white">
              <UserRound size={22} className="text-[#085A93]" />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#102A43]">
                Can't find the right doctor?
              </h3>

              <p className="text-xs text-gray-500">
                We're here to help you find the best doctor.
              </p>
            </div>
          </div>

          <button className="flex items-center gap-2 rounded-lg border border-[#085A93] bg-white px-5 py-2.5 text-sm font-semibold text-[#085A93]">
            <Headset size={17} />
            Contact Support
          </button>
        </div>

      </div>
    </section>
     </>
  );
}

export default Doctors;