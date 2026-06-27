import people from "./people.js";
import {
  login,
  logout,
  watchAuth,
  addComment,
  watchComments,
  watchNotifications,
  getParticipants,
  addNotifications,
  markNotificationRead
} from "./firebase.js";

/* =========================
STATE
========================= */

const postId = String(people[people.length - 1].no);

let currentUser = null;

/* =========================
INIT
========================= */

window.addEventListener("load", () => {

  /* AUTH */
  watchAuth(user => {
    currentUser = user;

    const ui = document.getElementById("userInfo");
    if (ui) ui.textContent = user ? user.email : "로그인 안 됨";

    if (user) {
      watchNotifications(user.uid, renderNotifications);
    }
  });

  /* LOGIN/LOGOUT */
  document.getElementById("loginBtn")?.addEventListener("click", login);
  document.getElementById("logoutBtn")?.addEventListener("click", logout);

  /* COMMENTS */
  watchComments(postId, (data, changes) => {
    const box = document.getElementById("peopleContainer");
    if (!box) return;

    const tree = buildTree(data);

    box.innerHTML = "";
    tree.forEach(c => box.appendChild(renderComment(c)));
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
RENDER
========================= */

function renderComment(c) {
  const div = document.createElement("div");
  div.className = "comment";
  div.dataset.id = c.id;

  div.innerHTML = `
    <b>${c.name}</b>
    <p>${c.text}</p>
    <button class="reply">답글</button>
    <div class="child"></div>
  `;

  div.querySelector(".reply").onclick = () => openReply(c, div);

  const child = div.querySelector(".child");
  (c.replies || []).forEach(r => child.appendChild(renderComment(r)));

  return div;
}

/* =========================
COMMENT
========================= */

async function send(text) {
  if (!currentUser || !text) return;

  const comment = await addComment(postId, text, currentUser);

  const targets = (await getParticipants(postId))
    .filter(uid => uid !== currentUser.uid);

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

function openReply(c, el) {
  document.querySelectorAll(".reply-form").forEach(e => e.remove());

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

    const comment = await addComment(postId, text, currentUser, c.id);

    const targets = c.uid && c.uid !== currentUser.uid
      ? [c.uid]
      : [];

    if (targets.length) {
      await addNotifications(
        targets,
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

function renderNotifications(list) {
  const box = document.getElementById("notificationList");
  if (!box) return;

  box.innerHTML = "";

  list
    .filter(n => n.targetUid === currentUser.uid && !n.read)
    .forEach(n => {

      const div = document.createElement("div");
      div.textContent = `${n.senderName} 알림`;

      div.onclick = async () => {
        await markNotificationRead(n.id);
      };

      box.appendChild(div);
    });
}

/* export */
window.sendComment = send;