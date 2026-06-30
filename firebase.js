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
  setDoc,
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
  apiKey: "AIzaSyCAZzJdAB_a65dkJaL-XLQqzImzlSI6Gmw",
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
USER NORMALIZE
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
  const user = result.user;

  await setDoc(
    doc(db, "users", user.uid),
    {
      uid: user.uid,
      name: user.displayName || "",
      email: user.email || "",
      photo: user.photoURL || "",
      notifyAdminComment: true,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  return normalizeUser(user);
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
COMMENTS
========================= */

export async function addComment(postId, text, user, parentId = null) {
  return addDoc(collection(db, "people", postId, "comments"), {
    text,
    parentId,
    uid: user.uid,
    name: user.name,
    photo: user.photo,
    createdAt: serverTimestamp()
  });
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
WATCH COMMENTS (FIXED SORT)
========================= */

export function watchComments(postId, callback) {
  return onSnapshot(
    collection(db, "people", postId, "comments"),
    (snapshot) => {
      const comments = [];

      snapshot.forEach((docItem) => {
        comments.push({
          id: docItem.id,
          ...docItem.data()
        });
      });

      comments.sort((a, b) => {
        const aTime = a.createdAt?.seconds ?? 0;
        const bTime = b.createdAt?.seconds ?? 0;
        return aTime - bTime;
      });

      callback(comments);
    }
  );
}

/* =========================
NOTIFICATIONS (OPTIMIZED)
========================= */

export async function addNotification(
  targetUid,
  senderUid,
  senderName,
  commentId,
  type
) {
  if (!targetUid || targetUid === senderUid) return;

  // 🔥 단순 + 안정 중복 체크 (핵심)
  const q = query(
    collection(db, "notifications"),
    where("targetUid", "==", targetUid),
    where("commentId", "==", commentId),
    where("senderUid", "==", senderUid),
    where("type", "==", type)
  );

  const snap = await getDocs(q);

  if (!snap.empty) return;

  return addDoc(collection(db, "notifications"), {
    targetUid,
    senderUid,
    senderName,
    commentId,
    type,
    read: false,
    createdAt: serverTimestamp()
  });
}

/* =========================
BATCH NOTIFICATIONS
========================= */

export async function addNotifications(
  targetUids,
  senderUid,
  senderName,
  commentId,
  type
) {
  const jobs = targetUids
    .filter(uid => uid && uid !== senderUid)
    .map(uid =>
      addNotification(uid, senderUid, senderName, commentId, type)
    );

  await Promise.all(jobs);
}

/* =========================
WATCH NOTIFICATIONS
========================= */

export function watchNotifications(uid, callback) {
  return onSnapshot(
    query(
      collection(db, "notifications"),
      where("targetUid", "==", uid)
    ),
    (snap) => {
      const arr = [];

      snap.forEach((docItem) => {
        arr.push({
          id: docItem.id,
          ...docItem.data()
        });
      });

      arr.sort((a, b) => {
        const aTime = a.createdAt?.seconds ?? 0;
        const bTime = b.createdAt?.seconds ?? 0;
        return bTime - aTime;
      });

      callback(arr);
    }
  );
}

/* =========================
READ NOTIFICATION
========================= */

export async function markNotificationRead(id) {
  return updateDoc(doc(db, "notifications", id), {
    read: true
  });
}

/* =========================
UTILS
========================= */

export async function getParticipants(postId) {
  const snap = await getDocs(
    collection(db, "people", postId, "comments")
  );

  const set = new Set();

  snap.forEach((docItem) => {
    const uid = docItem.data()?.uid;
    if (uid) set.add(uid);
  });

  return [...set];
}

export async function getCommentById(postId, commentId) {
  const snap = await getDoc(
    doc(db, "people", postId, "comments", commentId)
  );

  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...snap.data()
  };
}

/* =========================
ADMIN UTILITY
========================= */

export async function deleteAllNotifications(uid) {
  const q = query(
    collection(db, "notifications"),
    where("targetUid", "==", uid)
  );

  const snap = await getDocs(q);

  await Promise.all(
    snap.docs.map(d => deleteDoc(d.ref))
  );
}