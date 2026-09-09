const functions = require("firebase-functions");
const admin = require("firebase-admin");

exports.disableDoctorAccountHandler = async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
  }

  const callerUid = context.auth.uid;
  const db = admin.firestore();

  const callerDoc = await db.collection("users").doc(callerUid).get();
  if (!callerDoc.exists || callerDoc.data().role !== "admin") {
    throw new functions.https.HttpsError("permission-denied", "Admin role required.");
  }

  const { doctorId, disabled } = data;
  if (!doctorId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing doctorId.");
  }

  await admin.auth().updateUser(doctorId, { disabled: Boolean(disabled) });
  const newStatus = disabled ? "inactive" : "active";

  await db.collection("users").doc(doctorId).update({
    status: newStatus,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await db.collection("doctors").doc(doctorId).update({
    status: newStatus,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true, status: newStatus };
};
