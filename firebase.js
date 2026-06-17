import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

/* =========================
   CONFIG
========================= */

const firebaseConfig = {
  apiKey: "AIzaSyCAZzJdAB_a65dkJaL-XLQqzImzlSI8Gmw",
  authDomain: "kay-gallery.firebaseapp.com",
  projectId: "kay-gallery",
  storageBucket: "kay-gallery.firebasestorage.app",
  messagingSenderId: "276470297982",
  appId: "1:276470297982:web:838b8a57269b26cd3d6f2f",
  measurementId: "G-E61XXMZCHM"
};

/* =========================
   INIT
========================= */

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();

/* =========================
   USER NORMALIZER
   👉 핵심 추가
========================= */

function normalizeUser(user) {

  console.log("=== normalizeUser ===");
  console.log("displayName:", user?.displayName);
  console.log("email:", user?.email);
  console.log("providerData:", user?.providerData);

  if (!user) return null;

  return {
    uid: user.uid || "",
    email: user.email || "",
    name:
      user.displayName ||
      user.email ||
      auth.currentUser?.providerData?.[0]?.displayName ||
      "익명 사용자",
    photo: user.photoURL || ""
  };
}

/* =========================
   LOGIN
========================= */

export async function login() {

  if (auth.currentUser) {
    console.log("CURRENT:", auth.currentUser.displayName);
    return normalizeUser(auth.currentUser);
  }

const result = await signInWithPopup(auth, provider);

console.log("POPUP:", result.user.displayName);
console.log("EMAIL:", result.user.email);
console.log("PROVIDER:", result.user.providerData[0]);

return normalizeUser(result.user);
}

/* =========================
   LOGOUT
========================= */

export async function logout() {
  await signOut(auth);
}

/* =========================
   AUTH WATCHER
========================= */

export function watchAuth(callback) {

  return onAuthStateChanged(auth, (user) => {
    callback(normalizeUser(user));
  });
}