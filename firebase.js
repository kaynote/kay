import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
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
  appId: "1:276470297982:web:838b8a57269b26cd3d6f2f"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();

/* =========================
AUTH
========================= */

function normalize(user) {
  if (!user) return null;

  return {
    uid: user.uid,
    email: user.email,
    name:
      user.displayName ||
      user.providerData?.[0]?.displayName ||
      user.email ||
      "익명",
    photo: user.photoURL || ""
  };
}

export async function login() {
  const res = await signInWithPopup(auth, provider);
  return normalize(res.user);
}

export async function logout() {
  return signOut(auth);
}

export function watchAuth(cb) {
  return onAuthStateChanged(auth, (u) => cb(normalize(u)));
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

export function watchComments(postId, cb) {
  return onSnapshot(
    collection(db, "people", postId, "comments"),
    (snap) => {
      const arr = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      arr.sort((a, b) =>
        (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)
      );

      cb(arr, snap.docChanges());
    }
  );
}

/* =========================
NOTIFICATIONS
========================= */

export async function addNotification(targetUid, senderUid, senderName, personId, commentId, type) {
  if (!targetUid || targetUid === senderUid) return;

  const q = query(
    collection(db, "notifications"),
    where("targetUid", "==", targetUid),
    where("senderUid", "==", senderUid),
    where("commentId", "==", commentId)
  );

  const snap = await getDocs(q);
  if (!snap.empty) return;

  return addDoc(collection(db, "notifications"), {
    targetUid,
    senderUid,
    senderName,
    personId,
    commentId,
    type,
    read: false,
    createdAt: serverTimestamp()
  });
}

export async function addNotifications(targets, senderUid, senderName, commentId, type) {
  await Promise.all(
    targets.map(uid =>
      addNotification(uid, senderUid, senderName, null, commentId, type)
    )
  );
}

export function watchNotifications(uid, cb) {
  return onSnapshot(
    query(collection(db, "notifications"), where("targetUid", "==", uid)),
    (snap) => {
      cb(
        snap.docs.map(d => ({ id: d.id, ...d.data() }))
      );
    }
  );
}

export async function markNotificationRead(id) {
  return updateDoc(doc(db, "notifications", id), { read: true });
}

/* =========================
UTIL
========================= */

export async function getParticipants(postId) {
  const snap = await getDocs(collection(db, "people", postId, "comments"));

  const set = new Set();
  snap.forEach(d => set.add(d.data().uid));

  return [...set];
}

export async function getCommentById(postId, commentId) {
  const snap = await getDoc(
    doc(db, "people", postId, "comments", commentId)
  );

  return snap.exists()
    ? { id: snap.id, ...snap.data() }
    : null;
}