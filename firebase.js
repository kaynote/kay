import { initializeApp } from
"https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import { getFirestore } from
"https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from
"https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCAZzJdAB_a65dkJaL-XLQqzImzlSI8Gmw",
    authDomain: "kay-gallery.firebaseapp.com",
    projectId: "kay-gallery",
    storageBucket: "kay-gallery.firebasestorage.app",
    messagingSenderId: "276470297982",
    appId: "1:276470297982:web:838b8a57269b26cd3d6f2f",
    measurementId: "G-E61XXMZCHM"
  };

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

export const provider =
  new GoogleAuthProvider();

export {
  signInWithPopup,
  signOut,
  onAuthStateChanged
};