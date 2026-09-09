import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  Stethoscope,
  ArrowLeft,
  User,
  Mail,
  Lock,
  Phone,
  Calendar,
  Award,
  DollarSign,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building,
  Image as ImageIcon,
  ShieldCheck,
  Upload,
  Trash2,
} from "lucide-react";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { db, secondaryAuth } from "../../lib/firebase";
import { processImageFile, MAX_IMAGE_SIZE_MB } from "../../lib/imageUtils";
import {
  validateFullName,
  validateEmail,
  validatePhone,
  validateQualification,
  validateLicenseNumber,
} from "../../lib/validationUtils";

export default function CreateDoctor() {
  const navigate = useNavigate();
  const { doctorId } = useParams();
  const isEdit = Boolean(doctorId);
  const imageInputRef = useRef(null);

  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    gender: "Male",
    dateOfBirth: "",
    specialization: "General Physician",
    qualification: "MBBS, MD",
    experience: "5+ years experience",
    licenseNumber: "",
    consultationFee: "50",
    biography: "",
    roomNumber: "101",
    profileImage: "",
    status: "active",
  });

  const [schedule, setSchedule] = useState([
    { day: "Monday", available: true, start: "09:00", end: "17:00" },
    { day: "Tuesday", available: true, start: "09:00", end: "17:00" },
    { day: "Wednesday", available: true, start: "09:00", end: "17:00" },
    { day: "Thursday", available: true, start: "09:00", end: "17:00" },
    { day: "Friday", available: true, start: "09:00", end: "17:00" },
    { day: "Saturday", available: false, start: "09:00", end: "13:00" },
    { day: "Sunday", available: false, start: "09:00", end: "13:00" },
  ]);

  // If in Edit mode, load doctor data from Firestore
  useEffect(() => {
    if (!isEdit || !doctorId) return;

    const fetchDoctor = async () => {
      try {
        setInitialLoading(true);
        const docSnap = await getDoc(doc(db, "doctors", doctorId));
        if (docSnap.exists()) {
          const d = docSnap.data();
          setFormData({
            fullName: d.fullName || "",
            email: d.email || "",
            password: "",
            phone: d.phone || "",
            gender: d.gender || "Male",
            dateOfBirth: d.dateOfBirth || "",
            specialization: d.specialization || "General Physician",
            qualification: d.qualification || "",
            experience: d.experience || "",
            licenseNumber: d.licenseNumber || "",
            consultationFee: String(d.consultationFee ?? "50"),
            biography: d.biography || "",
            roomNumber: d.roomNumber || "",
            profileImage: d.image || d.profileImage || "",
            status: d.status || "active",
          });

          if (d.availability) {
            setSchedule((prev) =>
              prev.map((item) => {
                const key = item.day.toLowerCase();
                if (d.availability[key]) {
                  return {
                    ...item,
                    available: d.availability[key].available !== false,
                    start: d.availability[key].start || "09:00",
                    end: d.availability[key].end || "17:00",
                  };
                }
                return item;
              })
            );
          }
        } else {
          setError("Doctor account not found in database.");
        }
      } catch (err) {
        console.error("Error loading doctor:", err);
        setError("Failed to load doctor profile. Please try again.");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchDoctor();
  }, [doctorId, isEdit]);

  const validateField = (name, value) => {
    switch (name) {
      case "fullName":
        return validateFullName(value);
      case "email":
        return validateEmail(value);
      case "password":
        if (!isEdit && (!value || value.length < 6)) {
          return "Temporary password must be at least 6 characters.";
        }
        if (isEdit && value && value.length < 6) {
          return "New password must be at least 6 characters.";
        }
        return "";
      case "phone":
        return validatePhone(value);
      case "qualification":
        return validateQualification(value);
      case "licenseNumber":
        return validateLicenseNumber(value);
      case "consultationFee":
        if (value === "" || isNaN(Number(value)) || Number(value) < 0) {
          return "Please enter a valid consultation fee.";
        }
        return "";
      default:
        return "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Dynamic field validation
    const err = validateField(name, value);
    setFieldErrors((prev) => ({
      ...prev,
      [name]: err,
    }));
  };

  const handleImageUpload = async (e) => {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await processImageFile(file, { maxSizeMB: MAX_IMAGE_SIZE_MB });
    if (!result.success) {
      setError(result.error);
      if (imageInputRef.current) imageInputRef.current.value = "";
      return;
    }

    setFormData((prev) => ({ ...prev, profileImage: result.base64 }));
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, profileImage: "" }));
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleScheduleToggle = (index) => {
    setSchedule((prev) =>
      prev.map((s, idx) => (idx === index ? { ...s, available: !s.available } : s))
    );
  };

  const handleScheduleTimeChange = (index, field, val) => {
    setSchedule((prev) =>
      prev.map((s, idx) => (idx === index ? { ...s, [field]: val } : s))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Comprehensive text and input validation
    const errors = {};
    const nameErr = validateFullName(formData.fullName);
    if (nameErr) errors.fullName = nameErr;

    const emailErr = validateEmail(formData.email);
    if (emailErr) errors.email = emailErr;

    if (!isEdit && (!formData.password || formData.password.length < 6)) {
      errors.password = "Temporary password must be at least 6 characters.";
    }
    if (isEdit && formData.password && formData.password.length < 6) {
      errors.password = "New password must be at least 6 characters.";
    }

    const phoneErr = validatePhone(formData.phone);
    if (phoneErr) errors.phone = phoneErr;

    const qualErr = validateQualification(formData.qualification);
    if (qualErr) errors.qualification = qualErr;

    const licErr = validateLicenseNumber(formData.licenseNumber);
    if (licErr) errors.licenseNumber = licErr;

    if (
      formData.consultationFee === "" ||
      isNaN(Number(formData.consultationFee)) ||
      Number(formData.consultationFee) < 0
    ) {
      errors.consultationFee = "Please enter a valid consultation fee.";
    }

    // Validate schedule times: start < end
    for (const item of schedule) {
      if (item.available && item.start >= item.end) {
        errors.schedule = `Invalid schedule on ${item.day}: Start time (${item.start}) must be earlier than End time (${item.end}).`;
        break;
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstErr = Object.values(errors)[0];
      setError(firstErr);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setLoading(true);

    try {
      const availabilityMap = {};
      schedule.forEach((s) => {
        availabilityMap[s.day.toLowerCase()] = {
          day: s.day,
          available: s.available,
          start: s.start,
          end: s.end,
        };
      });

      if (isEdit) {
        // ── UPDATE EXISTING DOCTOR ──
        const doctorRef = doc(db, "doctors", doctorId);
        const userRef = doc(db, "users", doctorId);

        const updatedDoctorData = {
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth,
          specialization: formData.specialization,
          qualification: formData.qualification,
          experience: formData.experience,
          licenseNumber: formData.licenseNumber,
          consultationFee: Number(formData.consultationFee) || 50,
          biography: formData.biography,
          roomNumber: formData.roomNumber,
          image:
            formData.profileImage ||
            "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80",
          status: formData.status,
          availability: availabilityMap,
          updatedAt: serverTimestamp(),
        };

        await updateDoc(doctorRef, updatedDoctorData);

        // Also update users collection document
        await setDoc(
          userRef,
          {
            uid: doctorId,
            fullName: formData.fullName.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            gender: formData.gender,
            dateOfBirth: formData.dateOfBirth,
            role: "doctor",
            status: formData.status,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        setSuccess(`Dr. ${formData.fullName}'s account and schedule updated successfully!`);
        setTimeout(() => {
          navigate("/admin/doctors");
        }, 1200);
      } else {
        // ── CREATE NEW DOCTOR ──
        let doctorUid = null;

        try {
          const userCred = await createUserWithEmailAndPassword(
            secondaryAuth,
            formData.email.trim(),
            formData.password
          );
          doctorUid = userCred.user.uid;
        } catch (authErr) {
          if (authErr.code === "auth/email-already-in-use") {
            try {
              const signInCred = await signInWithEmailAndPassword(
                secondaryAuth,
                formData.email.trim(),
                formData.password
              );
              doctorUid = signInCred.user.uid;
            } catch (signInErr) {
              throw new Error(
                "An account with this email already exists with a different password. Please use a unique email or the matching password."
              );
            }
          } else {
            throw authErr;
          }
        }

        // Create or update users/{doctorUid} with role: "doctor"
        await setDoc(
          doc(db, "users", doctorUid),
          {
            uid: doctorUid,
            fullName: formData.fullName.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            gender: formData.gender,
            dateOfBirth: formData.dateOfBirth,
            role: "doctor",
            status: formData.status,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        // Create or update doctors/{doctorUid} with clinical profile & roster
        await setDoc(
          doc(db, "doctors", doctorUid),
          {
            id: doctorUid,
            uid: doctorUid,
            fullName: formData.fullName.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            gender: formData.gender,
            dateOfBirth: formData.dateOfBirth,
            specialization: formData.specialization,
            qualification: formData.qualification,
            experience: formData.experience,
            licenseNumber: formData.licenseNumber,
            consultationFee: Number(formData.consultationFee) || 50,
            biography: formData.biography,
            roomNumber: formData.roomNumber,
            image:
              formData.profileImage ||
              "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80",
            status: formData.status,
            availability: availabilityMap,
            totalAppointments: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        await signOut(secondaryAuth);

        setSuccess(`Doctor account for Dr. ${formData.fullName} created successfully!`);
        setTimeout(() => {
          navigate("/admin/doctors");
        }, 1200);
      }
    } catch (err) {
      console.error("Error saving doctor account:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("An account with this email already exists in the system.");
      } else if (err.code === "permission-denied" || err.message?.includes("permissions")) {
        setError("Firestore Permissions Error: Please ensure Firestore Rules are published in Firebase Console.");
      } else {
        setError(err.message || "Failed to save doctor account. Please verify input data.");
      }
    } finally {
      setLoading(false);
    }
  };

  const specialtiesList = [
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

  if (initialLoading) {
    return (
      <div className="py-24 text-center text-xs text-slate-400">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-sky-600 border-t-transparent mb-2"></div>
        <p>Loading doctor information and schedule...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back button & title */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin/doctors"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {isEdit ? "Edit Doctor Account" : "Create Doctor Account"}
          </h2>
          <p className="text-xs text-slate-500">
            {isEdit
              ? `Update clinical details, credentials, and weekly availability for Dr. ${formData.fullName || "Doctor"}.`
              : "Doctors cannot self-register. Fill out this form to provision an official clinic medical account."}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl bg-rose-50 p-4 text-xs font-semibold text-rose-700 border border-rose-100">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-700 border border-emerald-100">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Identity & Login Credentials */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3">
            1. Doctor Identity & Authentication Credentials
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                Doctor Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Dr. Jane Doe"
                required
                className={`w-full rounded-xl border p-2.5 text-xs text-slate-900 outline-none transition ${
                  fieldErrors.fullName
                    ? "border-rose-300 bg-rose-50/20 focus:border-rose-500 focus:bg-white"
                    : "border-slate-200 bg-slate-50/50 focus:border-sky-600 focus:bg-white"
                }`}
              />
              {fieldErrors.fullName && (
                <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-rose-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{fieldErrors.fullName}</span>
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="doctor@careplus.clinic"
                required
                className={`w-full rounded-xl border p-2.5 text-xs text-slate-900 outline-none transition ${
                  fieldErrors.email
                    ? "border-rose-300 bg-rose-50/20 focus:border-rose-500 focus:bg-white"
                    : "border-slate-200 bg-slate-50/50 focus:border-sky-600 focus:bg-white"
                }`}
              />
              {fieldErrors.email && (
                <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-rose-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{fieldErrors.email}</span>
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                {isEdit ? "Update Password (Optional)" : "Temporary Password"}{" "}
                {!isEdit && <span className="text-rose-500">*</span>}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={isEdit ? "Leave blank to keep current password" : "Min. 6 characters"}
                required={!isEdit}
                className={`w-full rounded-xl border p-2.5 text-xs text-slate-900 outline-none transition ${
                  fieldErrors.password
                    ? "border-rose-300 bg-rose-50/20 focus:border-rose-500 focus:bg-white"
                    : "border-slate-200 bg-slate-50/50 focus:border-sky-600 focus:bg-white"
                }`}
              />
              {fieldErrors.password && (
                <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-rose-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{fieldErrors.password}</span>
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+254 700 000 000"
                className={`w-full rounded-xl border p-2.5 text-xs text-slate-900 outline-none transition ${
                  fieldErrors.phone
                    ? "border-rose-300 bg-rose-50/20 focus:border-rose-500 focus:bg-white"
                    : "border-slate-200 bg-slate-50/50 focus:border-sky-600 focus:bg-white"
                }`}
              />
              {fieldErrors.phone && (
                <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-rose-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{fieldErrors.phone}</span>
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 outline-none focus:border-sky-600 transition"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                Date of Birth
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 outline-none focus:border-sky-600 transition"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Medical Practice & Clinical Details */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3">
            2. Specialization & Clinical Information
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                Specialization <span className="text-rose-500">*</span>
              </label>
              <select
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 outline-none focus:border-sky-600 transition"
              >
                {specialtiesList.map((sp) => (
                  <option key={sp} value={sp}>
                    {sp}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                Qualifications & Degrees
              </label>
              <input
                type="text"
                name="qualification"
                value={formData.qualification}
                onChange={handleChange}
                placeholder="e.g. MBBS, MD, FRCS"
                className={`w-full rounded-xl border p-2.5 text-xs text-slate-900 outline-none transition ${
                  fieldErrors.qualification
                    ? "border-rose-300 bg-rose-50/20 focus:border-rose-500 focus:bg-white"
                    : "border-slate-200 bg-slate-50/50 focus:border-sky-600 focus:bg-white"
                }`}
              />
              {fieldErrors.qualification && (
                <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-rose-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{fieldErrors.qualification}</span>
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                Years of Experience
              </label>
              <input
                type="text"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                placeholder="e.g. 8+ years experience"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 outline-none focus:border-sky-600 transition"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                Medical License Number
              </label>
              <input
                type="text"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleChange}
                placeholder="e.g. MED-89410-KE"
                className={`w-full rounded-xl border p-2.5 text-xs text-slate-900 outline-none transition ${
                  fieldErrors.licenseNumber
                    ? "border-rose-300 bg-rose-50/20 focus:border-rose-500 focus:bg-white"
                    : "border-slate-200 bg-slate-50/50 focus:border-sky-600 focus:bg-white"
                }`}
              />
              {fieldErrors.licenseNumber && (
                <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-rose-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{fieldErrors.licenseNumber}</span>
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                Consultation Fee ($)
              </label>
              <input
                type="number"
                name="consultationFee"
                value={formData.consultationFee}
                onChange={handleChange}
                placeholder="50"
                className={`w-full rounded-xl border p-2.5 text-xs text-slate-900 outline-none transition ${
                  fieldErrors.consultationFee
                    ? "border-rose-300 bg-rose-50/20 focus:border-rose-500 focus:bg-white"
                    : "border-slate-200 bg-slate-50/50 focus:border-sky-600 focus:bg-white"
                }`}
              />
              {fieldErrors.consultationFee && (
                <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-rose-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{fieldErrors.consultationFee}</span>
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                Clinic Room / Office
              </label>
              <input
                type="text"
                name="roomNumber"
                value={formData.roomNumber}
                onChange={handleChange}
                placeholder="Room 204"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 outline-none focus:border-sky-600 transition"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-bold uppercase text-slate-700">
                Doctor Profile Photo (Upload from Computer)
              </label>

              {formData.profileImage ? (
                <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5">
                  <img
                    src={formData.profileImage}
                    alt="Doctor preview"
                    className="h-16 w-16 rounded-xl object-cover border-2 border-sky-600 shadow-sm shrink-0"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-bold text-slate-800">
                      Doctor Photo Selected
                    </p>
                    <p className="text-[11px] text-emerald-600 font-semibold">
                      ✓ Ready to save with doctor profile
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="text-[11px] font-bold text-sky-700 hover:text-sky-800 hover:underline cursor-pointer"
                      >
                        Change Photo
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                      >
                        Remove Photo
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => imageInputRef.current?.click()}
                  className="flex items-center gap-4 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-4 hover:border-sky-500 hover:bg-sky-50/40 transition cursor-pointer group"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-700 group-hover:scale-105 transition shrink-0">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Click to browse doctor photo from computer
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Supports PNG, JPG, WEBP formats (Max {MAX_IMAGE_SIZE_MB}MB)
                    </p>
                  </div>
                </div>
              )}

              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                Account Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 outline-none focus:border-sky-600 transition"
              >
                <option value="active">Active (Available for appointments)</option>
                <option value="inactive">Inactive (Suspended)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
              Biography & Medical Summary
            </label>
            <textarea
              id="symptoms"
              rows={3}
              name="biography"
              spellCheck={true}
              lang="en"
              data-gramm="true"
              data-gramm_editor="true"
              data-enable-grammarly="true"
              data-lt-active="true"
              autoCapitalize="sentences"
              autoComplete="on"
              value={formData.biography}
              onChange={handleChange}
              placeholder="Short professional summary about the doctor's clinical focus..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 outline-none focus:border-sky-600 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Section 3: Weekly Working Schedule & Availability */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                3. Weekly Working Days & Hours
              </h3>
              <p className="text-[11px] text-slate-500">
                Define the doctor's consultation slots. Ensure Start Time is strictly earlier than End Time.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {schedule.map((item, idx) => (
              <div
                key={item.day}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl p-3.5 border transition ${
                  item.available
                    ? "border-sky-100 bg-sky-50/30"
                    : "border-slate-100 bg-slate-50/50 opacity-60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={item.available}
                    onChange={() => handleScheduleToggle(idx)}
                    className="h-4 w-4 rounded border-slate-300 text-sky-600 accent-sky-600 cursor-pointer"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">{item.day}</p>
                    <span
                      className={`text-[10px] font-extrabold uppercase ${
                        item.available ? "text-emerald-600" : "text-slate-400"
                      }`}
                    >
                      {item.available ? "Active Working Day" : "Off Day"}
                    </span>
                  </div>
                </div>

                {item.available ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-slate-400">Start:</span>
                      <input
                        type="time"
                        value={item.start}
                        onChange={(e) => handleScheduleTimeChange(idx, "start", e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 outline-none focus:border-sky-600"
                      />
                    </div>
                    <span className="text-slate-400 text-xs">—</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-slate-400">End:</span>
                      <input
                        type="time"
                        value={item.end}
                        onChange={(e) => handleScheduleTimeChange(idx, "end", e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 outline-none focus:border-sky-600"
                      />
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">No slots scheduled</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2">
          <Link
            to="/admin/doctors"
            className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-sky-700 px-8 py-3 text-xs font-bold text-white shadow-lg shadow-sky-700/20 hover:bg-sky-800 disabled:opacity-50 transition cursor-pointer"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                <span>{isEdit ? "Saving Doctor Changes..." : "Provisioning Doctor Account..."}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>{isEdit ? "Save Changes" : "Create Doctor Account"}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
