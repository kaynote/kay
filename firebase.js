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
appId: "1:276470297982:web:838b8a57269b26cd3d6f2f",
measurementId: "G-E61XXMZCHM"
};

/* =========================
INIT (중요: 순서)
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
    uid: user.uid,
    email: user.email || "",
    name:
      user.displayName ||
      user.providerData?.[0]?.displayName ||
      user.email ||
      "익명",
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
POST OWNER UID (핵심)
========================= */

export async function getPostOwnerUid(personNo) {
  const ref = doc(db, "people", String(personNo));
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return snap.data().ownerUid || null;
}

/* =========================
COMMENTS
========================= */

export async function addComment(postId, text, user, parentId = null) {
  return await addDoc(
    collection(db, "comments", postId, "items"),
    {
      text,
      parentId: parentId || null,
      uid: user.uid,
      name: user.name,
      photo: user.photo,
      createdAt: serverTimestamp()
    }
  );
}

export async function getComments(postId) {
  const snap = await getDocs(
    collection(db, "comments", postId, "items")
  );

  const arr = [];

  snap.forEach(d => {
    arr.push({ id: d.id, ...d.data() });
  });

  arr.sort((a, b) => {
    const ta = a.createdAt?.seconds ?? 0;
    const tb = b.createdAt?.seconds ?? 0;
    return ta - tb;
  });

  return arr;
}

export async function getCommentById(postId, commentId) {
  const snap = await getDoc(
    doc(db, "comments", postId, "items", commentId)
  );

  if (!snap.exists()) return null;

  return { id: snap.id, ...snap.data() };
}

export function watchComments(postId, callback) {
  return onSnapshot(
    collection(db, "comments", postId, "items"),
    (snapshot) => {
      const comments = [];

      snapshot.forEach(d => {
        comments.push({ id: d.id, ...d.data() });
      });

      comments.sort((a, b) => {
        const ta = a.createdAt?.seconds ?? 0;
        const tb = b.createdAt?.seconds ?? 0;
        return ta - tb;
      });

      callback(comments, snapshot.docChanges());
    }
  );
}

/* =========================
NOTIFICATIONS (핵심 안정화)
========================= */

export async function addNotification(
  targetUid,
  senderUid,
  senderName,
  commentId,
  type
) {
  if (!targetUid || targetUid === senderUid) return;

  return await addDoc(collection(db, "notifications"), {
    targetUid,
    senderUid,
    senderName,
    commentId,
    type, // comment | reply
    read: false,
    createdAt: serverTimestamp()
  });
}

export function watchNotifications(uid, callback) {
  return onSnapshot(
    query(
      collection(db, "notifications"),
      where("targetUid", "==", uid)
    ),
    (snapshot) => {

      const arr = [];

      snapshot.forEach(doc => {
        arr.push({ id: doc.id, ...doc.data() });
      });

      callback(arr);
    }
  );
}

export async function markNotificationRead(id) {
  await updateDoc(doc(db, "notifications", id), {
    read: true
  });
}

/* =========================
UPDATE / DELETE COMMENTS
========================= */

export async function updateComment(postId, commentId, text) {
  return await updateDoc(
    doc(db, "comments", postId, "items", commentId),
    { text }
  );
}

export async function deleteComment(postId, commentId) {
  return await deleteDoc(
    doc(db, "comments", postId, "items", commentId)
  );
}