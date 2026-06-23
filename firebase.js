import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where
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
   AUTH
========================= */

export async function login() {
  if (auth.currentUser) {
    return normalizeUser(auth.currentUser);
  }

  const result = await signInWithPopup(auth, provider);
  return normalizeUser(result.user);
}

export async function logout() {
  await signOut(auth);
}

export function watchAuth(callback) {
  return onAuthStateChanged(auth, (user) => {
    callback(normalizeUser(user));
  });
}

/* =========================
   COMMENTS (people 구조)
   people/{postId}/comments
========================= */

export async function addComment(postId, text, user, parentId = null) {
  return await addDoc(
    collection(db, "people", postId, "comments"),
    {
      text,
      parentId,
      uid: user.uid,
      name: user.name,
      photo: user.photo,
      createdAt: serverTimestamp()
    }
  );
}

export async function getComments(postId) {
  const snap = await getDocs(
    collection(db, "people", postId, "comments")
  );

  return snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));
}

export async function updateComment(postId, commentId, text) {
  await updateDoc(
    doc(db, "people", postId, "comments", commentId),
    { text }
  );
}

export async function deleteComment(postId, commentId) {
  await deleteDoc(
    doc(db, "people", postId, "comments", commentId)
  );
}

/* =========================
   USER NOTIFICATIONS (루트)
========================= */

export async function addNotification(
  recipientUid,
  senderUser,
  postId,
  type
) {
  return await addDoc(
    collection(db, "notifications"),
    {
      recipientUid,
      senderUid: senderUser.uid,
      senderName: senderUser.name,
      senderPhoto: senderUser.photo,
      postId,
      type,
      read: false,
      createdAt: serverTimestamp()
    }
  );
}

export async function getNotifications(uid) {
  const q = query(
    collection(db, "notifications"),
    where("recipientUid", "==", uid)
  );

  const snap = await getDocs(q);

  return snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));
}

/* =========================
   ADMIN NOTIFICATIONS
========================= */

export async function addAdminNotification(postId, sender, type) {
  return await addDoc(
    collection(db, "adminNotifications"),
    {
      postId,
      sender,
      type,
      read: false,
      createdAt: serverTimestamp()
    }
  );
}

/* =========================
   ADMIN READ
========================= */

export async function markAdminNotificationRead(notificationId) {
  return await updateDoc(
    doc(db, "adminNotifications", notificationId),
    {
      read: true
    }
  );
}