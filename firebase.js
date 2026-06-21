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
   PROVIDER FACTORY
   🔥 핵심: 매번 새로 생성
========================= */

function createProvider() {
  const provider = new GoogleAuthProvider();

  provider.setCustomParameters({
    prompt: "select_account"
  });

  return provider;
}

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
  const result = await signInWithPopup(auth, createProvider());
  return normalizeUser(result.user);
}

/* =========================
   LOGOUT
   🔥 완전 초기화
========================= */

export async function logout() {
  await signOut(auth);

  // Firebase 캐시 제거
  sessionStorage.clear();

  // Google 세션 영향 최소화
  localStorage.removeItem("firebase:authUser");

  // 확실하게 다시 선택창 보이게
  location.reload();
}

/* =========================
   SWITCH ACCOUNT (선택)
========================= */

export async function switchAccount() {
  await logout();
  const result = await signInWithPopup(auth, createProvider());
  return normalizeUser(result.user);
}

/* =========================
   AUTH WATCHER
========================= */

export function watchAuth(callback) {
  return onAuthStateChanged(auth, (user) => {
    callback(normalizeUser(user));
  });
}