// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.deleteFirebaseUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be authenticated to delete users."
    );
  }

  const callerUid = context.auth.uid;
  const caller = await admin.auth().getUser(callerUid);
  if (!caller.customClaims?.admin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only admins can delete users."
    );
  }

  const uid = data.uid;

  try {
    await admin.auth().deleteUser(uid);
    return { success: true, message: `User ${uid} deleted successfully` };
  } catch (error) {
    throw new functions.https.HttpsError(
      "internal",
      `Error deleting user: ${error.message}`
    );
  }
});
