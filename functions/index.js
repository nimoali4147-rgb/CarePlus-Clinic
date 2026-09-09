const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const { createDoctorAccountHandler } = require("./src/auth/createDoctorAccount");
const { disableDoctorAccountHandler } = require("./src/auth/disableDoctorAccount");

// Export HTTPS Callable Functions
exports.createDoctorAccount = functions.https.onCall(createDoctorAccountHandler);
exports.disableDoctorAccount = functions.https.onCall(disableDoctorAccountHandler);
