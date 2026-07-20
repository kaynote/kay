import people from "./people.js";

import {
  login,
  addComment,
  updateComment,
  watchAuth,
  watchComments,
  watchNotifications,
  getParticipants,
  getAllUsers,
  addNotifications,
  markNotificationRead
} from "./firebase.js";

import { deleteAllNotifications } from "./firebase.js";

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
    tree.forEach(c => box.appendChild(renderComment(c)));

    if (!firstSnapshot && changes) {
      detectNotifications(changes);
    }

    firstSnapshot = false;
  });

  // 🔥 여기 대신 이 구조 사용
  watchAuth((user) => {
    if (!user) return;

    currentUser = user;

    watchNotifications(user.uid, renderNotifications);
  });

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
  div.setAttribute("data-id", c.id);

  div.innerHTML = `
    <b>${c.name}</b>
    <p>${c.text}</p>

    <div class="actions">
      <button class="reply-btn">답글</button>
      <button class="edit-btn">수정</button>
    </div>

    <div class="reply-slot"></div>
    <div class="edit-slot"></div>
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
SEND COMMENT
========================= */

async function sendComment() {

  const input = document.getElementById("commentInput");
  const text = input.value.trim();
  if (!text) return;
  
    if (text.length > 1000) {
      alert("댓글은 최대 1000자까지 입력할 수 있습니다.");
      return;
    }

  const comment = await addComment(postId, text, currentUser);

  const ADMIN_UID = "eEltgLaV6oN7MHUXTfQONc2wGAk1";

  let targets;

  if (currentUser.uid === ADMIN_UID) {

      targets = await getAllUsers();

  } else {

      targets = await getParticipants(postId);

  }

  targets = [...new Set(targets)]
      .filter(uid => uid !== currentUser.uid);

  await addNotifications(
      targets,
      currentUser.uid,
      currentUser.name,
      postId,
      comment.id,
      "comment"
  );
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
    <textarea placeholder="답글 입력"></textarea>
    <div class="btns">
      <button class="send">전송</button>
      <button class="cancel">취소</button>
    </div>
  `;

  const child = commentEl.querySelector(".child");

  // 🔥 여기 핵심
  child.prepend(form);

  requestAnimationFrame(() => {
    form.scrollIntoView({ behavior: "smooth", block: "center" });
    form.querySelector("textarea").focus();
  });

  form.querySelector(".send").onclick = async () => {

    const text = form.querySelector("textarea").value.trim();
    
    if (text.length > 1000) {
        alert("댓글은 최대 1000자까지 입력할 수 있습니다.");
        return;
    }
    if (!text) return;

    const comment = await addComment(
      postId,
      text,
      currentUser,
      c.id
    );

    const ADMIN_UID = "eEltgLaV6oN7MHUXTfQONc2wGAk1";

    let targets;

    if (currentUser.uid === ADMIN_UID) {

        targets = await getAllUsers();

    } else {

        targets = [c.uid];

    }

    targets = [...new Set(targets)]
        .filter(uid => uid !== currentUser.uid);

    await addNotifications(
        targets,
        currentUser.uid,
        currentUser.name,
        postId,
        comment.id,
        "reply"
    );

    form.remove();
  };

  form.querySelector(".cancel").onclick = () => form.remove();
}

/* =========================
EDIT
========================= */

function openEditForm(c, commentEl, oldText) {

  document.querySelectorAll(".edit-form")
    .forEach(e => e.remove());

  const form = document.createElement("div");
  form.className = "edit-form";

  form.innerHTML = `
    <textarea>${oldText}</textarea>
    <div>
      <button class="save">저장</button>
      <button class="cancel">취소</button>
    </div>
  `;

  const zone = commentEl.querySelector(".reply-zone");
  zone.innerHTML = "";
  zone.appendChild(form);

  requestAnimationFrame(() => {
    form.scrollIntoView({ behavior: "smooth", block: "center" });
    form.querySelector("textarea").focus();
  });

  form.querySelector(".cancel").onclick = () => form.remove();
}

/* =========================
NOTIFICATIONS POPUP
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

/* =========================
NOTIFICATION LIST
========================= */

function renderNotifications(list){

  const box = document.getElementById("notificationList");
  box.innerHTML = "";

  list
    .filter(n => n.targetUid === currentUser.uid)
    .forEach(n => {

      const div = document.createElement("div");
      div.className = "notification-item";
      
      div.classList.add(n.read ? "read" : "unread");

      div.innerHTML = `
          <span class="${n.read ? "read-dot" : "unread-dot"}"></span>
          ${n.senderName} 님이 ${
            n.type === "reply" ? "답글" : "댓글"
          }을 남겼습니다
      `;

      const delBtn = document.createElement("button");
      delBtn.textContent = "✕";

      delBtn.onclick = async (e) => {
        e.stopPropagation();
        await deleteDoc(doc(db, "notifications", n.id));
      };

      div.appendChild(delBtn);

      div.onclick = async () => {
        await markNotificationRead(n.id);
        jumpToComment(n.commentId);
      };

      box.appendChild(div);
    });
}

/* =========================
SCROLL TO COMMENT
========================= */

function jumpToComment(id) {

  const target = document.querySelector(`[data-id="${id}"]`);
  if (!target) return;

  target.scrollIntoView({ behavior: "smooth", block: "center" });

  target.classList.add("highlight");

  setTimeout(() => target.classList.remove("highlight"), 2000);
}

/* =========================
EXPORT
========================= */

window.sendComment = sendComment;