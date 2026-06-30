import people from "./people.js";

import {
  login,
  addComment,
  watchAuth,
  watchComments,
  watchNotifications,
  getParticipants,
  addNotifications,
  markNotificationRead,
  deleteAllNotifications,
  db
} from "./firebase.js";

import {
  doc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

/* =========================
STATE
========================= */

const currentPost = people[people.length - 1];
const postId = String(currentPost.no);

let currentUser = null;

/* =========================
INIT
========================= */

window.addEventListener("load", async () => {

  currentUser = await login();

  document.getElementById("sendBtn").onclick = sendComment;

  /* COMMENTS */
  watchComments(postId, (comments) => {
    const tree = buildTree(comments);

    const box = document.getElementById("comments");
    box.innerHTML = "";

    tree.forEach(c => box.appendChild(renderComment(c)));
  });

  /* AUTH + NOTIFICATIONS */
  watchAuth((user) => {
    if (!user) return;

    currentUser = user;

    watchNotifications(user.uid, renderNotifications);
  });

  /* DELETE ALL NOTIFICATIONS */
  document.getElementById("deleteAllNotificationsBtn").onclick = async () => {
    if (!currentUser) return;
    if (!confirm("모든 알림을 삭제하시겠습니까?")) return;

    await deleteAllNotifications(currentUser.uid);
  };
});

/* =========================
TREE
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

/* =========================
RENDER COMMENT
========================= */

function renderComment(c) {

  const div = document.createElement("div");
  div.className = "comment";
  div.dataset.id = c.id;

  div.innerHTML = `
    <b>${c.name}</b>
    <p>${c.text}</p>

    <div class="actions">
      <button class="reply-btn">답글</button>
      <button class="edit-btn">수정</button>
    </div>

    <div class="child"></div>
  `;

  div.querySelector(".reply-btn").onclick = () =>
    openReplyForm(c, div);

  div.querySelector(".edit-btn").onclick = () =>
    openEditForm(c, div);

  const child = div.querySelector(".child");

  c.replies.forEach(r => {
    child.appendChild(renderComment(r));
  });

  return div;
}

/* =========================
SEND COMMENT
========================= */

async function sendComment() {

  const input = document.getElementById("commentInput");
  const text = input.value.trim();
  if (!text) return;

  const comment = await addComment(postId, text, currentUser);

  const participants = await getParticipants(postId);

  const targets = [...new Set(participants)]
    .filter(uid => uid !== currentUser.uid);

  await addNotifications(
    targets,
    currentUser.uid,
    currentUser.name,
    comment.id,
    "comment"
  );

  input.value = "";
}

/* =========================
REPLY
========================= */

function openReplyForm(c, commentEl) {

  document.querySelectorAll(".reply-form")
    .forEach(e => e.remove());

  const form = document.createElement("div");
  form.className = "reply-form";

  form.innerHTML = `
    <textarea></textarea>
    <div>
      <button class="send">전송</button>
      <button class="cancel">취소</button>
    </div>
  `;

  commentEl.querySelector(".child").prepend(form);

  form.querySelector(".send").onclick = async () => {

    const text = form.querySelector("textarea").value.trim();
    if (!text) return;

    const comment = await addComment(
      postId,
      text,
      currentUser,
      c.id
    );

    const targets = [c.uid]
      .filter(uid => uid && uid !== currentUser.uid);

    await addNotifications(
      targets,
      currentUser.uid,
      currentUser.name,
      comment.id,
      "reply"
    );

    form.remove();
  };

  form.querySelector(".cancel").onclick = () => form.remove();
}

/* =========================
EDIT (FIXED BASIC)
========================= */

function openEditForm(c, commentEl) {

  document.querySelectorAll(".edit-form")
    .forEach(e => e.remove());

  const form = document.createElement("div");
  form.className = "edit-form";

  form.innerHTML = `
    <textarea>${c.text}</textarea>
    <div>
      <button class="save">저장</button>
      <button class="cancel">취소</button>
    </div>
  `;

  commentEl.appendChild(form);

  form.querySelector(".cancel").onclick = () => form.remove();
}

/* =========================
NOTIFICATIONS RENDER
========================= */

function renderNotifications(list) {

  const box = document.getElementById("notificationList");
  box.innerHTML = "";

  list
    .filter(n => n.targetUid === currentUser.uid && !n.read)
    .forEach(n => {

      const div = document.createElement("div");
      div.className = "notification-item";

      div.textContent =
        `🔔 ${n.senderName} → ${n.type === "reply" ? "답글" : "댓글"}`;

      const del = document.createElement("button");
      del.textContent = "✕";

      del.onclick = async (e) => {
        e.stopPropagation();
        await deleteDoc(doc(db, "notifications", n.id));
      };

      div.appendChild(del);

      div.onclick = async () => {
        await markNotificationRead(n.id);
        jumpToComment(n.commentId);
      };

      box.appendChild(div);
    });
}

/* =========================
SCROLL
========================= */

function jumpToComment(id) {

  const el = document.querySelector(`[data-id="${id}"]`);
  if (!el) return;

  el.scrollIntoView({ behavior: "smooth", block: "center" });

  el.classList.add("highlight");

  setTimeout(() => el.classList.remove("highlight"), 2000);
}

/* =========================
EXPORT
========================= */

window.sendComment = sendComment;