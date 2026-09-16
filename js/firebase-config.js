// STEP 1 of setup: paste your own Firebase project's config here.
// See README.md for exactly how to get these values (takes about 5 minutes,
// completely free — Firebase's free "Spark" plan covers a class-sized site).
const firebaseConfig = {
  apiKey: "AIzaSyAGJ_PF-usaDAzTO9rAeaaJ1a7mbznsDmo",
  authDomain: "dsawebsitefclub.firebaseapp.com",
  projectId: "dsawebsitefclub",
  storageBucket: "dsawebsitefclub.firebasestorage.app",
  messagingSenderId: "196992633722",
  appId: "1:196992633722:web:d8d8a9628a0a2901b824c3",
  measurementId: "G-VB3B76DXW3"
};

// Initialize Firebase (uses the compat SDK loaded via <script> tags in each HTML page)
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
