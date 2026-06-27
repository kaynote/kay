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
INIT
========================= */

const app = initializeApp({
  apiKey: "AIzaSyCAZzJdAB_a65dkJaL-XLQqzImzlSI8Gmw",
  authDomain: "kay-gallery.firebaseapp.com",
  projectId: "kay-gallery",
  storageBucket: "kay-gallery.firebasestorage.app",
  messagingSenderId: "276470297982",
  appId: "1:276470297982:web:838b8a57269b26cd3d6f2f",
});

export const db = getFirestore(app);
export const auth = getAuth(app);
const provider = new GoogleAuthProvider();

/* =========================
USER
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

/* =========================
AUTH
========================= */

export async function login() {
  if (auth.currentUser) return normalizeUser(auth.currentUser);
  const res = await signInWithPopup(auth, provider);
  return normalizeUser(res.user);
}

export function watchAuth(cb) {
  return onAuthStateChanged(auth, (u) => cb(normalizeUser(u)));
}

export async function logout() {
  await signOut(auth);
}

/* =========================
COMMENTS (FIXED)
========================= */

export async function addComment(postId, text, user, parentId = null) {
  return await addDoc(collection(db, "people", postId, "comments"), {
    text,
    parentId,
    uid: user.uid,
    name: user.name,
    photo: user.photo,
    createdAt: serverTimestamp()
  });
}

export function watchComments(postId, cb) {
  return onSnapshot(
    collection(db, "people", postId, "comments"),
    (snap) => {
      const list = [];

      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() });
      });

      list.sort((a, b) =>
        (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)
      );

      cb(list, snap.docChanges());
    }
  );
}

/* =========================
NOTIFICATIONS (STABLE CORE)
========================= */

export async function addNotification({
  targetUid,
  senderUid,
  senderName,
  commentId,
  type
}) {
  if (!targetUid || targetUid === senderUid) return;

  const q = query(
    collection(db, "notifications"),
    where("targetUid", "==", targetUid),
    where("commentId", "==", commentId),
    where("senderUid", "==", senderUid)
  );

  const snap = await getDocs(q);
  if (!snap.empty) return;

  await addDoc(collection(db, "notifications"), {
    targetUid,
    senderUid,
    senderName,
    commentId,
    type,
    read: false,
    createdAt: serverTimestamp()
  });
}

export async function addNotifications(list, data) {
  const jobs = [];

  list.forEach(uid => {
    if (!uid || uid === data.senderUid) return;

    jobs.push(
      addNotification({
        targetUid: uid,
        senderUid: data.senderUid,
        senderName: data.senderName,
        commentId: data.commentId,
        type: data.type
      })
    );
  });

  await Promise.all(jobs);
}

export function watchNotifications(uid, cb) {
  return onSnapshot(
    query(
      collection(db, "notifications"),
      where("targetUid", "==", uid)
    ),
    (snap) => {
      const list = [];

      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() });
      });

      list.sort(
        (a, b) =>
          (b.createdAt?.seconds || 0) -
          (a.createdAt?.seconds || 0)
      );

      cb(list);
    }
  );
}

export async function markNotificationRead(id) {
  await updateDoc(doc(db, "notifications", id), {
    read: true
  });
}

export async function deleteNotification(id) {
  await deleteDoc(doc(db, "notifications", id));
}

/* =========================
UTIL
========================= */

export async function getParticipants(postId) {
  const snap = await getDocs(collection(db, "people", postId, "comments"));

  const set = new Set();

  snap.forEach(d => {
    const uid = d.data().uid;
    if (uid) set.add(uid);
  });

  return [...set];
}