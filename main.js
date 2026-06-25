import people from "./people.js";

import {
  login,
  addComment,
  deleteComment,
  updateComment,
  watchComments,
  addNotification,
  watchNotifications,
  markNotificationRead,
  getCommentById,
  getComments
} from "./firebase.js";

const ADMIN_UID =
  "eEltgLaV6oN7MHUXTfQONc2wGAk1";

import {
  deleteDoc,
  doc
} from
"https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

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

  console.log(
    "알림 렌더링",
    list.length,
    list
  );

  const box =
    document.getElementById(
      "notificationList"
    );

  ...
}

  const box = document.getElementById("notificationList");
  const badge = document.getElementById("badge");

  const unread = list.filter(n => !n.read);
  badge.textContent = unread.length;

  box.innerHTML = "";

  unread.forEach(n => {

    const div = document.createElement("div");

    div.className = "notification-item";

    div.innerHTML = `
      <b>${n.senderName}</b>
      ${n.type === "reply"
        ? "님이 답글을 남겼습니다"
        : "님이 댓글을 남겼습니다"}
    `;

    div.onclick = async () => {

      try {

        console.log("삭제 전", n.id);

        await deleteDoc(
          doc(db, "notifications", n.id)
        );

        console.log("삭제 완료");

      } catch (e) {

        console.error(
          "알림 삭제 실패",
          e
        );

      }
    };

    box.appendChild(div);
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
    <div class="replies"></div>
  `;

  div.querySelector(".reply-btn").onclick = () => {
    openReplyForm(c.id);
  };

  const replyBox = div.querySelector(".replies");

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
렌더
========================= */

  const div = document.createElement("div");

  div.setAttribute("data-id", c.id);

  div.style.marginLeft = c.parentId ? "20px" : "0px";

  div.innerHTML = `

<b>${c.name}</b>

<p>${c.text}</p>

<button class="reply-btn">
  답글
</button>

<button class="edit-btn">
  수정
</button>

<button class="delete-btn">
  삭제
</button>

<div class="child"></div>

`;

  div.querySelector(".reply-btn").onclick =
    () => openReplyForm(c.id, div);

  div.querySelector(".edit-btn").onclick =
    () => editComment(c.id);

  div.querySelector(".delete-btn").onclick =
    () => removeComment(c.id);

  const child = div.querySelector(".child");

  c.replies.forEach(r => {
    child.appendChild(render(r));
  });

  return div;
}

/* =========================
댓글 작성 (COMMENT)
========================= */

async function sendComment() {

  const input =
    document.getElementById(
      "commentInput"
    );

  const text =
    input.value.trim();

  if (!text) return;

  // 댓글 저장
  const comment =
    await addComment(
      postId,
      text,
      currentUser
    );

  // 관리자 알림
  await addNotification(
    ADMIN_UID,
    currentUser.uid,
    currentUser.name,
    comment.id,
    "comment"
  );

  // 참여자 조회
  const comments =
    await getComments(postId);

  const participantUids =
    [...new Set(
      comments.map(c => c.uid)
    )];

  for (const uid of participantUids) {

    if (
      uid !== currentUser.uid &&
      uid !== ADMIN_UID
    ) {

      await addNotification(
        uid,
        currentUser.uid,
        currentUser.name,
        comment.id,
        "comment"
      );
    }
  }

  input.value = "";
}

/* =========================
답글 작성 (REPLY)
========================= */

function openReplyForm(commentId, commentElement) {

  document.querySelectorAll(".reply-form")
    .forEach(el => el.remove());

  const childArea = commentElement.querySelector(".child");

  const form = document.createElement("div");
  form.className = "reply-form";

  form.innerHTML = `
    <textarea placeholder="답글 입력"></textarea>
    <button class="send">전송</button>
    <button class="cancel">취소</button>
  `;

  childArea.prepend(form);

  const textarea = form.querySelector("textarea");
  textarea.focus();

  // 🔥 답글 전송
  form.querySelector(".send").onclick = async () => {

    const text = textarea.value.trim();
    if (!text) return;

    // 1️⃣ 답글 저장
    const comment = await addComment(
      postId,
      text,
      currentUser,
      commentId
    );

    // 2️⃣ 부모 댓글 가져오기
    const parent = await getCommentById(postId, commentId);
    const parentUid = parent?.uid;

    console.log("PARENT UID:", parentUid);

    // 3️⃣ reply 알림
    if (parentUid) {
      await addNotification(
        parentUid,
        currentUser.uid,
        currentUser.name,
        comment.id,
        "reply"
      );

      console.log("✅ reply notification 생성 완료");
    }
  };

  form.querySelector(".cancel").onclick = () => form.remove();
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

async function editComment(id) {
  const text = prompt("수정 내용");
  if (!text) return;

  await updateComment(postId, id, text);
}

/* =========================
window export
========================= */

window.remove = removeComment;
window.edit = editComment;
window.openReplyForm = openReplyForm;
window.sendComment = sendComment;