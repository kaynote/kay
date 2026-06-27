import people from "./people.js";

import {
  login,
  addComment,
  watchAuth,
  watchComments,
  watchNotifications,
  getParticipants,
  addNotifications,
  markNotificationRead
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

window.addEventListener("load", () => {

  /* AUTH */
  watchAuth((user) => {
    currentUser = user;

    const userInfo = document.getElementById("userInfo");
    if (userInfo) {
      userInfo.textContent = user ? user.email : "로그인 안 됨";
    }

    if (!user) return;

    watchNotifications(user.uid, renderNotifications);
  });

  /* LOGIN */
  const loginBtn = document.getElementById("loginBtn");

  if (loginBtn) {
    loginBtn.onclick = async () => {
      currentUser = await login();
    };
  }

  /* COMMENTS */
  watchComments(postId, (data, changes) => {

    const box = document.getElementById("peopleContainer");
    if (!box) return;

    const tree = buildTree(data);

    box.innerHTML = "";
    tree.forEach(c => box.appendChild(renderComment(c)));

    if (!firstSnapshot && changes) {
      detectNotifications(changes);
    }

    firstSnapshot = false;
  });

});

/* =========================
TREE
========================= */

function buildTree(list) {
  const map = {};
  const roots = [];

  list.forEach(c => map[c.id] = { ...c, replies: [] });

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
COMMENT RENDER
========================= */

function renderComment(c) {

  const div = document.createElement("div");
  div.className = "comment";
  div.setAttribute("data-id", c.id);

  div.innerHTML = `
    <b>${c.name}</b>
    <p>${c.text}</p>
    <button class="reply-btn">답글</button>
    <div class="child"></div>
  `;

  div.querySelector(".reply-btn").onclick = () =>
    openReplyForm(c, div);

  const child = div.querySelector(".child");

  (c.replies || []).forEach(r => {
    child.appendChild(renderComment(r));
  });

  return div;
}

/* =========================
COMMENT SEND
========================= */

async function sendComment(text) {

  if (!currentUser || !text) return;

  const comment = await addComment(postId, text, currentUser);

  const participants = await getParticipants(postId);

  const targets = participants.filter(uid =>
    uid !== currentUser.uid
  );

  await addNotifications(
    targets,
    currentUser.uid,
    currentUser.name,
    comment.id,
    "comment"
  );
}

/* =========================
REPLY
========================= */

function openReplyForm(c, el) {

  document.querySelectorAll(".reply-form")
    .forEach(e => e.remove());

  const form = document.createElement("div");
  form.className = "reply-form";

  form.innerHTML = `
    <textarea></textarea>
    <button class="send">전송</button>
    <button class="cancel">취소</button>
  `;

  el.querySelector(".child").prepend(form);

  form.querySelector(".send").onclick = async () => {

    const text = form.querySelector("textarea").value.trim();
    if (!text) return;

    const comment = await addComment(
      postId,
      text,
      currentUser,
      c.id
    );

    const parentUid = c.uid;

    if (parentUid && parentUid !== currentUser.uid) {
      await addNotifications(
        [parentUid],
        currentUser.uid,
        currentUser.name,
        comment.id,
        "reply"
      );
    }

    form.remove();
  };

  form.querySelector(".cancel").onclick = () => form.remove();
}

/* =========================
NOTIFICATIONS
========================= */

function detectNotifications(changes) {

  changes.forEach(c => {

    if (c.type !== "added") return;

    const data = c.doc.data();

    if (data.uid === currentUser.uid) return;

    showPopup(data.parentId ? "새 답글" : "새 댓글");
  });
}

function showPopup(msg) {

  const el = document.getElementById("notify");
  if (!el) return;

  el.style.display = "block";
  el.textContent = `🔔 ${msg}`;

  setTimeout(() => {
    el.style.display = "none";
  }, 3000);
}

/* =========================
NOTIFICATION UI
========================= */

function renderNotifications(list) {

  const box = document.getElementById("notificationList");
  if (!box) return;

  box.innerHTML = "";

  list
    .filter(n => n.targetUid === currentUser.uid && !n.read)
    .forEach(n => {

      const div = document.createElement("div");
      div.textContent = `🔔 ${n.senderName}`;

      div.onclick = async () => {
        await markNotificationRead(n.id);
      };

      box.appendChild(div);
    });
}

/* export */
window.sendComment = sendComment;