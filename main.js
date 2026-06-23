import people from "./people.js";
import {
  login,
  addComment,
  getComments,
  deleteComment,
  updateComment,
  addNotification,
  addAdminNotification
} from "./firebase.js";

import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import { db } from "./firebase.js";

/* =========================
   CURRENT POST
========================= */
const currentPost = people[people.length - 1];
const postId = String(currentPost.no);

/* =========================
   ADMIN UI
========================= */
const badge = document.getElementById("adminBadge");
const list = document.getElementById("adminList");
const bell = document.getElementById("adminBell");

/* =========================
   ADMIN LOAD
========================= */
async function loadAdminNotifications() {
  const q = query(
    collection(db, "people", postId, "adminNotifications"),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);

  const arr = snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));

  renderAdminNotifications(arr);
}

function renderAdminNotifications(data) {
  const unread = data.filter(n => !n.read);

  badge.style.display = unread.length ? "block" : "none";
  badge.textContent = unread.length;

  list.innerHTML = data.map(n => `
    <div class="notifItem">
      <b>${n.sender}</b> - ${n.type}
    </div>
  `).join("");
}

/* 클릭 */
bell.onclick = () => {
  list.style.display = list.style.display === "block" ? "none" : "block";
};

/* 실행 */
loadAdminNotifications();
setInterval(loadAdminNotifications, 5000);

/* =========================
   AUTH + COMMENTS
========================= */
let currentUser = null;
let currentReplyId = null;

window.addEventListener("load", async () => {
  currentUser = await login();
  loadComments();

  document.getElementById("sendBtn").onclick = sendComment;
  document.getElementById("replySend").onclick = sendReply;
});

/* 댓글 */
async function loadComments() {
  const data = await getComments(postId);
  const box = document.getElementById("comments");

  box.innerHTML = data.map(c => `
    <div>
      <b>${c.name}</b>
      <p>${c.text}</p>
    </div>
  `).join("");
}

/* 작성 */
async function sendComment() {
  const text = document.getElementById("commentInput").value;
  if (!text) return;

  await addComment(postId, text, currentUser);
  await addAdminNotification(postId, currentUser.name, "comment");

  loadComments();
}