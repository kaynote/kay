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

export async function deleteAllNotifications(uid) {
  const snap = await getDocs(collection(db, "notifications"));

  const deletes = [];

  snap.forEach((d) => {
    const data = d.data();

    if (data.targetUid === uid) {
      deletes.push(deleteDoc(doc(db, "notifications", d.id)));
    }
  });

  await Promise.all(deletes);
}

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
USER
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
COMMENTS
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

/* realtime comments */

export function watchComments(postId, callback) {
  return onSnapshot(
    collection(db, "people", postId, "comments"),
    (snapshot) => {

      const comments = [];

      snapshot.forEach(docItem => {
        comments.push({
          id: docItem.id,
          ...docItem.data()
        });
      });

      comments.sort(
        (a, b) =>
          (a.createdAt?.seconds || 0) -
          (b.createdAt?.seconds || 0)
      );

      callback(comments);
    }
  );
}

/* =========================
NOTIFICATIONS (FIXED CORE)
========================= */

export async function addNotification(
  targetUid,
  senderUid,
  senderName,
  personId,
  commentId,
  type,
  read = false
) {
  if (!targetUid || targetUid === senderUid) return;

  /* 🔥 중복 방지 핵심 */
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
    personId,
    commentId,
    type,
    read: false,
    createdAt: serverTimestamp()
  });
}

/* =========================
PARTICIPANTS (SIMPLIFIED)
========================= */

export async function getParticipants(postId) {
  const snap = await getDocs(
    collection(db, "people", postId, "comments")
  );

  const users = new Set();

  snap.forEach(docItem => {
    const data = docItem.data();
    if (data.uid) users.add(data.uid);
  });

  return [...users];
}

/* batch notifications */
export async function addNotifications(
  targetUids,
  senderUid,
  senderName,
  commentId,
  type
) {
  const jobs = [];

  targetUids.forEach(uid => {
    if (!uid) return;
    if (uid === senderUid) return;

    jobs.push(
      addNotification(
        uid,
        senderUid,
        senderName,
        commentId,
        type
      )
    );
  });

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

      snap.forEach(docItem => {
        arr.push({
          id: docItem.id,
          ...docItem.data()
        });
      });

      arr.sort((a, b) =>
        (b.createdAt?.seconds || 0) -
        (a.createdAt?.seconds || 0)
      );

      callback(arr);
    }
  );
}

/* =========================
READ NOTIFICATION
========================= */

export async function markNotificationRead(id) {
  await updateDoc(doc(db, "notifications", id), {
    read: true
  });
}

/* =========================
UTIL
========================= */

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