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
   👉 핵심 추가
========================= */

function normalizeUser(user) {

  console.log("=== normalizeUser ===");
  console.log("displayName:", user?.displayName);
  console.log("email:", user?.email);
  console.log("providerData:", user?.providerData);

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

  if (auth.currentUser) {
    console.log("CURRENT:", auth.currentUser.displayName);
    return normalizeUser(auth.currentUser);
  }

const result = await signInWithPopup(auth, provider);

console.log("POPUP:", result.user.displayName);
console.log("EMAIL:", result.user.email);
console.log("PROVIDER:", result.user.providerData[0]);

return normalizeUser(result.user);
}

/* =========================
   LOGOUT
========================= */

export async function logout() {
  await signOut(auth);
}

/* =========================
   AUTH WATCHER
========================= */

export function watchAuth(callback) {

  return onAuthStateChanged(auth, (user) => {
    callback(normalizeUser(user));
  });
}

/* =========================
   COMMENTS
========================= */

export async function addComment(
  postId,
  text,
  user,
  parentId = null
) {
  return await addDoc(
    collection(db, "comments", postId, "items"),
    {
      text,
      parentId,

      uid: user.uid,
      name: user.name,
      photo: user.photo,

      adminChecked: false,

      createdAt: serverTimestamp()
    }
  );
}

export async function getComments(postId) {

  const snap = await getDocs(
    collection(db, "comments", postId, "items")
  );

  const arr = [];

  snap.forEach(doc => {
    arr.push({
      id: doc.id,
      ...doc.data()
    });
  });

  return arr;
}

export async function updateComment(
  postId,
  commentId,
  text
) {
  await updateDoc(
    doc(db, "comments", postId, "items", commentId),
    { text }
  );
}

export async function deleteComment(
  postId,
  commentId
) {
  await deleteDoc(
    doc(db, "comments", postId, "items", commentId)
  );
}

export async function addNotification(
  recipientUid,
  senderUser,
  postId,
  type
) {

  console.log("ADD USER NOTIFICATION");

  await addDoc(
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

  const arr = [];

  snap.forEach(doc => {
    arr.push({
      id: doc.id,
      ...doc.data()
    });
  });

  return arr;
}

export async function addAdminNotification(
  postId,
  sender,
  type
) {
  
  console.log("ADD ADMIN NOTIFICATION");
  
  await addDoc(
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