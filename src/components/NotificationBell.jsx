import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  Stethoscope,
  ExternalLink,
  CheckCheck,
  Sparkles,
  Info,
  X,
} from "lucide-react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function NotificationBell({
  role = "admin",
  doctorId = null,
  doctorName = "",
  patientId = null,
  userEmail = "",
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [doctorsMap, setDoctorsMap] = useState({});

  const storageKey =
    role === "patient" || patientId
      ? `read_notifs_patient_${patientId || userEmail || "patient"}`
      : `read_notifs_${role}_${doctorId || "admin"}`;

  const [readIds, setReadIds] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Listen to users and doctors for profile photos in real time
  useEffect(() => {
    const unsubUsers = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const map = {};
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const img = data.image || data.photoURL || data.profileImage || "";
          if (img) {
            map[doc.id] = img;
            if (data.email) {
              map[data.email.toLowerCase().trim()] = img;
            }
          }
        });
        setUsersMap(map);
      },
      (err) => console.warn("Notification users map error:", err)
    );

    const unsubDoctors = onSnapshot(
      collection(db, "doctors"),
      (snapshot) => {
        const map = {};
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const img = data.image || data.photoURL || data.profileImage || "";
          if (img) {
            map[doc.id] = img;
            if (data.name) {
              map[data.name.toLowerCase().trim()] = img;
              map[data.name.toLowerCase().replace(/^dr\.?\s*/i, "").trim()] = img;
            }
          }
        });
        setDoctorsMap(map);
      },
      (err) => console.warn("Notification doctors map error:", err)
    );

    return () => {
      unsubUsers();
      unsubDoctors();
    };
  }, []);

  // Listen to Firestore in real time
  useEffect(() => {
    const isPatient = role === "patient" || (!doctorId && patientId);

    if (isPatient) {
      // 1. Patient Mode: Listen to user's appointments and ONLY show APPROVED ones!
      const unsubAppts = onSnapshot(
        collection(db, "appointments"),
        (snapshot) => {
          const allDocs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

          // Match patient's appointments
          const myAppts = allDocs.filter((a) => {
            const matchId =
              patientId && (a.userId === patientId || a.patientId === patientId);
            const matchEmail =
              userEmail && a.patientEmail?.toLowerCase() === userEmail.toLowerCase();
            return matchId || matchEmail;
          });

          // ONLY SHOW APPROVED (do NOT include completed, cancelled, or pending)
          const approvedOnly = myAppts.filter((a) => {
            const status = (a.status || "").toLowerCase();
            return status === "approved" || status === "confirmed";
          });

          // Map to standardized notification item format
          const formatted = approvedOnly.map((a) => {
            const doctorLabel = a.doctorName || a.doctor || "CarePlus Specialist";
            return {
              id: a.id,
              type: "approved",
              title: "🎉 Appointment Approved!",
              subtitle: `Dr. ${doctorLabel}`,
              doctorId: a.doctorId || "",
              doctorName: a.doctorName || a.doctor || "",
              doctorImage: a.doctorImage || "",
              userId: a.userId || a.patientId || "",
              patientEmail: a.patientEmail || "",
              message: `Your appointment for ${a.date || ""} at ${a.time || ""} has been officially approved.`,
              date: a.date,
              time: a.time,
              dayName: a.dayName,
              status: "Approved",
              link: "/patient/appointments",
              createdAt: a.updatedAt || a.approvedAt || a.createdAt,
            };
          });

          // Sort newest first
          formatted.sort((a, b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return timeB - timeA;
          });

          setItems(formatted);
        },
        (err) => {
          console.warn("Patient appointments listener error:", err);
        }
      );

      return () => {
        unsubAppts();
      };
    } else {
      // 2. Doctor / Admin Mode: Listen to pending appointments requiring review
      let q;
      if (role === "doctor" && doctorId) {
        q = query(
          collection(db, "appointments"),
          where("doctorId", "==", doctorId)
        );
      } else {
        q = collection(db, "appointments");
      }

      const unsub = onSnapshot(
        q,
        (snapshot) => {
          let list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

          // Fallback for doctor if doctorId wasn't matched on older docs
          if (role === "doctor" && doctorName && list.length === 0) {
            const qFallback = query(
              collection(db, "appointments"),
              where("doctorName", "==", doctorName)
            );
            onSnapshot(qFallback, (s) => {
              const fallbackList = s.docs.map((d) => ({ id: d.id, ...d.data() }));
              sortAndSet(fallbackList);
            });
            return;
          }

          sortAndSet(list);
        },
        (err) => {
          console.warn("Notifications listener error:", err);
        }
      );

      function sortAndSet(list) {
        // Show ONLY pending appointments in the notification bell
        const pendingList = list.filter(
          (a) => (a.status || "pending").toLowerCase() === "pending"
        );

        // Sort newest first
        pendingList.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return timeB - timeA;
        });

        const formatted = pendingList.map((a) => ({
          id: a.id,
          type: "pending",
          title: a.patientName || "New Patient",
          patientName: a.patientName || "New Patient",
          patientImage: a.patientImage || a.userImage || a.image || "",
          userId: a.userId || a.patientId || "",
          patientEmail: a.patientEmail || a.email || "",
          doctorId: a.doctorId || "",
          doctorName: a.doctorName || a.doctor || "",
          doctorImage: a.doctorImage || "",
          subtitle:
            role === "admin"
              ? `Dr. ${a.doctorName || a.doctor || "Doctor"}`
              : a.reason || "Consultation",
          message: a.reason || "Appointment booking request pending review.",
          date: a.date,
          time: a.time,
          dayName: a.dayName,
          status: "Pending",
          link: role === "doctor" ? "/doctor/appointments" : "/admin/appointments",
          createdAt: a.createdAt,
        }));

        setItems(formatted);
      }

      return () => unsub();
    }
  }, [role, doctorId, doctorName, patientId, userEmail]);

  // Unread items
  const unreadItems = items.filter((item) => !readIds.includes(item.id));
  const unreadCount = unreadItems.length;

  const markAllAsRead = () => {
    const allIds = items.map((item) => item.id);
    setReadIds(allIds);
    try {
      localStorage.setItem(storageKey, JSON.stringify(allIds));
    } catch (e) {
      console.warn(e);
    }
  };

  const markAsRead = (id) => {
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      setReadIds(updated);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const isPatient = role === "patient" || (!doctorId && patientId);
  const defaultTargetUrl =
    role === "patient" || (!doctorId && patientId)
      ? "/patient/appointments"
      : role === "doctor"
      ? "/doctor/appointments"
      : "/admin/appointments";

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-sky-300 transition cursor-pointer shadow-xs"
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white ring-2 ring-white animate-pulse shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-3xl bg-white p-4 shadow-2xl border border-slate-200 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">Notifications</h4>
                <p className="text-[10px] text-slate-400">
                  {unreadCount > 0
                    ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                    : "All caught up"}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[10px] font-bold text-sky-700 hover:text-sky-800 hover:underline cursor-pointer flex items-center gap-1"
              >
                <CheckCheck className="h-3 w-3" />
                Mark all as read
              </button>
            )}
          </div>

          {/* List of Notifications */}
          <div className="max-h-80 overflow-y-auto space-y-2 divide-y divide-slate-50 pr-0.5">
            {items.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <CheckCircle2 className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="font-semibold text-slate-600">No approved appointments yet</p>
                <p className="text-[11px] text-slate-400">
                  {isPatient
                    ? "When a doctor approves your appointment, it will appear here instantly."
                    : "New pending requests will appear here instantly."}
                </p>
              </div>
            ) : (
              items.slice(0, 8).map((item) => {
                const isUnread = !readIds.includes(item.id);
                const isApproved =
                  (item.status || "").toLowerCase() === "approved" ||
                  (item.status || "").toLowerCase() === "confirmed";

                return (
                  <Link
                    key={item.id}
                    to={item.link || defaultTargetUrl}
                    onClick={() => {
                      markAsRead(item.id);
                      setOpen(false);
                    }}
                    className={`block rounded-2xl p-3 transition ${
                      isUnread
                        ? isApproved
                          ? "bg-emerald-50/80 border border-emerald-200 shadow-xs"
                          : "bg-sky-50/70 border border-sky-100 shadow-xs"
                        : "hover:bg-slate-50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Profile Image / Avatar */}
                        {(() => {
                          const patientImg =
                            item.patientImage ||
                            (item.userId && usersMap[item.userId]) ||
                            (item.patientEmail && usersMap[item.patientEmail.toLowerCase().trim()]);

                          const doctorImg =
                            item.doctorImage ||
                            (item.doctorId && (doctorsMap[item.doctorId] || usersMap[item.doctorId])) ||
                            (item.doctorName && doctorsMap[item.doctorName.toLowerCase().trim()]) ||
                            (item.doctorName && doctorsMap[item.doctorName.toLowerCase().replace(/^dr\.?\s*/i, "").trim()]);

                          const avatarImg = isApproved ? (doctorImg || patientImg) : (patientImg || doctorImg);

                          if (avatarImg) {
                            return (
                              <div className="relative shrink-0">
                                <img
                                  src={avatarImg}
                                  alt={item.title}
                                  className="h-9 w-9 rounded-xl object-cover border border-sky-200 shadow-xs"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    const fallback = e.currentTarget.parentElement?.querySelector(".avatar-fallback");
                                    if (fallback) fallback.style.display = "flex";
                                  }}
                                />
                                <div
                                  style={{ display: "none" }}
                                  className={`avatar-fallback h-9 w-9 items-center justify-center rounded-xl font-bold text-xs ${
                                    isApproved
                                      ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-200"
                                      : "bg-sky-100 text-sky-700"
                                  }`}
                                >
                                  {isApproved ? (
                                    <CheckCircle2 className="h-4.5 w-4.5" />
                                  ) : (
                                    item.title.charAt(0).toUpperCase()
                                  )}
                                </div>
                                {isApproved && (
                                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white ring-1.5 ring-white">
                                    <CheckCircle2 className="h-2.5 w-2.5" />
                                  </span>
                                )}
                              </div>
                            );
                          }

                          return (
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${
                                isApproved
                                  ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-200"
                                  : "bg-sky-100 text-sky-700"
                              }`}
                            >
                              {isApproved ? (
                                <CheckCircle2 className="h-4.5 w-4.5" />
                              ) : (
                                item.title.charAt(0).toUpperCase()
                              )}
                            </div>
                          );
                        })()}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-black text-slate-900 leading-tight truncate">
                              {item.title}
                            </p>
                            {isUnread && (
                              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 font-semibold mt-0.5 truncate">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide shrink-0 ${
                          isApproved
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {item.status || "Approved"}
                      </span>
                    </div>

                    {/* Details Box */}
                    <div className="mt-2 space-y-1 text-[11px] text-slate-600 bg-white/80 p-2 rounded-xl border border-slate-100">
                      {item.message && (
                        <p className="text-[11px] font-medium text-slate-700 mb-1 leading-snug">
                          {item.message}
                        </p>
                      )}
                      {(item.date || item.time) && (
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500 font-medium">
                          {item.date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-emerald-600 shrink-0" />
                              <span>{item.dayName ? `${item.dayName}, ` : ""}{item.date}</span>
                            </div>
                          )}
                          {item.time && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-sky-600 shrink-0" />
                              <span>{item.time}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          {/* Footer Link */}
          <div className="border-t border-slate-100 pt-2.5 text-center">
            <Link
              to={defaultTargetUrl}
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-800 transition"
            >
              <span>{isPatient ? "View All My Appointments" : "View All Appointments"}</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
