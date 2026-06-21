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
   INIT
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

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

/* =========================
   PROVIDER
========================= */

const provider = new GoogleAuthProvider();

/* 🔥 핵심: 항상 계정 선택창 */
provider.setCustomParameters({
  prompt: "select_account"
});

/* =========================
   USER NORMALIZER
========================= */

function normalizeUser(user) {
  if (!user) return null;

  return {
    uid: user.uid || "",
    email: user.email || "",
    name:
      user.providerData?.[0]?.displayName ||
      user.displayName ||
      user.email ||
      "익명 사용자",
    photo: user.photoURL || ""
  };
}

/* =========================
   LOGIN
========================= */

export async function login() {
  const result = await signInWithPopup(auth, provider);
  return normalizeUser(result.user);
}

/* =========================
   LOGOUT
   🔥 핵심: 완전 초기화
========================= */

export async function logout() {
  await signOut(auth);

  // 중요: 이전 로그인 상태 캐시 방지
  sessionStorage.clear();
  localStorage.removeItem("firebase:authUser");
}

/* =========================
   SWITCH ACCOUNT (옵션)
========================= */

export async function switchAccount() {
  await logout();
  const result = await signInWithPopup(auth, provider);
  return normalizeUser(result.user);
}

/* =========================
   WATCHER
========================= */

export function watchAuth(callback) {
  return onAuthStateChanged(auth, (user) => {
    callback(normalizeUser(user));
  });
}