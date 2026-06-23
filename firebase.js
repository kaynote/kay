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
   AUTH
========================= */
function normalizeUser(user) {
  if (!user) return null;

  return {
    uid: user.uid,
    email: user.email,
    name: user.displayName || user.email,
    photo: user.photoURL || ""
  };
}

export async function login() {
  if (auth.currentUser) return normalizeUser(auth.currentUser);

  const result = await signInWithPopup(auth, provider);
  return normalizeUser(result.user);
}

export async function logout() {
  return signOut(auth);
}

export function watchAuth(cb) {
  return onAuthStateChanged(auth, (user) => {
    cb(normalizeUser(user));
  });
}

/* =========================
   COMMENTS
========================= */
export async function addComment(postId, text, user, parentId = null) {
  return addDoc(
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

  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateComment(postId, commentId, text) {
  return updateDoc(
    doc(db, "people", postId, "comments", commentId),
    { text }
  );
}

export async function deleteComment(postId, commentId) {
  return deleteDoc(
    doc(db, "people", postId, "comments", commentId)
  );
}

/* =========================
   NOTIFICATIONS (USER)
========================= */
export async function addNotification(recipientUid, senderUser, postId, type) {
  return addDoc(
    collection(db, "people", postId, "notifications"),
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

export async function getNotifications(postId, uid) {
  const q = query(
    collection(db, "people", postId, "notifications"),
    where("recipientUid", "==", uid)
  );

  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/* =========================
   ADMIN NOTIFICATIONS
========================= */
export async function addAdminNotification(postId, sender, type) {
  return addDoc(
    collection(db, "people", postId, "adminNotifications"),
    {
      postId,
      sender,
      type,
      read: false,
      createdAt: serverTimestamp()
    }
  );
}

export async function markAdminNotificationRead(postId, id) {
  return updateDoc(
    doc(db, "people", postId, "adminNotifications", id),
    { read: true }
  );
}