import people from "./people.js";
import {
  login,
  addComment,
  getComments,
  deleteComment,
  updateComment
} from "./firebase.js";

/* 현재 게시물 */
const currentPost = people[people.length - 1];
const postId = String(currentPost.no);

/* 상태 */
let currentUser = null;

/* 초기 로딩 */
window.addEventListener("load", async () => {
  document.getElementById("person").innerHTML = currentPost.displayName;

  currentUser = await login();
  loadComments();

  document.getElementById("sendBtn").onclick = sendComment;
});

/* 댓글 로딩 */
async function loadComments() {
  const data = await getComments(postId);

  const roots = buildTree(data);

  const box = document.getElementById("comments");
  box.innerHTML = "";

  roots.forEach(c => box.appendChild(render(c)));
}

/* 트리 구조 */
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

/* 댓글 렌더링 */
function render(c) {
  const div = document.createElement("div");

  div.style.marginLeft = c.parentId ? "20px" : "0px";
  div.setAttribute("data-id", c.id);

  div.innerHTML = `
    <b>${c.name}</b>
    <p>${c.text}</p>

    <button class="reply-btn">답글</button>
    <button class="edit-btn">수정</button>
    <button class="delete-btn">삭제</button>

    <div class="child"></div>
  `;

  /* 이벤트 */
  div.querySelector(".reply-btn").onclick = () => openReplyForm(c.id, div);
  div.querySelector(".edit-btn").onclick = () => editComment(c.id);
  div.querySelector(".delete-btn").onclick = () => removeComment(c.id);

  /* 자식 댓글 */
  const child = div.querySelector(".child");
  c.replies.forEach(r => child.appendChild(render(r)));

  return div;
}

/* =========================
   댓글 작성
========================= */
async function sendComment() {
  const input = document.getElementById("commentInput");
  const text = input.value.trim();
  if (!text) return;

  await addComment(postId, text, currentUser);

  input.value = "";
  loadComments();
}

/* =========================
   🔥 답글 (핵심)
========================= */
function openReplyForm(commentId, commentElement) {
  /* 기존 reply form 제거 (하나만 유지) */
  document.querySelectorAll(".reply-form").forEach(el => el.remove());

  const childArea = commentElement.querySelector(".child");

  const form = document.createElement("div");
  form.className = "reply-form";

  form.innerHTML = `
    <textarea placeholder="답글을 입력하세요"></textarea>
    <button class="send">전송</button>
    <button class="cancel">취소</button>
  `;

  childArea.prepend(form);

  const textarea = form.querySelector("textarea");
  textarea.focus();

  /* 전송 */
  form.querySelector(".send").onclick = async () => {
    const text = textarea.value.trim();
    if (!text) return;

    await addComment(postId, text, currentUser, commentId);
    loadComments();
  };

  /* 취소 */
  form.querySelector(".cancel").onclick = () => {
    form.remove();
  };

  /* Enter 전송 */
  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.querySelector(".send").click();
    }
  });
}

/* =========================
   삭제
========================= */
async function removeComment(id) {
  await deleteComment(postId, id);
  loadComments();
}

/* =========================
   수정
========================= */
async function editComment(id) {
  const text = prompt("수정 내용");
  if (!text) return;

  await updateComment(postId, id, text);
  loadComments();
}

/* 전역 노출 (HTML 버튼용) */
window.remove = removeComment;
window.edit = editComment;