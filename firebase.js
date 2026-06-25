import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
getFirestore,
collection,
addDoc,
getDocs,
doc,
getDoc,                 // # 추가
updateDoc,
deleteDoc,
serverTimestamp,
onSnapshot,
query,                  // # 추가
where                   // # 추가
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
LOGIN
========================= */

export async function login() {

if (auth.currentUser) {
return normalizeUser(auth.currentUser);
}

const result = await signInWithPopup(auth, provider);

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

    createdAt: serverTimestamp()
  }
);
}

export async function getComments(postId) {

const snap = await getDocs(
collection(db, "comments", postId, "items")
);

const arr = [];

snap.forEach(docItem => {


arr.push({
  id: docItem.id,
  ...docItem.data()
});


});

arr.sort((a, b) => {


const ta =
  a.createdAt?.seconds || 0;

const tb =
  b.createdAt?.seconds || 0;

return ta - tb;


});

return arr;
}

/* =========================

# 특정 댓글 1개 조회

========================= */

export async function getCommentById(
postId,
commentId
) {

const snap = await getDoc(
doc(
db,
"comments",
postId,
"items",
commentId
)
);

if (!snap.exists()) {
return null;
}

return {
id: snap.id,
...snap.data()
};
}

/* =========================
REALTIME COMMENTS
========================= */

export function watchComments(
postId,
callback
) {

return onSnapshot(
collection(
db,
"comments",
postId,
"items"
),


(snapshot) => {

  const comments = [];

  snapshot.forEach(docItem => {

    comments.push({
      id: docItem.id,
      ...docItem.data()
    });

  });

  comments.sort((a, b) => {

    const ta =
      a.createdAt?.seconds || 0;

    const tb =
      b.createdAt?.seconds || 0;

    return ta - tb;

  });

  callback(
    comments,
    snapshot.docChanges()
  );
}


);
}

/* =========================

# 알림 생성

========================= */

export async function addNotification(
targetUid,
senderUid,
senderName,
commentId,
type
) {

if (
!targetUid ||
targetUid === senderUid
) {
return;
}

await addDoc(
collection(
db,
"notifications"
),
{
targetUid,
senderUid,


  senderName,

  commentId,

  type, // comment | reply

  read: false,

  createdAt:
    serverTimestamp()
}


);
}

/* =========================

# 내 알림 실시간 감시

========================= */

export function watchNotifications(
uid,
callback
) {

return onSnapshot(


query(
  collection(
    db,
    "notifications"
  ),

  where(
    "targetUid",
    "==",
    uid
  )
),

(snapshot) => {

  const arr = [];

  snapshot.forEach(docItem => {

    arr.push({
      id: docItem.id,
      ...docItem.data()
    });

  });

  arr.sort((a, b) => {

    const ta =
      a.createdAt?.seconds || 0;

    const tb =
      b.createdAt?.seconds || 0;

    return tb - ta;
  });

  callback(arr);
}


);
}

/* =========================

# 읽음 처리

========================= */

export async function markNotificationRead(
notificationId
) {

await updateDoc(


doc(
  db,
  "notifications",
  notificationId
),

{
  read: true
}


);
}

/* =========================
UPDATE
========================= */

export async function updateComment(
postId,
commentId,
text
) {

await updateDoc(


doc(
  db,
  "comments",
  postId,
  "items",
  commentId
),

{
  text
}


);
}

/* =========================
DELETE
========================= */

export async function deleteComment(
postId,
commentId
) {

await deleteDoc(


doc(
  db,
  "comments",
  postId,
  "items",
  commentId
)


);
}