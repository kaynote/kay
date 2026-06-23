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
   STATE
========================= */

let currentUser = null;
let currentReplyId = null;

const currentPost = people[people.length - 1];
const postId = String(currentPost.no);

/* =========================
   DOM
========================= */

const badge = document.getElementById("adminBadge");
const list = document.getElementById("adminList");
const bell = document.getElementById("adminBell");

/* =========================
   ADMIN NOTIFICATION
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
    <div class="notifItem" data-id="${n.id}" style="
      padding:5px;
      border-bottom:1px solid #eee;
      cursor:pointer;
      ${n.read ? "opacity:0.5" : "font-weight:bold;"}
    ">
      <b>${n.sender}</b> 님이 ${n.type}
    </div>
  `).join("");
}

bell.onclick = () => {
  list.style.display = list.style.display === "block" ? "none" : "block";
};

/* =========================
   INIT
========================= */

loadAdminNotifications();
setInterval(loadAdminNotifications, 5000);

/* =========================
   START
========================= */

window.addEventListener("load", async () => {
  currentUser = await login();
  loadComments();

  document.getElementById("sendBtn").onclick = sendComment;
  document.getElementById("replySend").onclick = sendReply;
});

/* =========================
   COMMENTS
========================= */

async function loadComments() {
  const data = await getComments(postId);

  const map = {};
  const roots = [];

  data.forEach(c => map[c.id] = { ...c, replies: [] });

  data.forEach(c => {
    if (c.parentId) map[c.parentId]?.replies.push(map[c.id]);
    else roots.push(map[c.id]);
  });

  const box = document.getElementById("comments");
  box.innerHTML = "";

  roots.forEach(c => box.appendChild(render(c)));
}

function render(c) {
  const div = document.createElement("div");

  div.style.marginLeft = c.parentId ? "20px" : "0px";

  div.innerHTML = `
    <b>${c.name}</b>
    <p>${c.text}</p>

    <button onclick="reply('${c.id}')">답글</button>
    <button onclick="edit('${c.id}')">수정</button>
    <button onclick="remove('${c.id}')">삭제</button>

    <div class="child"></div>
  `;

  const child = div.querySelector(".child");
  c.replies.forEach(r => child.appendChild(render(r)));

  return div;
}

/* =========================
   SEND COMMENT
========================= */

async function sendComment() {
  const text = document.getElementById("commentInput").value;
  if (!text) return;

  await addComment(postId, text, currentUser);

  await addAdminNotification(postId, currentUser.name, "comment");

  document.getElementById("commentInput").value = "";

  loadComments();
}

/* =========================
   REPLY
========================= */

window.reply = (id) => {
  currentReplyId = id;
  document.getElementById("replyBox").style.display = "block";
};

async function sendReply() {
  const text = document.getElementById("replyInput").value;
  if (!text) return;

  const comments = await getComments(postId);
  const parent = comments.find(c => c.id === currentReplyId);

  await addComment(postId, text, currentUser, currentReplyId);

  await addAdminNotification(postId, currentUser.name, "reply");

  if (parent && parent.uid !== currentUser.uid) {
    await addNotification(parent.uid, currentUser, postId, "reply");
  }

  document.getElementById("replyInput").value = "";
  document.getElementById("replyBox").style.display = "none";

  loadComments();
}

/* =========================
   DELETE / EDIT
========================= */

window.remove = async (id) => {
  await deleteComment(postId, id);
  loadComments();
};

window.edit = async (id) => {
  const text = prompt("수정 내용");
  if (!text) return;

  await updateComment(postId, id, text);
  loadComments();
};