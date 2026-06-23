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

import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "./firebase.js";

/* =========================
   ADMIN NOTIFICATION UI
========================= */

const badge = document.getElementById("adminBadge");
const list = document.getElementById("adminList");
const bell = document.getElementById("adminBell");

/* 알림 불러오기 */
async function loadAdminNotifications() {
  const q = query(
    collection(db, "adminNotifications"),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);

  const arr = [];
  snap.forEach(doc => arr.push(doc.data()));

  renderAdminNotifications(arr);
}

/* 숫자 + 리스트 표시 */
function renderAdminNotifications(data) {

  const unread = data.filter(n => n.read === false);

  // 🔴 뱃지 숫자
  if (unread.length > 0) {
    badge.style.display = "block";
    badge.textContent = unread.length;
  } else {
    badge.style.display = "none";
  }

  // 리스트
  list.innerHTML = data.map(n => `
    <div class="notifItem" data-id="${n.id}" style="
      padding:5px;
      border-bottom:1px solid #eee;
      cursor:pointer;
      ${n.read ? "opacity:0.5" : "font-weight:bold;"}
    ">
      <b>${n.sender}</b> 님이<br>
      ${n.type === "comment" ? "댓글" : "답글"}을 남겼습니다
    </div>
  `).join("");
}

/* 클릭하면 목록 열기 */
bell.onclick = () => {
  list.style.display = list.style.display === "block" ? "none" : "block";
};

/* 처음 실행 */
loadAdminNotifications();

/* 새로고침 (5초마다 실시간처럼) */
setInterval(loadAdminNotifications, 5000);

/* =========================
   현재 게시물
========================= */
const currentPost = people[people.length - 1];
const postId = String(currentPost.no);

/* =========================
   상태
========================= */
let currentUser = null;
let currentReplyId = null;

/* =========================
   초기 로딩
========================= */
window.addEventListener("load", async () => {
  document.getElementById("person").innerHTML = currentPost.displayName;

  currentUser = await login();
  loadComments();

  document.getElementById("sendBtn").onclick = sendComment;
  document.getElementById("replySend").onclick = sendReply;
});

/* =========================
   댓글 로딩
========================= */
async function loadComments() {
  const data = await getComments(postId);

  const roots = buildTree(data);

  const box = document.getElementById("comments");
  box.innerHTML = "";

  roots.forEach(c => box.appendChild(render(c)));
}

/* =========================
   트리 구조
========================= */
function buildTree(list) {
  const map = {};
  const roots = [];

  list.forEach(c => map[c.id] = { ...c, replies: [] });

  list.forEach(c => {
    if (c.parentId) {
      map[c.parentId]?.replies.push(map[c.id]);
    } else {
      roots.push(map[c.id]);
    }
  });

  return roots;
}

/* =========================
   렌더링
========================= */
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
   댓글 작성
========================= */
async function sendComment() {
  const text = document.getElementById("commentInput").value;
  if (!text) return;

  await addComment(postId, text, currentUser);

  // 🔔 관리자 알림 (1회)
  await addAdminNotification(
    postId,
    currentUser.name,
    "comment"
  );

  document.getElementById("commentInput").value = "";

  loadComments();
}

/* =========================
   답글 열기
========================= */
window.reply = (id) => {
  currentReplyId = id;
  document.getElementById("replyBox").style.display = "block";
};

/* =========================
   답글 작성
========================= */
async function sendReply() {

  const text = document.getElementById("replyInput").value;
  if (!text) return;

  const comments = await getComments(postId);

  const parent = comments.find(
    c => c.id === currentReplyId
  );

  await addComment(
    postId,
    text,
    currentUser,
    currentReplyId
  );

  // 🔔 관리자 알림 (1회)
  await addAdminNotification(
    postId,
    currentUser.name,
    "reply"
  );

  // 🔔 사용자 알림
  if (parent && parent.uid !== currentUser.uid) {
    await addNotification(
      parent.uid,
      currentUser,
      postId,
      "reply"
    );
  }

  document.getElementById("replyInput").value = "";
  document.getElementById("replyBox").style.display = "none";

  loadComments();
}

/* =========================
   삭제
========================= */
window.remove = async (id) => {
  await deleteComment(postId, id);
  loadComments();
};

/* =========================
   수정
========================= */
window.edit = async (id) => {
  const text = prompt("수정 내용");
  if (!text) return;

  await updateComment(postId, id, text);
  loadComments();
};