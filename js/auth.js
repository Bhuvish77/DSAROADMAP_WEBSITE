// Shared auth helpers used by login.html, signup.html and app.html.

/* =========================================================
   JNN EMAIL VALIDATION
   ========================================================= */

function isCollegeEmail(email) {
  return /^[a-zA-Z0-9._%+-]+@jnn\.edu\.in$/i.test(email.trim());
}

function validateCollegeEmail(email) {
  if (!isCollegeEmail(email)) {
    const error = new Error(
      "Please use your JNN college email ending with @jnn.edu.in."
    );

    error.code = "auth/jnn-email-required";
    throw error;
  }
}


/* =========================================================
   SIGN UP
   ========================================================= */

async function signUpStudent(name, email, password) {

  email = email.trim().toLowerCase();

  // IMPORTANT:
  // This runs BEFORE Firebase account creation.
  validateCollegeEmail(email);

  const credential = await auth.createUserWithEmailAndPassword(
    email,
    password
  );

  await credential.user.updateProfile({
    displayName: name
  });

  await db.collection("students").doc(credential.user.uid).set({
    name,
    email,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    completed: {},
  });

  return credential.user;
}


/* =========================================================
   LOGIN
   ========================================================= */

async function logInStudent(email, password) {

  email = email.trim().toLowerCase();

  // Block non-JNN emails BEFORE Firebase login
  validateCollegeEmail(email);

  const credential = await auth.signInWithEmailAndPassword(
    email,
    password
  );

  return credential.user;
}


/* =========================================================
   PASSWORD RESET
   ========================================================= */

async function sendPasswordReset(email) {

  email = email.trim().toLowerCase();

  validateCollegeEmail(email);

  await auth.sendPasswordResetEmail(email);
}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logOutStudent() {
  await auth.signOut();
  window.location.href = "login.html";
}


/* =========================================================
   PROTECTED PAGE
   ========================================================= */

function requireLogin() {
  return new Promise((resolve) => {

    auth.onAuthStateChanged((user) => {

      if (!user) {
        window.location.href = "login.html";
      } else {
        resolve(user);
      }

    });

  });
}


/* =========================================================
   REDIRECT IF ALREADY LOGGED IN
   ========================================================= */

function redirectIfLoggedIn() {

  auth.onAuthStateChanged((user) => {

    if (user) {
      window.location.href = "app.html";
    }

  });

}


/* =========================================================
   FIREBASE ERROR MESSAGES
   ========================================================= */

function friendlyAuthError(error) {

  const map = {

    "auth/jnn-email-required":
      "Only JNN college email addresses ending with @jnn.edu.in are allowed.",

    "auth/email-already-in-use":
      "That email already has an account. Try logging in instead.",

    "auth/invalid-email":
      "That doesn't look like a valid email address.",

    "auth/weak-password":
      "Password should be at least 6 characters.",

    "auth/user-not-found":
      "No account found with that email.",

    "auth/wrong-password":
      "Incorrect password. Try again or reset it.",

    "auth/invalid-credential":
      "Incorrect email or password.",

    "auth/too-many-requests":
      "Too many attempts. Wait a bit and try again.",

    "auth/network-request-failed":
      "Network error — check your connection.",

  };

  return (
    map[error.code] ||
    error.message ||
    "Something went wrong. Please try again."
  );
}