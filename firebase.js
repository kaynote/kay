import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  doc,
  deleteDoc
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
  appId: "1:276470297982:web:838b8a57269b26cd3d6f2f"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();

/* =========================
   USER NORMALIZER
========================= */
function normalizeUser(user) {
  if (!user) return null;

  return {
    uid: user.uid,
    email: user.email || "",
    name:
      user.providerData?.[0]?.displayName ||
      user.displayName ||
      user.email ||
      "익명",
    photo: user.photoURL || ""
  };
}

/* =========================
   LOGIN / LOGOUT
========================= */
export async function login() {
  const result = await signInWithPopup(auth, provider);
  return normalizeUser(result.user);
}

export async function logout() {
  await signOut(auth);
}

export function watchAuth(cb) {
  return onAuthStateChanged(auth, (user) => {
    cb(normalizeUser(user));
  });
}

/* =========================
   🔥 COMMENTS (대댓글 핵심)
========================= */

// 댓글 추가 (일반 + 대댓글)
export async function addComment(personId, text, user, parentId = null) {
  return await addDoc(
    collection(db, "people", String(personId), "comments"),
    {
      text,
      uid: user.uid,
      name: user.name,
      photo: user.photo,
      parentId, // 👈 핵심 (대댓글 구조)
      createdAt: serverTimestamp()
    }
  );
}

// 댓글 실시간 구독
export function watchComments(personId, callback) {
  const q = query(
    collection(db, "people", String(personId), "comments"),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(q, (snap) => {
    const comments = snap.docs.map((d) => ({
      id: d.id,
      ...d.data()
    }));

    callback(comments);
  });
}

// 댓글 수정
export async function editComment(personId, commentId, newText) {
  return await updateDoc(
    doc(db, "people", String(personId), "comments", commentId),
    { text: newText }
  );
}

// 댓글 삭제 (대댓글 포함 동일)
export async function deleteComment(personId, commentId) {
  return await deleteDoc(
    doc(db, "people", String(personId), "comments", commentId)
  );
}