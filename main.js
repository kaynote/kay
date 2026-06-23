import people from "./people.js";
import {
  addComment,
  getComments,
  addNotification,
  addAdminNotification
} from "./api.js";

import { login } from "./firebase.js";

/* =========================
   STATE
========================= */
const postId = String(people[people.length - 1].no);

let currentUser = null;
let currentReplyId = null;

/* =========================
   INIT
========================= */
window.addEventListener("load", async () => {
  currentUser = await login();

  loadComments();

  document.getElementById("sendBtn").onclick = sendComment;
});

/* =========================
   COMMENTS
========================= */
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