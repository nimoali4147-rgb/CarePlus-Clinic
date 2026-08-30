import { Search, UserRound, Headset, HeartPulse } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react"; 
import { auth } from "../lib/firebase";

function Doctors() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All Specialties");

  const doctors = [
    {
      name: "Dr. Ahmed Hassan",
      specialty: "General Physician",
      experience: "8+ years experience",
      availability: "Available Today",
      image: "/src/assets/photos/phy.png",
    },
    {
      name: "Dr. Sarah Ali",
      specialty: "Pediatrician",
      experience: "6+ years experience",
      availability: "Available Today",
      image: "/src/assets/photos/sar.png",
    },
    {
      name: "Dr. Mohamed Yusuf",
      specialty: "Cardiologist",
      experience: "10+ years experience",
      availability: "Available Tomorrow",
      image: "/src/assets/photos/moh.png",
    },
    {
      name: "Dr. Yussuf Abdullahi",
      specialty: "Dermatologist",
      experience: "7+ years experience",
      availability: "Available Today",
      image: "/src/assets/photos/der.png",
    },
    {
      name: "Dr. Ibrahim Noor",
      specialty: "Neurologist",
      experience: "12+ years experience",
      availability: "Available Tomorrow",
      image: "/src/assets/photos/neu.png",
    },
    {
      name: "Dr. Layla Hassan",
      specialty: "Gynecologist",
      experience: "9+ years experience",
      availability: "Available Today",
      image: "/src/assets/photos/gyn.png",
    },
    {
      name: "Dr. Omar Farah",
      specialty: "Orthopedic Surgeon",
      experience: "11+ years experience",
      availability: "Available This Week",
      image: "/src/assets/photos/sur.png",
    },
    {
      name: "Dr. Hawa Mohamed",
      specialty: "Ophthalmologist",
      experience: "5+ years experience",
      availability: "Available Friday",
      image: "/src/assets/photos/op.png",
    },
  ];

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(search.toLowerCase());

    const matchesSpecialty =
      selectedSpecialty === "All Specialties" ||
      doc.specialty === selectedSpecialty;

    return matchesSearch && matchesSpecialty;
  });

  const handleBooking = (doctor) => { 
    const user = auth.currentUser;

    if (!user) {
      navigate("/login", { state: { doctor } });
    } else {
      navigate("/booking", { state: { doctor } });
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
              <span className="block text-l font-medium text-slate-700">
                Clinic
              </span>
            </div>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <Link to="/" className="text-l font-bold text-sky-700 transition hover:text-blue-600">
              Home
            </Link>
            <Link to="/doctors" className="text-l font-bold text-sky-700 transition hover:text-blue-600">
              Doctors
            </Link>
            <Link to="/doctors" className="text-l font-bold text-sky-700 transition hover:text-blue-600">
              Appointment
            </Link>
            <Link to="/about" className="text-l font-bold text-sky-700 transition hover:text-blue-600">
              About Us
            </Link>
            <Link to="/contact" className="text-l font-bold text-sky-700 transition hover:text-blue-600">
              Contact
            </Link>
          </div>

          <Link
            to="/login"
            className="rounded-md border border-sky-700 px-5 py-2 text-xl font-bold text-sky-700 transition hover:bg-blue-50"
          >
            Login
          </Link>
        </nav>
      </header>

      <section className="bg-gray-100 px-6 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 text-center">
            <p className="text-xl font-bold uppercase text-sky-700">
              Our Doctors
            </p>

            <h1 className="mt-2 text-3xl font-bold text-blue-950">
              Meet Our Trusted Doctors
            </h1>

            <p className="mt-3 text-sm text-gray-500">
              Choose a doctor and book an appointment that works for you.
            </p>
          </div>

          <div className="mb-8 flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                placeholder="Search doctors or specialty..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-sky-700"
              />
            </div>

            <select 
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 outline-none focus:border-sky-700"
            >
              <option value="All Specialties">All Specialties</option>
              <option value="General Physician">General Physician</option>
              <option value="Pediatrician">Pediatrician</option>
              <option value="Cardiologist">Cardiologist</option>
              <option value="Dermatologist">Dermatologist</option>
              <option value="Neurologist">Neurologist</option>
              <option value="Gynecologist">Gynecologist</option>
              <option value="Orthopedic Surgeon">Orthopedic Surgeon</option>
              <option value="Ophthalmologist">Ophthalmologist</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {filteredDoctors.length === 0 ? (
              <p className="col-span-full text-center text-gray-500">
                No doctor found.
              </p>
            ) : (
              filteredDoctors.map((doc) => (
                <div
                  key={doc.name}
                  className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  <img
                    src={doc.image}
                    alt={doc.name}
                    className="h-48 w-full rounded-xl object-cover"
                  />

                  <h2 className="mt-4 text-base font-bold text-sky-700">
                    {doc.name}
                  </h2>

                  <p className="mt-1 text-md text-sky-700">
                    {doc.specialty}
                  </p>

                  <p className="mt-2 text-md text-sky-700">
                    {doc.experience}
                  </p>

                  <p className="mt-3 font-medium text-md text-sky-700">
                    ● {doc.availability}
                  </p>

                  <button
                    onClick={() => handleBooking(doc)}
                    className="mt-4 w-full rounded-lg bg-sky-700 py-2.5 text-l font-bold text-white hover:bg-sky-800"
                  >
                    Book Appointment
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl bg-sky-700 px-6 py-5 sm:flex-row">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white">
                <UserRound
                  size={22}
                  className="text-sky-700"
                />
              </div>

              <div>
                <h3 className="text-l font-semibold text-white">
                  Can't find the right doctor?
                </h3>

                <p className="text-l text-white">
                  We're here to help you find the best doctor.
                </p>
              </div>
            </div>

            <Link
              to="/contact"
              className="flex items-center gap-2 rounded-lg border border-sky-700 bg-white px-5 py-2.5 text-l font-semibold text-sky-700 transition hover:bg-sky-500 hover:text-white"
            >
              <Headset size={17} />
              Contact Support
            </Link>
          </div>

        </div>
      </section>
    </>
  );
}

export default Doctors;