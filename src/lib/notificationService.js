import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Creates in-app Firestore notification document for patient when appointment is approved.
 * This triggers real-time updates in the website Navbar NotificationBell.
 */
export async function notifyAppointmentApproved(appointment) {
  if (!appointment) return;

  try {
    let patientEmail = appointment.patientEmail;
    let patientName = appointment.patientName;
    const patientId = appointment.userId || appointment.patientId;

    // If email or name missing from appointment doc, try fetching from user doc
    if ((!patientEmail || !patientName) && patientId) {
      try {
        const uSnap = await getDoc(doc(db, "users", patientId));
        if (uSnap.exists()) {
          const uData = uSnap.data();
          if (!patientEmail) patientEmail = uData.email;
          if (!patientName) patientName = uData.fullName;
        }
      } catch (uErr) {
        console.warn("Could not lookup patient user doc:", uErr);
      }
    }

    const doctorName = appointment.doctorName || appointment.doctor || "Practitioner";
    const date = appointment.date || "";
    const time = appointment.time || "";

    // Create Firestore in-app Notification record
    if (patientId || patientEmail) {
      await addDoc(collection(db, "notifications"), {
        userId: patientId || "",
        recipientEmail: patientEmail || "",
        appointmentId: appointment.id || "",
        type: "appointment_approved",
        status: "approved",
        title: "🎉 Appointment Approved!",
        message: `Your appointment with Dr. ${doctorName} on ${date} at ${time} has been officially approved!`,
        doctorName: doctorName,
        date: date,
        time: time,
        read: false,
        createdAt: serverTimestamp(),
      });
      console.log("In-app notification created successfully for patient:", patientId || patientEmail);
    }
  } catch (err) {
    console.error("Failed to create in-app notification:", err);
  }
}
