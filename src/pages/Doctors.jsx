import React, { useState, useEffect } from "react";
import { Search, UserRound, Headset, HeartPulse, Stethoscope, Clock, Calendar, CheckCircle2 } from "lucide-react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// Fallback initial visual assets if a doctor has no custom image
import phy from "../assets/photos/phy.png";
import sar from "../assets/photos/sar.png";
import moh from "../assets/photos/moh.png";
import der from "../assets/photos/der.png";
import neu from "../assets/photos/neu.png";
import gyn from "../assets/photos/gyn.png";
import sur from "../assets/photos/sur.png";
import op from "../assets/photos/op.png";

const defaultDoctorAssets = [phy, sar, moh, der, neu, gyn, sur, op];

export default function Doctors() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, role } = useAuth();

  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All Specialties");
  const [loading, setLoading] = useState(true);

  // Success notification banner (e.g. from /register)
  const notification = location.state?.notification;

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "doctors"), (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setDoctors(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleBooking = (doctor) => {
    if (!currentUser) {
      navigate(`/login?redirect=/booking/${doctor.id}`, {
        state: { doctor },
      });
      return;
    }

    if (role === "admin") {
      navigate("/admin/dashboard");
      return;
    }

    if (role === "doctor") {
      navigate("/doctor/dashboard");
      return;
    }

    navigate(`/booking/${doctor.id}`, { state: { doctor } });
  };

  const specialties = [
    "All Specialties",
    "General Physician",
    "Pediatrician",
    "Cardiologist",
    "Dermatologist",
    "Neurologist",
    "Gynecologist",
    "Orthopedic Surgeon",
    "Ophthalmologist",
    "Psychiatrist",
    "Dentist",
    "ENT Specialist",
  ];

  const filteredDoctors = doctors.filter((docItem) => {
    // Only show active and available doctors on public website
    const isActive = (docItem.status || "active").toLowerCase() === "active";
    if (!isActive) return false;

    const matchesSearch =
      (docItem.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
      (docItem.specialization || "").toLowerCase().includes(search.toLowerCase());

    const matchesSpecialty =
      selectedSpecialty === "All Specialties" ||
      docItem.specialization === selectedSpecialty;

    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <div>
        <Navbar hideHero={true} />

        {/* Registration notification alert */}
        {notification && (
          <div className="bg-emerald-600 text-white px-6 py-3 text-center text-xs font-bold flex items-center justify-center gap-2 shadow-md">
            <CheckCircle2 className="h-4 w-4" />
            <span>{notification}</span>
          </div>
        )}

        <section className="px-6 py-12 lg:px-8 max-w-7xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-100 px-3.5 py-1 rounded-full border border-sky-200">
              Verified Medical Specialists
            </span>
            <h1 className="mt-3 text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Meet Our Certified Clinic Doctors
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Choose an experienced specialist and book a consultation according to their verified weekly schedule.
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search doctors by name or medical specialty..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs text-slate-900 outline-none focus:border-sky-600 focus:bg-white transition"
              />
            </div>

            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-sky-600"
            >
              {specialties.map((sp) => (
                <option key={sp} value={sp}>
                  {sp}
                </option>
              ))}
            </select>
          </div>

          {/* Doctors Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {loading ? (
              <div className="col-span-full py-16 text-center text-xs text-slate-400">
                Loading doctors directory...
              </div>
            ) : filteredDoctors.length === 0 ? (
              <div className="col-span-full rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center text-xs text-slate-500">
                No doctors found matching your search.
              </div>
            ) : (
              filteredDoctors.map((docItem, idx) => {
                const imageSrc =
                  docItem.image ||
                  defaultDoctorAssets[idx % defaultDoctorAssets.length] ||
                  phy;

                return (
                  <div
                    key={docItem.id}
                    className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition"
                  >
                    <div>
                      <div className="relative overflow-hidden rounded-2xl bg-slate-100 h-52">
                        <img
                          src={imageSrc}
                          alt={docItem.fullName}
                          className="h-full w-full object-cover object-top"
                        />
                        <span
                          className={`absolute top-3 right-3 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase shadow-sm ${
                            docItem.status === "active"
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-500 text-white"
                          }`}
                        >
                          {docItem.status === "active" ? "Available" : "Inactive"}
                        </span>
                      </div>

                      <div className="mt-4 space-y-1">
                        <h3 className="text-base font-bold text-slate-900">
                          {docItem.fullName}
                        </h3>
                        <p className="text-xs font-bold text-sky-700">
                          {docItem.specialization}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {docItem.qualification || docItem.experience || "Medical Specialist"}
                        </p>
                        <p className="text-xs font-bold text-emerald-600 pt-1">
                          ${docItem.consultationFee || 50} / consultation
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleBooking(docItem)}
                      className="mt-5 w-full rounded-xl bg-sky-700 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-700/20 hover:bg-sky-800 transition"
                    >
                      Schedule Appointment
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Support Banner */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl bg-sky-800 p-6 text-white shadow-lg">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-sky-700">
                <UserRound className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Need help finding a doctor?</h3>
                <p className="text-xs text-sky-100">Our medical team can match you with the right clinic specialist.</p>
              </div>
            </div>

            <Link
              to="/contact"
              className="rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-sky-800 hover:bg-sky-50 transition"
            >
              Contact Clinic Support
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}