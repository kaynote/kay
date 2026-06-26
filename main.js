import people from "./people.js";

import {
login,
addComment,
deleteComment,
updateComment,
watchComments,
watchNotifications,
markNotificationRead,
getParticipants,
addNotifications
} from "./firebase.js";

/* =========================
현재 게시물
========================= */

const currentPost = people[people.length - 1];
const postId = String(currentPost.no);

/* =========================
상태
========================= */

let currentUser = null;

let firstSnapshot = true;

/* =========================
초기 로딩
========================= */

window.addEventListener(
"load",
async () => {

```
document.getElementById(
  "person"
).innerHTML =
  currentPost.displayName;

currentUser =
  await login();

document.getElementById(
  "sendBtn"
).onclick =
  sendComment;
  
  const list = document.getElementById("list");

  people.forEach(p => {
    const div = document.createElement("div");
    div.className = "person-card";
    div.dataset.no = p.no;

    div.innerHTML = `
      <img src="${p.image}">
      <p>${p.name}</p>
    `;

    div.onclick = () => {
      openModal(p.no);
    };

    list.appendChild(div);
  });

/* # 댓글 실시간 감시 */

watchComments(
  postId,
  (data, changes) => {

    const roots =
      buildTree(data);

    const box =
      document.getElementById(
        "comments"
      );

    box.innerHTML = "";

    roots.forEach(c => {
      box.appendChild(
        renderComment(c)
      );
    });

    if (!firstSnapshot) {
      detectNotifications(
        changes
      );
    }

    firstSnapshot = false;
  }
);

/* # 내 알림 감시 */

watchNotifications(
  currentUser.uid,
  renderNotifications
);
```

}
);

/* =========================
실시간 팝업 알림
========================= */

function detectNotifications(
changes
) {

changes.forEach(change => {

```
if (
  change.type !== "added"
) return;

const data =
  change.doc.data();

if (
  data.uid ===
  currentUser.uid
) {
  return;
}

showPopup(
  data.parentId
    ? "새 답글"
    : "새 댓글"
);
```

});
}

function showPopup(msg) {

const notify =
document.getElementById(
"notify"
);

if (!notify) return;

notify.style.display =
"block";

notify.textContent =
`🔔 ${msg}`;

clearTimeout(
notify.timer
);

notify.timer =
setTimeout(() => {

```
  notify.style.display =
    "none";

}, 5000);
```

}

/* =========================
알림 목록
========================= */

function renderNotifications(list) {

  const badge = document.getElementById("badge");

  const unread = list.filter(n => !n.read).length;
  badge.textContent = unread;

  const box = document.getElementById("notificationList");

  if (!box) return;

  box.innerHTML = "";

  list.forEach(n => {
    const div = document.createElement("div");
    div.className = "notification-item";

    div.innerHTML = `
      <b>${n.senderName}</b>
      ${
        n.type === "reply"
          ? "님이 답글을 남겼습니다"
          : "님이 댓글을 남겼습니다"
      }
    `;

div.onclick =
  async () => {

    await deleteDoc(doc(db, "notifications", n.id));

    jumpToComment(
      n.commentId
    );
  };

box.appendChild(div);
```

});
}

/* =========================
댓글 위치 이동
========================= */

function jumpToComment(
commentId
) {

const target =
document.querySelector(
`[data-id="${commentId}"]`
);

if (!target) return;

target.scrollIntoView({

```
behavior: "smooth",

block: "center"
```

});

target.classList.add(
"highlight"
);

setTimeout(() => {

```
target.classList.remove(
  "highlight"
);
```

}, 3000);
}

/* =========================
트리 생성
========================= */

function buildTree(list) {

const map = {};
const roots = [];

list.forEach(c => {

```
map[c.id] = {

  ...c,

  replies: []
};
```

});

list.forEach(c => {

```
if (c.parentId) {

  map[c.parentId]
    ?.replies
    .push(
      map[c.id]
    );

} else {

  roots.push(
    map[c.id]
  );
}
```

});

return roots;
}

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

  div.querySelector(".edit-btn").onclick = () => {
    openEditForm(c.id, div, c.text);
  };

  const replyBox = div.querySelector(".child");

  c.replies.forEach(r => {
    replyBox.appendChild(renderComment(r));
  });

  return div;
}

function openModal(personNo) {
  const modal = document.getElementById("modal");
  const box = document.getElementById("modalContent");

  modal.style.display = "block";
  box.innerHTML = "로딩중...";

  watchComments(String(postId), (data) => {
    const tree = buildTree(data);
    box.innerHTML = "";

    tree.forEach(c => {
      box.appendChild(renderComment(c));
    });
  });
}

document.getElementById("modal").onclick = (e) => {
  if (e.target.id === "modal") {
    e.target.style.display = "none";
  }
};


/* =========================
댓글 작성 (COMMENT)
========================= */

async function sendComment() {
  const input = document.getElementById("commentInput");
  const text = input.value.trim();
  if (!text) return;

  // 1️⃣ 댓글 저장
  const comment = await addComment(postId, text, currentUser);

  // 댓글 참여자 + 관리자에게 알림
  const participants = await getParticipants(postId) || [];

  // 👇 디버깅용
  console.log("participants:", participants);

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
답글 작성 (REPLY)
========================= */

function openReplyForm(commentId, commentElement) {

  // 기존 폼 제거
  document.querySelectorAll(".reply-form")
    .forEach(el => el.remove());

  const childArea = commentElement.querySelector(".child");
  if (!childArea) return;

  const form = document.createElement("div");
  form.className = "reply-form";

  form.innerHTML = `
    <textarea placeholder="답글 입력"></textarea>
    <button class="send">전송</button>
    <button class="cancel">취소</button>
  `;

  childArea.appendChild(form);

  // 🔥 핵심: 확실하게 보이게
  requestAnimationFrame(() => {
    form.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

    form.querySelector("textarea")?.focus();
  });

  const textarea = form.querySelector("textarea");

  // 전송
  form.querySelector(".send").onclick = async () => {
    const text = textarea.value.trim();
    if (!text) return;

    const comment = await addComment(
      postId,
      text,
      currentUser,
      commentId
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

  // 취소
  form.querySelector(".cancel").onclick = () => {
    form.remove();
  };
}

  // ❌ 취소
  form.querySelector(".cancel").onclick = () => {
    form.remove();
  };
}

/* =========================
삭제
========================= */

async function removeComment(id) {
  await deleteComment(postId, id);
}

/* =========================
수정
========================= */

function openEditForm(commentId, commentElement, oldText) {

  const old = commentElement.querySelector(".inline-edit");
  if (old) old.remove();

  const form = document.createElement("div");
  form.className = "inline-edit";

  form.innerHTML = `
    <textarea>${oldText}</textarea>
    <div style="display:flex; gap:6px; margin-top:6px;">
      <button class="save">저장</button>
      <button class="cancel">취소</button>
    </div>
  `;

  commentElement.appendChild(form);

  const textarea = form.querySelector("textarea");
  textarea.focus();

  form.querySelector(".save").onclick = async () => {
    const newText = textarea.value.trim();
    if (!newText) return;

    await updateComment(
      postId,
      commentId,
      newText
    );

    form.remove();
  };

  form.querySelector(".cancel").onclick = () => {
    form.remove();
  };
}

/* =========================
window export
========================= */

window.remove = removeComment;
window.edit = editComment;
window.openReplyForm = openReplyForm;
window.sendComment = sendComment;