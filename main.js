import people from "./people.js";

import {
  login,
  watchAuth,
  addComment,
  watchComments,
  watchNotifications,
  getParticipants,
  addNotifications,
  markNotificationRead,
  deleteNotification
} from "./firebase.js";

/* =========================
STATE
========================= */

const postId = String(people[people.length - 1].no);

let currentUser = null;

/* =========================
INIT
========================= */

window.addEventListener("load", async () => {

  currentUser = await login();

  bindUI();
  initWatchers();
});

/* =========================
UI EVENTS
========================= */

function bindUI() {

  document.getElementById("sendBtn").onclick = sendComment;

  document.getElementById("deleteAllNotificationsBtn").onclick = async () => {
    if (!currentUser) return;

    const ok = confirm("모든 알림을 삭제할까요?");
    if (!ok) return;

    const snap = await getAllMyNotifications();
    snap.forEach(n => deleteNotification(n.id));
  };
}

/* =========================
WATCHERS
========================= */

function initWatchers() {

  watchAuth((user) => {
    if (!user) return;

    currentUser = user;

    watchNotifications(user.uid, renderNotifications);
  });

  watchComments(postId, (list, changes) => {
    renderComments(buildTree(list));
  });
}

/* =========================
COMMENT FLOW
========================= */

async function sendComment() {

  const input = document.getElementById("commentInput");
  const text = input.value.trim();
  if (!text) return;

  const comment = await addComment(postId, text, currentUser);

  const participants = await getParticipants(postId);

  await addNotifications(participants, {
    senderUid: currentUser.uid,
    senderName: currentUser.name,
    commentId: comment.id,
    type: "comment"
  });

  input.value = "";
}

/* =========================
RENDER COMMENTS (SAFE)
========================= */

function buildTree(list) {
  const map = {};
  const roots = [];

  list.forEach(c => {
    map[c.id] = { ...c, replies: [] };
  });

  list.forEach(c => {
    if (c.parentId && map[c.parentId]) {
      map[c.parentId].replies.push(map[c.id]);
    } else {
      roots.push(map[c.id]);
    }
  });

  return roots;
}

function renderComments(tree) {
  const box = document.getElementById("comments");
  box.innerHTML = "";

  tree.forEach(c => box.appendChild(renderComment(c)));
}

function renderComment(c) {

  const div = document.createElement("div");
  div.className = "comment";
  div.dataset.id = c.id;

  div.innerHTML = `
    <b>${c.name}</b>
    <p>${c.text}</p>
    <button class="reply">reply</button>
  `;

  return div;
}

/* =========================
NOTIFICATIONS UI (FIXED)
========================= */

function renderNotifications(list) {
  
  console.log("🔥 NOTIFICATIONS RAW:", list);
  console.log("🔥 CURRENT USER:", currentUser?.uid);

  const box = document.getElementById("notificationList");
  box.innerHTML = "";

  list.forEach(n => {

    const div = document.createElement("div");
    div.className = "notification-item";

    div.innerHTML = `
      🔔 ${n.senderName}님이 ${n.type === "reply" ? "답글" : "댓글"}을 남겼습니다
    `;

    const x = document.createElement("button");
    x.textContent = "✕";

    x.onclick = async (e) => {
      e.stopPropagation();
      await deleteNotification(n.id);
    };

    div.appendChild(x);

    div.onclick = async () => {
      await markNotificationRead(n.id);
      jumpToComment(n.commentId);
    };

    box.appendChild(div);
  });
}

/* =========================
UTIL
========================= */

function jumpToComment(id) {
  const el = document.querySelector(`[data-id="${id}"]`);
  if (!el) return;

  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.add("highlight");

  setTimeout(() => el.classList.remove("highlight"), 2000);
}

/* =========================
HELPER
========================= */

async function getAllMyNotifications() {
  const { collection, getDocs, query, where } =
    await import("https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js");

  const snap = await getDocs(
    query(
      collection(db, "notifications"),
      where("targetUid", "==", currentUser.uid)
    )
  );

  const arr = [];
  snap.forEach(d => arr.push({ id: d.id }));

  return arr;
}