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

/* 현재 게시물 */
const currentPost = people[people.length - 1]; // 예: Zyra Mae
const postId = String(currentPost.no);

/* 상태 */
let currentUser = null;
let currentReplyId = null;

/* 초기 로딩 */
window.addEventListener("load", async () => {
  document.getElementById("person").innerHTML = currentPost.displayName;

  currentUser = await login();
  loadComments();

  document.getElementById("sendBtn").onclick = sendComment;
  document.getElementById("replySend").onclick = sendReply;
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

/* 렌더링 */
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

/* 댓글 작성 */
async function sendComment() {
  const text = document.getElementById("commentInput").value;
  if (!text) return;

  await addComment(postId, text, currentUser);

  await addAdminNotification(
    postId,
    currentUser.name,
    "comment"
  );

  document.getElementById("commentInput").value = "";

  loadComments();
}

/* 답글 열기 */
window.reply = (id) => {
  currentReplyId = id;
  document.getElementById("replyBox").style.display = "block";
};

/* 답글 작성 */
async function sendReply() {
  
  console.log("SEND REPLY TRIGGERED");
  
  await addAdminNotification(postId, currentUser.name, "reply");
  console.log("ADMIN NOTI CALLED");

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

  await addAdminNotification(
    postId,
    currentUser.name,
    "reply"
  );

  // 👇 여기
  if (
    parent &&
    parent.uid !== currentUser.uid
  ) {
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
};

/* 삭제 */
window.remove = async (id) => {
  await deleteComment(postId, id);
  loadComments();
};

/* 수정 */
window.edit = async (id) => {
  const text = prompt("수정 내용");
  if (!text) return;

  await updateComment(postId, id, text);
  loadComments();
};