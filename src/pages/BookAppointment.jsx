import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Calendar, Clock, CheckCircle, ArrowLeft } from "lucide-react";
import { addDoc, collection } from "firebase/firestore";
import { db, auth } from "../lib/firebase";

function BookAppointment() {
  const location = useLocation();
  const navigate = useNavigate();

  const doctor = location.state?.doctor || {
    name: "Doctor",
    specialty: "General",
    image: ""
  };

  const [isConfirmed, setIsConfirmed] = useState(false);

  const [formData, setFormData] = useState({
    date: "",
    time: "",
    reason: "",
    patientName: "",
    phone: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      alert("Please login before booking an appointment.");
      navigate("/login", { state: { doctor } });
      return;
    }

    try {
      await addDoc(collection(db, "appointments"), {
        userId: user.uid,
        doctor: doctor.name,
        specialty: doctor.specialty,
        date: formData.date,
        time: formData.time,
        reason: formData.reason,
        patientName: formData.patientName,
        phone: formData.phone,
      });

      setIsConfirmed(true);
    } catch (error) {
      console.log(error);
      alert("Waa la samayn waayay appointment-ka, fadlan dib u try-garay.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      {!isConfirmed ? (
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-sky-700">
              Book Appointment
            </h1>

            <p className="mt-2 text-gray-600">
              Fill in the details to book your appointment
            </p>
          </div>

          <div className="mt-10 rounded-2xl bg-white p-8 shadow-lg">
            <div className="mb-7 rounded-xl bg-blue-50 p-5">
              <p className="mb-3 text-sm font-medium text-gray-700">
                Selected Doctor
              </p>

              <div className="flex items-center gap-4">
                <img
                  src={doctor.image}
                  alt={doctor.name}
                  className="h-16 w-16 rounded-full object-cover"
                />

                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {doctor.name}
                  </h2>

                  <p className="text-sm text-gray-500">
                    {doctor.specialty}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Select Date
                </label>

                <div className="relative">
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-700"
                  />

                  <Calendar
                    size={18}
                    className="pointer-events-none absolute right-3 top-3.5 text-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Select Time
                </label>

                <select
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-700"
                >
                  <option value="">Select a time</option>
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="03:00 PM">03:00 PM</option>
                  <option value="04:00 PM">04:00 PM</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Reason for Visit
                </label>

                <input
                  type="text"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  placeholder="Regular Checkup"
                  required
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-700"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Patient Name
                </label>

                <input
                  type="text"
                  name="patientName"
                  value={formData.patientName}
                  onChange={handleChange}
                  placeholder="Enter patient name"
                  required
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-700"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Phone Number
                </label>

                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+254 700 123 456"
                  required
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-700"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-sky-700 py-3 font-semibold text-white transition hover:bg-sky-800"
              >
                Confirm Appointment
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle size={36} className="text-green-600" />
              </div>

              <h1 className="mt-5 text-2xl font-bold text-sky-700">
                Appointment Confirmed!
              </h1>

              <p className="mt-2 text-sm font-semibold text-gray-700">
                Your appointment has been successfully booked.
              </p>
            </div>

            <div className="mt-8 rounded-xl bg-blue-50 p-6">
              <h2 className="text-xl font-bold text-sky-700">
                Appointment Summary
              </h2>

              <div className="mt-6 flex items-center gap-4">
                <img
                  src={doctor.image}
                  alt={doctor.name}
                  className="h-16 w-16 rounded-full object-cover"
                />

                <div>
                  <h3 className="font-bold text-gray-700">
                    {doctor.name}
                  </h3>

                  <p className="text-sm text-gray-700">
                    {doctor.specialty}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex gap-3">
                  <Calendar size={20} className="text-sky-700" />

                  <div>
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="font-medium text-gray-900">
                      {formData.date}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Clock size={20} className="text-sky-700" />

                  <div>
                    <p className="text-xs text-gray-500">Time</p>
                    <p className="font-medium text-gray-900">
                      {formData.time}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Reason for Visit</p>
                  <p className="font-medium text-gray-900">
                    {formData.reason}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Patient</p>
                  <p className="font-medium text-gray-900">
                    {formData.patientName}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900">
                    {formData.phone}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate("/")}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-sky-700 py-3 font-semibold text-white transition hover:bg-sky-800"
            >
              <ArrowLeft size={18} />
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookAppointment;