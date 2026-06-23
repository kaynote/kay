import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import { db } from "./firebase.js";

/* =========================
   COMMENTS
========================= */

export const addComment = (postId, text, user, parentId = null) => {
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
};

export const getComments = async (postId) => {
  const snap = await getDocs(
    collection(db, "people", postId, "comments")
  );

  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

/* =========================
   NOTIFICATIONS
========================= */

export const addNotification = (postId, data) => {
  return addDoc(
    collection(db, "people", postId, "notifications"),
    {
      ...data,
      read: false,
      createdAt: serverTimestamp()
    }
  );
};

export const getNotifications = async (postId, uid) => {
  const q = query(
    collection(db, "people", postId, "notifications"),
    where("recipientUid", "==", uid)
  );

  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

/* =========================
   ADMIN
========================= */

export const addAdminNotification = (postId, sender, type) => {
  return addDoc(
    collection(db, "people", postId, "adminNotifications"),
    {
      sender,
      type,
      read: false,
      createdAt: serverTimestamp()
    }
  );
};

export const markAdminNotificationRead = (postId, id) => {
  return updateDoc(
    doc(db, "people", postId, "adminNotifications", id),
    { read: true }
  );
};