const functions = require("firebase-functions");
const admin = require("firebase-admin");

/**
 * Callable Cloud Function: createDoctorAccount
 * Enforces:
 * 1. Caller must be authenticated.
 * 2. Caller must have role == 'admin' in users/{callerUid}.
 * 3. Creates Firebase Auth user.
 * 4. Creates users/{doctorUid} with role: 'doctor'.
 * 5. Creates doctors/{doctorId} with profile and availability.
 */
exports.createDoctorAccountHandler = async (data, context) => {
  // 1. Verify caller authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication is required to create a doctor account."
    );
  }

  const callerUid = context.auth.uid;
  const db = admin.firestore();

  // 2. Verify caller role == 'admin'
  const callerDoc = await db.collection("users").doc(callerUid).get();
  if (!callerDoc.exists || callerDoc.data().role !== "admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only a System Administrator can create doctor accounts."
    );
  }

  const {
    fullName,
    email,
    password,
    phone,
    gender,
    dateOfBirth,
    specialization,
    qualification,
    experience,
    licenseNumber,
    consultationFee,
    biography,
    roomNumber,
    profileImage,
    status = "active",
    availability = {},
  } = data;

  if (!fullName || !email || !password || !specialization) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required fields: fullName, email, password, and specialization are required."
    );
  }

  try {
    // 3. Create Firebase Authentication user
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: fullName,
      phoneNumber: phone ? phone.startsWith("+") ? phone : undefined : undefined,
    });

    const doctorUid = userRecord.uid;

    // 4. Create user document with role: "doctor"
    const userPayload = {
      uid: doctorUid,
      fullName,
      email,
      phone: phone || "",
      gender: gender || "",
      dateOfBirth: dateOfBirth || "",
      role: "doctor",
      status: status || "active",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("users").doc(doctorUid).set(userPayload);

    // 5. Create doctor document with clinical profile & availability
    const doctorPayload = {
      id: doctorUid,
      uid: doctorUid,
      fullName,
      email,
      phone: phone || "",
      specialization,
      qualification: qualification || "",
      experience: experience || "",
      licenseNumber: licenseNumber || "",
      consultationFee: Number(consultationFee) || 0,
      biography: biography || "",
      roomNumber: roomNumber || "",
      image: profileImage || "",
      status: status || "active",
      availability: availability || {},
      totalAppointments: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("doctors").doc(doctorUid).set(doctorPayload);

    return {
      success: true,
      doctorId: doctorUid,
      message: `Doctor account for ${fullName} created successfully.`,
    };
  } catch (err) {
    console.error("Error creating doctor account:", err);
    throw new functions.https.HttpsError(
      "internal",
      err.message || "Failed to create doctor account."
    );
  }
};
