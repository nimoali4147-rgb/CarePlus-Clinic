import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  CheckCircle2,
  ArrowLeft,
  User,
  Phone,
  FileText,
  AlertCircle,
  Stethoscope,
  Building,
  HeartPulse,
  ShieldAlert,
  CalendarCheck,
  Info,
} from "lucide-react";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function BookAppointment() {
  const { doctorId: paramDoctorId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();

  const passedDoctor = location.state?.doctor;
  const targetDoctorId = paramDoctorId || passedDoctor?.id;

  const [doctor, setDoctor] = useState(passedDoctor || null);
  const [loadingDoctor, setLoadingDoctor] = useState(!passedDoctor);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [confirmedAppt, setConfirmedAppt] = useState(null);

  // Active appointment restriction state (User cannot have >1 pending/approved appointments)
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [checkingActiveAppt, setCheckingActiveAppt] = useState(true);

  // Selected Day state (e.g. monday, tuesday...)
  const [selectedDayKey, setSelectedDayKey] = useState("");

  const [formData, setFormData] = useState({
    date: "",
    time: "",
    reason: "",
    symptoms: "",
    phone: userProfile?.phone || "",
    patientName: userProfile?.fullName || currentUser?.displayName || "",
  });

  // Sync user profile data when loaded
  useEffect(() => {
    if (userProfile) {
      setFormData((prev) => ({
        ...prev,
        patientName: userProfile.fullName || prev.patientName,
        phone: userProfile.phone || prev.phone,
      }));
    }
  }, [userProfile]);

  // Check if current user already has an active (pending or approved) appointment
  useEffect(() => {
    if (!currentUser) {
      setCheckingActiveAppt(false);
      return;
    }

    const q = query(
      collection(db, "appointments"),
      where("userId", "==", currentUser.uid)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const userAppts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        const active = userAppts.find((a) => {
          const st = (a.status || "pending").toLowerCase();
          return st === "pending" || st === "approved" || st === "confirmed";
        });
        setActiveAppointment(active || null);
        setCheckingActiveAppt(false);
      },
      (err) => {
        console.warn("Active appointment check error:", err);
        setCheckingActiveAppt(false);
      }
    );

    return () => unsub();
  }, [currentUser]);

  // Load doctor details from Firestore
  useEffect(() => {
    if (!targetDoctorId && !passedDoctor) {
      navigate("/doctors");
      return;
    }

    const fetchDoctor = async () => {
      if (targetDoctorId) {
        try {
          const docSnap = await getDoc(doc(db, "doctors", targetDoctorId));
          if (docSnap.exists()) {
            setDoctor({ id: docSnap.id, ...docSnap.data() });
          } else {
            setError("Doctor profile could not be found.");
          }
        } catch (err) {
          console.error("Error fetching doctor:", err);
          setError("Failed to load doctor details.");
        } finally {
          setLoadingDoctor(false);
        }
      }
    };

    fetchDoctor();
  }, [targetDoctorId, passedDoctor, navigate]);

  // Format 24-hr time into 12-hr string (e.g. 09:00 -> 09:00 AM)
  const formatTimeSlot = (timeStr) => {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${String(displayH).padStart(2, "0")}:${String(m || 0).padStart(2, "0")} ${period}`;
  };

  // Helper to get upcoming date for a specific weekday
  const getNextDateForDay = (dayKey) => {
    const daysArr = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const targetIdx = daysArr.indexOf(dayKey.toLowerCase());
    if (targetIdx === -1) return null;

    const today = new Date();
    const currentIdx = today.getDay();
    let diff = (targetIdx - currentIdx + 7) % 7;

    const targetDate = new Date();
    targetDate.setDate(today.getDate() + diff);

    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
    const dd = String(targetDate.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const formattedDate = targetDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return { dateStr, formattedDate, targetDate };
  };

  // Build the list of ONLY the days the doctor is available
  const getAvailableDaysList = () => {
    if (!doctor) return [];
    const daysArr = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const availMap = doctor.availability || {};

    const list = [];
    daysArr.forEach((dayKey) => {
      const cfg = availMap[dayKey] || {
        available: dayKey !== "sunday" && dayKey !== "saturday",
        start: "09:00",
        end: "17:00",
      };

      if (cfg.available) {
        const nextDateInfo = getNextDateForDay(dayKey);
        list.push({
          dayKey,
          dayName: cfg.day || dayKey.charAt(0).toUpperCase() + dayKey.slice(1),
          start: cfg.start || "09:00",
          end: cfg.end || "17:00",
          hours: `${formatTimeSlot(cfg.start || "09:00")} – ${formatTimeSlot(cfg.end || "17:00")}`,
          dateStr: nextDateInfo?.dateStr || "",
          formattedDate: nextDateInfo?.formattedDate || "",
        });
      }
    });

    return list;
  };

  const availableDaysList = getAvailableDaysList();

  // Auto-select the first available day once doctor loads
  useEffect(() => {
    if (availableDaysList.length > 0 && !selectedDayKey) {
      const first = availableDaysList[0];
      setSelectedDayKey(first.dayKey);
      setFormData((p) => ({
        ...p,
        date: first.dateStr,
        time: first.hours,
      }));
    }
  }, [doctor]);

  // Selected Day item details
  const selectedDayItem = availableDaysList.find((d) => d.dayKey === selectedDayKey);

  const handleSelectDay = (dayItem) => {
    setSelectedDayKey(dayItem.dayKey);
    setFormData((prev) => ({
      ...prev,
      date: dayItem.dateStr,
      time: dayItem.hours,
    }));
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!currentUser) {
      navigate(`/login?redirect=/booking/${doctor.id}`, { state: { doctor } });
      return;
    }

    if (!isDoctorActive) {
      setError("This doctor is currently inactive and cannot accept appointments.");
      return;
    }

    if (!formData.date || !selectedDayItem) {
      setError("Please select an available consultation day.");
      return;
    }

    // Restriction: Cannot book if an active (pending or approved) appointment exists
    if (activeAppointment) {
      setError(
        `You already have an active appointment (Status: ${activeAppointment.status}) with Dr. ${activeAppointment.doctorName || "Doctor"} for ${activeAppointment.date}. You cannot schedule another appointment until your current appointment is completed or cancelled.`
      );
      return;
    }

    setSubmitting(true);

    try {
      // Direct Firestore safeguard verification
      const safeguardQuery = query(
        collection(db, "appointments"),
        where("userId", "==", currentUser.uid)
      );
      const safeguardSnap = await getDocs(safeguardQuery);
      const activeExisting = safeguardSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .find((a) => {
          const st = (a.status || "pending").toLowerCase();
          return st === "pending" || st === "approved" || st === "confirmed";
        });

      if (activeExisting) {
        setActiveAppointment(activeExisting);
        setError(
          `You already have an active appointment (Status: ${activeExisting.status}) with Dr. ${activeExisting.doctorName || "Doctor"} for ${activeExisting.date}. You cannot schedule another appointment until your current appointment is completed or cancelled.`
        );
        setSubmitting(false);
        return;
      }
      const appointmentPayload = {
        doctorId: doctor.id,
        doctorName: doctor.fullName,
        specialty: doctor.specialization || "General",
        patientId: currentUser.uid,
        userId: currentUser.uid,
        patientName: formData.patientName.trim() || userProfile?.fullName || "Patient",
        patientEmail: userProfile?.email || currentUser.email,
        phone: formData.phone.trim(),
        date: formData.date,
        time: selectedDayItem.hours,
        dayName: selectedDayItem.dayName,
        reason: formData.reason.trim(),
        symptoms: formData.symptoms.trim(),
        consultationFee: doctor.consultationFee || 50,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "appointments"), appointmentPayload);

      setConfirmedAppt({
        id: docRef.id,
        ...appointmentPayload,
      });
      setIsConfirmed(true);
    } catch (err) {
      console.error("Error creating appointment:", err);
      setError("Failed to schedule appointment: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isDoctorActive = (doctor?.status || "active").toLowerCase() === "active";

  if (loadingDoctor) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 animate-bounce items-center justify-center rounded-2xl bg-sky-700 text-white">
            <HeartPulse className="h-6 w-6" />
          </div>
          <span className="text-xs font-semibold text-slate-500">Loading practitioner schedule...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <div>
        <Navbar hideHero={true} />

        <main className="mx-auto max-w-4xl px-6 py-10 lg:px-8">
          {!isDoctorActive ? (
            /* Doctor Inactive Screen */
            <div className="rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-lg space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">
                Dr. {doctor?.fullName} is Currently Unavailable
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                This practitioner is currently marked as inactive or on leave and cannot accept new consultation bookings at this time.
              </p>
              <div className="pt-2">
                <Link
                  to="/doctors"
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-700 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-sky-800 transition cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Browse Available Doctors
                </Link>
              </div>
            </div>
          ) : !isConfirmed ? (
            <div className="space-y-6">
              {/* Back button & Title */}
              <div className="flex items-center gap-4">
                <Link
                  to="/doctors"
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                    Schedule an Appointment
                  </h1>
                  <p className="text-xs text-slate-500">
                    Select an available working day for your consultation with Dr. {doctor?.fullName}.
                  </p>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-3 rounded-2xl bg-rose-50 p-4 text-xs font-semibold text-rose-700 border border-rose-100">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* Doctor Summary Card */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={doctor?.image || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=60"}
                    alt={doctor?.fullName}
                    className="h-16 w-16 rounded-2xl object-cover border border-slate-200 shrink-0"
                  />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-100">
                      {doctor?.specialization}
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 mt-1">
                      {doctor?.fullName}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {doctor?.qualification || "Licensed Medical Specialist"} • Room: {doctor?.roomNumber || "101"}
                    </p>
                  </div>
                </div>

                <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Consultation Fee</span>
                  <p className="text-xl font-black text-emerald-600">${doctor?.consultationFee || 50}</p>
                </div>
              </div>

              {/* Active Appointment Warning Banner */}
              {activeAppointment && (
                <div className="rounded-3xl border border-amber-300 bg-amber-50/90 p-5 text-amber-950 shadow-sm space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-200/80 text-amber-800">
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-amber-900">
                        Active Appointment Already In Progress
                      </h4>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        You already have an appointment with status{" "}
                        <span className="font-extrabold uppercase bg-amber-200 px-2 py-0.5 rounded-md text-amber-900 border border-amber-300/60">
                          {activeAppointment.status}
                        </span>{" "}
                        with <strong>Dr. {activeAppointment.doctorName || "Doctor"}</strong> on{" "}
                        <strong>{activeAppointment.dayName ? `${activeAppointment.dayName}, ` : ""}{activeAppointment.date} at {activeAppointment.time}</strong>.
                      </p>
                      <p className="text-xs text-amber-700 font-medium">
                        Clinic policy allows only one active appointment at a time. You cannot schedule a new appointment until your previous appointment is <strong>completed</strong> or <strong>cancelled</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-amber-200/80">
                    <Link
                      to="/patient/appointments"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-amber-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-800 transition"
                    >
                      <CalendarCheck className="h-4 w-4" />
                      <span>View My Appointments / Cancel</span>
                    </Link>
                    <Link
                      to="/patient/dashboard"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-4 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition"
                    >
                      <span>Patient Dashboard</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* Booking Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3 flex items-center justify-between">
                    <span>1. Choose Consultation Day</span>
                    {selectedDayItem && (
                      <span className="text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full text-[11px] font-bold border border-emerald-200">
                        ✓ {selectedDayItem.dayName} ({selectedDayItem.formattedDate})
                      </span>
                    )}
                  </h3>

                  {/* Horizontal Scroll for Available Days */}
                  <div className="space-y-2.5">
                    <label className="block text-xs font-bold uppercase text-slate-700">
                      Available Consultation Days <span className="text-rose-500">*</span>
                    </label>
                    <p className="text-xs text-slate-500">
                      Scroll horizontally and click on the day you wish to book your visit:
                    </p>

                    {availableDaysList.length === 0 ? (
                      <div className="rounded-2xl bg-amber-50 p-4 text-xs font-semibold text-amber-800 border border-amber-200">
                        This doctor currently has no active consultation days configured. Please contact the clinic.
                      </div>
                    ) : (
                      <div className="flex gap-3.5 overflow-x-auto pb-3 pt-1 scroll-smooth snap-x">
                        {availableDaysList.map((dayItem) => {
                          const isSelected = selectedDayKey === dayItem.dayKey;
                          return (
                            <button
                              key={dayItem.dayKey}
                              type="button"
                              onClick={() => handleSelectDay(dayItem)}
                              className={`snap-start shrink-0 min-w-[155px] sm:min-w-[170px] rounded-2xl p-4 border text-center transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-sky-700 text-white border-sky-700 shadow-lg shadow-sky-700/25 ring-2 ring-sky-500 scale-[1.02]"
                                  : "bg-white text-slate-800 border-slate-200 hover:border-sky-500 hover:bg-sky-50/50 hover:shadow-xs"
                              }`}
                            >
                              <span
                                className={`inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                  isSelected
                                    ? "bg-white/20 text-sky-100"
                                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                }`}
                              >
                                Available
                              </span>
                              <p className="text-base font-black mt-2">
                                {dayItem.dayName}
                              </p>
                              <p
                                className={`text-xs font-semibold mt-0.5 ${
                                  isSelected ? "text-sky-100" : "text-slate-500"
                                }`}
                              >
                                {dayItem.formattedDate}
                              </p>
                              <div
                                className={`text-[11px] font-bold mt-3 py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 ${
                                  isSelected
                                    ? "bg-white/15 text-white"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                <Clock className="h-3 w-3 shrink-0" />
                                <span>{dayItem.hours}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Informational Card about Doctor's hours on selected day */}
                  {selectedDayItem && (
                    <div className="rounded-2xl bg-sky-50/70 border border-sky-200/70 p-4 text-xs text-sky-950 space-y-2.5 animate-in fade-in duration-150">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-sky-600 shrink-0" />
                        <p className="font-bold text-slate-900 text-xs">
                          Selected Day: {selectedDayItem.dayName}, {selectedDayItem.formattedDate}
                        </p>
                      </div>

                      <div className="space-y-1.5 text-slate-600 pl-6">
                        <p>
                          • <strong>Doctor Availability Window:</strong> Dr. {doctor?.fullName} will be at the clinic and available for consultations between <strong>{selectedDayItem.hours}</strong> on this day.
                        </p>
                        <p className="text-amber-900 bg-amber-50/80 border border-amber-200 rounded-xl p-2.5 font-medium leading-relaxed">
                          ⚠️ <strong>Please Note:</strong> Please ensure you arrive or connect during the doctor's consultation hours (<strong>{selectedDayItem.hours}</strong>). If you are unable to attend within this timeframe, please select another available day above.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Patient Information & Clinical Reason */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3">
                    2. Patient Details & Reason for Visit
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                        Patient Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="patientName"
                        value={formData.patientName}
                        onChange={handleChange}
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 outline-none focus:border-sky-600 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                        Contact Phone Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+254 700 000 000"
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 outline-none focus:border-sky-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                      Reason for Consultation <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="reason"
                      value={formData.reason}
                      onChange={handleChange}
                      placeholder="e.g. Routine checkup, cardiovascular check, fever, prescription renewal..."
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 outline-none focus:border-sky-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                      Symptoms & Clinical Notes (Optional)
                    </label>
                    <textarea
                      rows={3}
                      name="symptoms"
                      value={formData.symptoms}
                      onChange={handleChange}
                      placeholder="Describe any existing symptoms, medical background, or allergies..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 outline-none focus:border-sky-600 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <div className="flex justify-end gap-3 pt-2">
                  <Link
                    to="/doctors"
                    className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </Link>

                  <button
                    type="submit"
                    disabled={submitting || !formData.date || !selectedDayItem || !!activeAppointment}
                    className={`flex items-center gap-2 rounded-xl px-8 py-3 text-xs font-bold text-white transition ${
                      activeAppointment
                        ? "bg-slate-400 cursor-not-allowed opacity-70 shadow-none"
                        : "bg-sky-700 shadow-lg shadow-sky-700/20 hover:bg-sky-800 disabled:opacity-50 cursor-pointer"
                    }`}
                  >
                    {submitting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Confirming Appointment...</span>
                      </>
                    ) : activeAppointment ? (
                      <>
                        <ShieldAlert className="h-4 w-4" />
                        <span>Active Appointment Exists ({activeAppointment.status})</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Confirm & Schedule Appointment</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Confirmation Screen */
            <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow-xl border border-slate-100 text-center space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <CheckCircle2 className="h-10 w-10" />
              </div>

              <div>
                <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                  Appointment Confirmed
                </span>
                <h2 className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
                  Your Consultation is Scheduled!
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Your booking is registered in the clinic system under status <strong className="text-amber-600 uppercase">Pending</strong> awaiting administrative verification.
                </p>
              </div>

              {/* Summary Card */}
              <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100 text-left space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Dr. {confirmedAppt?.doctorName}</p>
                    <p className="text-sky-700 font-semibold">{confirmedAppt?.specialty}</p>
                  </div>
                  <span className="font-bold text-emerald-700">${confirmedAppt?.consultationFee}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 uppercase font-bold text-[10px]">Consultation Day & Hours</span>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      📅 {confirmedAppt?.dayName}, {confirmedAppt?.date}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      ⏰ {confirmedAppt?.time}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 uppercase font-bold text-[10px]">Patient Name</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{confirmedAppt?.patientName}</p>
                  </div>

                  <div>
                    <span className="text-slate-400 uppercase font-bold text-[10px]">Contact Phone</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{confirmedAppt?.phone}</p>
                  </div>

                  <div>
                    <span className="text-slate-400 uppercase font-bold text-[10px]">Reason</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{confirmedAppt?.reason}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link
                  to="/patient/dashboard"
                  className="w-full sm:w-auto rounded-xl bg-sky-700 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-sky-800 transition"
                >
                  Go to Patient Dashboard
                </Link>

                <Link
                  to="/doctors"
                  className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-6 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Browse More Doctors
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}