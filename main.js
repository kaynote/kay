import people from "./people.js";

import {
  login,
  addComment,
  deleteComment,
  updateComment,
  watchComments,
  watchNotifications,
  getParticipants,
  addNotifications
} from "./firebase.js";

/* =========================
STATE
========================= */

const currentPost = people[people.length - 1];
const postId = String(currentPost.no);

let currentUser = null;
let firstSnapshot = true;

/* =========================
INIT
========================= */

window.addEventListener("load", async () => {

  currentUser = await login();

  document.getElementById("sendBtn").onclick = sendComment;

  watchComments(postId, (data, changes) => {

    const tree = buildTree(data);
    const box = document.getElementById("comments");

    box.innerHTML = "";

    tree.forEach(c => {
      box.appendChild(renderComment(c));
    });

    if (!firstSnapshot && changes) {
      detectNotifications(changes);
    }

    firstSnapshot = false;
  });

  watchNotifications(currentUser.uid, renderNotifications);
});

/* =========================
COMMENT TREE
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
  div.setAttribute("data-id", c.id);

  div.innerHTML = `
    <b>${c.name}</b>
    <p>${c.text}</p>

    <button class="reply-btn">답글</button>
    <button class="edit-btn">수정</button>

    <div class="child"></div>
  `;

  div.querySelector(".reply-btn").onclick = () => openReplyForm(c, div);
  div.querySelector(".edit-btn").onclick = () => openEditForm(c, div);

  const child = div.querySelector(".child");

  c.replies.forEach(r => {
    child.appendChild(renderComment(r));
  });

  return div;
}

/* =========================
COMMENT SEND
========================= */

async function sendComment() {
  const input = document.getElementById("commentInput");
  const text = input.value.trim();
  if (!text) return;

  const comment = await addComment(postId, text, currentUser);

  const participants = await getParticipants(postId) || [];

  await addNotifications(
    participants,
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

  document.querySelectorAll(".reply-form").forEach(e => e.remove());

  const form = document.createElement("div");
  form.className = "reply-form";

  form.innerHTML = `
    <textarea placeholder="답글 입력"></textarea>
    <button class="send">전송</button>
    <button class="cancel">취소</button>
  `;

  commentEl.querySelector(".child").prepend(form);

  requestAnimationFrame(() => {
    form.scrollIntoView({ behavior: "smooth", block: "center" });
    form.querySelector("textarea").focus();
  });

  form.querySelector(".send").onclick = async () => {
    const text = form.querySelector("textarea").value.trim();
    if (!text) return;

    const comment = await addComment(
      postId,
      text,
      currentUser,
      c.id
    );

    const participants = await getParticipants(postId) || [];

    await addNotifications(
      participants,
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
EDIT (INLINE FIXED)
========================= */

function openEditForm(commentId, commentElement, oldText) {

  document.querySelectorAll(".edit-form")
    .forEach(el => el.remove());

  const childArea = commentElement.querySelector(".child");

  const form = document.createElement("div");
  form.className = "edit-form";

  form.innerHTML = `
    <textarea>${oldText}</textarea>
    <div style="display:flex; gap:6px; margin-top:6px;">
      <button class="save">저장</button>
      <button class="cancel">취소</button>
    </div>
  `;

  // 🔥 핵심: 답글과 동일 위치
  childArea.appendChild(form);

  requestAnimationFrame(() => {
    form.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

    form.querySelector("textarea")?.focus();
  });

  form.querySelector(".save").onclick = async () => {
    const newText = form.querySelector("textarea").value.trim();
    if (!newText) return;

    await updateComment(postId, commentId, newText);
    form.remove();
  };

  form.querySelector(".cancel").onclick = () => {
    form.remove();
  };
}

/* =========================
NOTIFICATIONS
========================= */

function detectNotifications(changes) {
  changes.forEach(change => {
    if (change.type !== "added") return;

    const data = change.doc.data();

    if (data.uid === currentUser.uid) return;

    showPopup(data.parentId ? "새 답글" : "새 댓글");
  });
}

function showPopup(msg) {
  const el = document.getElementById("notify");
  if (!el) return;

  el.style.display = "block";
  el.textContent = `🔔 ${msg}`;

  clearTimeout(el.timer);

  el.timer = setTimeout(() => {
    el.style.display = "none";
  }, 4000);
}

function renderNotifications(list) {

  const badge = document.getElementById("badge");
  const box = document.getElementById("notificationList");

  const unread = list.filter(n => !n.read).length;
  badge.textContent = unread;

  box.innerHTML = "";

  list.forEach(n => {

    const div = document.createElement("div");
    div.className = "notification-item";

    div.textContent = `🔔 ${n.senderName} 님이 답글을 남겼습니다`;

    div.onclick = async () => {

      await updateComment(doc(db, "notifications", n.id), {
        read: true
      });

      const person = people.find(p => p.name === n.personName);
      if (person) openModal(person.no);
    };

    box.appendChild(div);
  });
}

/* =========================
EXPORT
========================= */

window.sendComment = sendComment;