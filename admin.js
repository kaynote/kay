import { login, logout, watchAuth, db } from "./firebase.js";
import people from "./people.js?v=302";

import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  collection,
  writeBatch,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const ADMIN_EMAIL = "ektjttnfp5@gmail.com";

const $ = id => document.getElementById(id);

const loadingPanel = $("loadingPanel");
const loginPanel = $("loginPanel");
const deniedPanel = $("deniedPanel");
const adminPanel = $("adminPanel");

const loginBtn = $("loginBtn");
const logoutBtn = $("logoutBtn");
const deniedLogoutBtn = $("deniedLogoutBtn");
const copyAllDraftBtn = $("copyAllDraftBtn");
const initLikesCountBtn = $("initLikesCountBtn");

const loginError = $("loginError");
const adminUser = $("adminUser");
const deniedUser = $("deniedUser");
const postList = $("postList");
const postCount = $("postCount");
const statusMessage = $("statusMessage");

const editModal = $("editModal");
const editForm = $("editForm");
const editNo = $("editNo");
const editName = $("editName");
const editKo = $("editKo");
const editDisplayName = $("editDisplayName");
const editNote = $("editNote");
const editImage = $("editImage");
const closeEditModal = $("closeEditModal");
const cancelEditBtn = $("cancelEditBtn");
const saveEditBtn = $("saveEditBtn");

let currentPeople = [];
let currentDraftIds = new Set();
let editingNo = null;

function hidePanels() {
  [loadingPanel, loginPanel, deniedPanel, adminPanel]
    .forEach(x => x.classList.add("hidden"));
}

function escapeHtml(v) {
  return String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function status(msg, type = "info") {
  statusMessage.textContent = msg;
  statusMessage.className = `status ${type}`;
  statusMessage.classList.remove("hidden");
}

function getPersonNo(person, index) {
  return person.no ?? index + 1;
}

function renderPosts(list, draftIds = new Set()) {
  postList.innerHTML = "";
  postCount.textContent = `${list.length}개`;

  list.forEach((person, index) => {
    const no = getPersonNo(person, index);
    const tr = document.createElement("tr");
    const done = draftIds.has(String(no));
    const image = person.image || "no-image.jpg";
    const imageSrc = image.startsWith("http://") || image.startsWith("https://")
      ? image
      : `images/${image}`;

    tr.innerHTML = `
      <td>${escapeHtml(no)}</td>
      <td class="name-cell">${escapeHtml(person.name || "")}</td>
      <td>${escapeHtml(person.ko || "")}</td>
      <td>${escapeHtml(person.displayName || "")}</td>
      <td class="note-cell">${escapeHtml(person.note || "")}</td>
      <td class="image-cell">
        <img
          src="${escapeHtml(imageSrc)}"
          alt="${escapeHtml(person.name || "")}"
          class="admin-person-image"
          loading="lazy"
          onerror="this.onerror=null;this.src='images/no-image.jpg';"
        >
      </td>
      <td class="reaction-count view-count">불러오는 중...</td>
      <td class="reaction-count like-count">불러오는 중...</td>
      <td class="reaction-count comment-count">불러오는 중...</td>
      <td class="reaction-count reply-count">불러오는 중...</td>
      <td class="action-cell">
        <div class="admin-row-actions">
          <button class="draft-btn">
            ${done ? "수정" : "Draft 등록"}
          </button>
          <button class="preview-btn" ${done ? "" : "disabled"}>미리 보기</button>
          <button class="compare-btn" ${done ? "" : "disabled"}>변경사항 비교</button>
          <button class="publish-btn" ${done ? "" : "disabled"}>게시하기</button>
        </div>
      </td>
    `;

    const draftButton = tr.querySelector(".draft-btn");
    const previewButton = tr.querySelector(".preview-btn");
    const compareButton = tr.querySelector(".compare-btn");
    const publishButton = tr.querySelector(".publish-btn");

    if (done) {
      draftButton.addEventListener("click", () => openEditModal(person, no));

      previewButton.addEventListener("click", () => {
        window.open(`draft-preview.html?no=${encodeURIComponent(no)}`, "_blank");
      });

      compareButton.addEventListener("click", () => {
        window.open(
          `compare.html?no=${encodeURIComponent(no)}&source_no=${encodeURIComponent(no)}`,
          "_blank"
        );
      });

      publishButton.addEventListener("click", () => openPublishPage(no));
    } else {
      draftButton.addEventListener("click", () => copyToDraft(person, draftButton));
    }

    postList.appendChild(tr);

    postList.appendChild(tr);

    /*
    loadReactionCounts(
      person,
      tr.querySelector(".view-count"),
      tr.querySelector(".like-count"),
      tr.querySelector(".comment-count"),
      tr.querySelector(".reply-count")
    );
    */
  });
}

async function loadReactionCounts(
  person,
  viewEl,
  likeEl,
  commentEl,
  replyEl
) {
  const postId = String(person.name || "");

  /* =========================
     조회수
  ========================= */

  try {

    const postRef =
      doc(
        db,
        "people",
        postId
      );

    const postSnap =
      await getDoc(postRef);

    viewEl.textContent =
      postSnap.exists()
        ? (postSnap.data().views ?? 0)
        : 0;

  } catch (error) {

    console.error(
      "조회수 불러오기 실패:",
      postId,
      error
    );

    viewEl.textContent = "-";
  }


  /* =========================
     좋아요
  ========================= */

  try {

    const likesRef =
      collection(
        db,
        "people",
        postId,
        "likes"
      );

    const likesSnap =
      await getDocs(likesRef);

    likeEl.textContent =
      likesSnap.size;

  } catch (error) {

    console.error(
      "좋아요 불러오기 실패:",
      postId,
      error
    );

    likeEl.textContent = "-";
  }


  /* =========================
     댓글 / 답글
  ========================= */

  try {

    const commentsRef =
      collection(
        db,
        "people",
        postId,
        "comments"
      );

    const commentsSnap =
      await getDocs(
        commentsRef
      );

    let commentCount = 0;
    let replyCount = 0;

    commentsSnap.forEach(commentDoc => {

      const data =
        commentDoc.data();

      if (data.parentId) {

        replyCount++;

      } else {

        commentCount++;

      }

    });

    commentEl.textContent =
      commentCount;

    replyEl.textContent =
      replyCount;

  } catch (error) {

    console.error(
      "댓글/답글 불러오기 실패:",
      postId,
      error
    );

    commentEl.textContent = "-";
    replyEl.textContent = "-";
  }
}

async function loadDraftIds() {
  const snap = await getDocs(collection(db, "drafts"));
  return new Set(snap.docs.map(doc => String(doc.id)));
}

function openPublishPage(no) {
  const workflowUrl = "https://github.com/kaynote/kay/actions/workflows/publish-drafts.yml";

  try {
    navigator.clipboard?.writeText(String(no));
  } catch (e) {
    console.warn("source_no 복사 실패:", e);
  }

  window.open(workflowUrl, "_blank");

  status(
    `${no}번 게시를 위해 GitHub Actions 게시 화면을 열었습니다. Workflow의 source_no에 ${no}을 입력하세요.`,
    "info"
  );
}

async function copyToDraft(person, button) {
  button.disabled = true;
  button.textContent = "복사 중...";

  try {
    const ref = doc(db, "drafts", String(person.no));
    const existing = await getDoc(ref);

    if (existing.exists()) {
      button.textContent = "수정";
      button.disabled = false;
      status(
        `"${person.name}"은(는) 이미 Draft에 등록되어 있습니다.`,
        "info"
      );
      return;
    }

    await setDoc(ref, {
      sourceNo: person.no,
      name: person.name || "",
      ko: person.ko || "",
      displayName: person.displayName || "",
      note: person.note || "",
      image: person.image || "no-image.jpg",
      status: "draft",
      updatedAt: new Date().toISOString()
    });

    currentDraftIds.add(String(person.no));

    button.textContent = "수정";
    button.disabled = false;

    status(
      `"${person.name}"을(를) Draft로 복사했습니다.`,
      "success"
    );

  } catch (e) {
    console.error(e);

    status(
      e?.code === "permission-denied"
        ? "Firebase에서 Draft 쓰기 권한이 거부되었습니다."
        : `Draft 복사 실패: ${e.message}`,
      "error"
    );

    button.disabled = false;
    button.textContent = "Draft 등록";
  }
}

async function copyAllToDraft() {
  if (!currentPeople.length) return;

  const targets = currentPeople.filter((person, index) => {
    return !currentDraftIds.has(
      String(getPersonNo(person, index))
    );
  });

  if (!targets.length) {
    status(
      `전체 ${currentPeople.length}명이 이미 Draft에 등록되어 있습니다.`,
      "info"
    );

    copyAllDraftBtn.textContent = "전체 Draft 등록 완료";
    return;
  }

    const ok = confirm(
        `전체 ${currentPeople.length}개의 사진에 대해 기존 좋아요 수를 계산하여 likesCount를 저장합니다.\n\n` +
        `기존 likes 데이터는 삭제하지 않습니다.\n\n` +
        `처음 한 번만 실행하면 됩니다.\n\n` +
        `계속할까요?`
    );

    if (!ok) return;

    initLikesCountBtn.disabled = true;
    initLikesCountBtn.textContent = "좋아요 수 계산 중...";

    let success = 0;
    let failed = 0;

    try {

        for (let i = 0; i < currentPeople.length; i++) {

            const person = currentPeople[i];
            const postId = String(person.name || "").trim();

            if (!postId) {
                failed++;
                continue;
            }

            try {

                const likesRef = collection(
                    db,
                    "people",
                    postId,
                    "likes"
                );

                const likesSnap = await getDocs(likesRef);

                const personRef = doc(
                    db,
                    "people",
                    postId
                );

                await updateDoc(personRef, {
                    likesCount: likesSnap.size
                });

                success++;

                status(
                    `좋아요 수 초기화 중... ${i + 1} / ${currentPeople.length}  ` +
                    `(${postId}: ${likesSnap.size}개)`,
                    "info"
                );

            } catch (error) {

                failed++;

                console.error(
                    "좋아요 수 초기화 실패:",
                    postId,
                    error
                );

            }
        }

        status(
            `좋아요 수 초기화 완료: 성공 ${success}개 / 실패 ${failed}개`,
            failed === 0 ? "success" : "error"
        );

        initLikesCountBtn.textContent =
            failed === 0
                ? "좋아요 수 초기화 완료"
                : "좋아요 수 다시 초기화";

    } catch (error) {

        console.error(
            "좋아요 수 초기화 전체 실패:",
            error
        );

        status(
            `좋아요 수 초기화 실패: ${error.message}`,
            "error"
        );

        initLikesCountBtn.textContent =
            "좋아요 수 초기화";

    } finally {

        initLikesCountBtn.disabled = false;

    }
}

  const ok = confirm(
    `전체 ${currentPeople.length}명 중 ${targets.length}명을 Draft로 등록합니다.\n\n` +
    `이미 등록된 ${currentPeople.length - targets.length}명은 건너뜁니다.\n\n` +
    `계속할까요?`
  );

  if (!ok) return;

  copyAllDraftBtn.disabled = true;
  copyAllDraftBtn.textContent = "전체 등록 중...";

  try {
    const batch = writeBatch(db);

    targets.forEach((person, index) => {
      const no = getPersonNo(person, index);

      batch.set(
        doc(db, "drafts", String(no)),
        {
          sourceNo: no,
          name: person.name || "",
          ko: person.ko || "",
          displayName: person.displayName || "",
          note: person.note || "",
          image: person.image || "no-image.jpg",
          status: "draft",
          updatedAt: new Date().toISOString()
        }
      );
    });

    await batch.commit();

    currentDraftIds = await loadDraftIds();

    renderPosts(
      currentPeople,
      currentDraftIds
    );

    status(
      `전체 Draft 등록 완료: ${targets.length}명 등록 / ${currentPeople.length - targets.length}명 건너뜀`,
      "success"
    );

    copyAllDraftBtn.textContent = "전체 Draft 등록 완료";

  } catch (e) {
    console.error(e);

    status(
      e?.code === "permission-denied"
        ? "Firebase에서 Draft 쓰기 권한이 거부되었습니다."
        : `전체 Draft 등록 실패: ${e.message}`,
      "error"
    );

    copyAllDraftBtn.disabled = false;
    copyAllDraftBtn.textContent = "전체 Draft 등록";
  }
}

async function initializeLikesCount() {

  if (!currentPeople.length) {
    status("people 데이터가 없습니다.", "error");
    return;
  }

  const ok = confirm(
    `전체 ${currentPeople.length}개의 사진에 대해 기존 좋아요 수를 계산합니다.\n\n` +
    `기존 likes 데이터는 삭제하지 않습니다.\n\n` +
    `계속할까요?`
  );

  if (!ok) return;

  initLikesCountBtn.disabled = true;
  initLikesCountBtn.textContent = "좋아요 수 계산 중...";

  let success = 0;
  let failed = 0;

  try {

    for (let i = 0; i < currentPeople.length; i++) {

      const person = currentPeople[i];
      const postId = String(person.name || "").trim();

      if (!postId) {
        failed++;
        continue;
      }

      try {

        const likesRef = collection(
          db,
          "people",
          postId,
          "likes"
        );

        const likesSnap = await getDocs(likesRef);

        const personRef = doc(
          db,
          "people",
          postId
        );

        await updateDoc(personRef, {
          likesCount: likesSnap.size
        });

        success++;

        status(
          `좋아요 수 계산 중... ${i + 1} / ${currentPeople.length} ` +
          `(${postId}: ${likesSnap.size}개)`,
          "info"
        );

      } catch (error) {

        failed++;

        console.error(
          "좋아요 수 초기화 실패:",
          postId,
          error
        );
      }
    }

    status(
      `좋아요 수 초기화 완료: 성공 ${success}개 / 실패 ${failed}개`,
      failed === 0 ? "success" : "error"
    );

    initLikesCountBtn.textContent =
      failed === 0
        ? "좋아요 수 초기화 완료"
        : "좋아요 수 다시 초기화";

  } catch (error) {

    console.error(
      "좋아요 수 초기화 전체 실패:",
      error
    );

    status(
      `좋아요 수 초기화 실패: ${error.message}`,
      "error"
    );

    initLikesCountBtn.textContent =
      "좋아요 수 초기화";

  } finally {

    initLikesCountBtn.disabled = false;

  }
}

/* =========================
   수정 모달
========================= */

function openEditModal(person, no) {
  editingNo = no;

  editNo.value = no;
  editName.value = person.name || "";
  editKo.value = person.ko || "";
  editDisplayName.value = person.displayName || "";
  editNote.value = person.note || "";
  editImage.value = person.image || "no-image.jpg";

  editModal.classList.remove("hidden");

  setTimeout(() => {
    editName.focus();
  }, 50);
}

function openEditFromUrl() {
  const params = new URLSearchParams(
    window.location.search
  );

  const editNo = params.get("edit");

  if (!editNo) return;

  const index = currentPeople.findIndex(
    (person, index) =>
      String(getPersonNo(person, index)) === String(editNo)
  );

  if (index === -1) {
    status(
      `${editNo}번 사람을 찾을 수 없습니다.`,
      "error"
    );
    return;
  }

  const person = currentPeople[index];

  openEditModal(
    person,
    getPersonNo(person, index)
  );
}

function closeEdit() {
  editingNo = null;
  editModal.classList.add("hidden");
}

async function saveEdit(event) {
  event.preventDefault();

  if (editingNo === null) return;

  const name = editName.value.trim();
  const ko = editKo.value.trim();
  const displayName = editDisplayName.value.trim();
  const note = editNote.value.trim();
  const image = editImage.value.trim();

  saveEditBtn.disabled = true;
  saveEditBtn.textContent = "저장 중...";

  try {
    const ref = doc(
      db,
      "drafts",
      String(editingNo)
    );

    await updateDoc(ref, {
      name,
      ko,
      displayName,
      note,
      image: image || "no-image.jpg",
      updatedAt: new Date().toISOString()
    });

    status(
      `${editingNo}번 "${name}"의 Draft가 저장되었습니다.`,
      "success"
    );

    closeEdit();

    /*
      화면의 이름/한국 이름/표시 이름/메모/이미지도
      바로 갱신
    */
    const index = currentPeople.findIndex(
      person =>
        Number(getPersonNo(person, 0)) === Number(editingNo)
    );

    if (index !== -1) {
      currentPeople[index] = {
        ...currentPeople[index],
        name,
        ko,
        displayName,
        note,
        image
      };
    }

    renderPosts(
      currentPeople,
      currentDraftIds
    );

  } catch (e) {
    console.error(e);

    status(
      e?.code === "permission-denied"
        ? "Draft 수정 권한이 거부되었습니다."
        : `Draft 수정 실패: ${e.message}`,
      "error"
    );

  } finally {
    saveEditBtn.disabled = false;
    saveEditBtn.textContent = "저장";
  }
}

/* =========================
   로그인
========================= */

loginBtn.addEventListener("click", async () => {
  loginError.classList.add("hidden");
  loginBtn.disabled = true;
  loginBtn.textContent = "로그인 중...";

  try {
    await login();
  } catch (e) {
    loginError.textContent =
      e?.code === "auth/popup-blocked"
        ? "브라우저에서 팝업이 차단되었습니다."
        : "로그인에 실패했습니다.";

    loginError.classList.remove("hidden");
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Google 계정으로 로그인";
  }
});

async function doLogout() {
  try {
    await logout();
  } catch (e) {
    alert("로그아웃 중 문제가 발생했습니다.");
  }
}

logoutBtn.addEventListener("click", doLogout);
deniedLogoutBtn.addEventListener("click", doLogout);
copyAllDraftBtn.addEventListener("click", copyAllToDraft);

initLikesCountBtn.addEventListener(
    "click",
    initializeLikesCount
);

closeEditModal.addEventListener("click", closeEdit);
cancelEditBtn.addEventListener("click", closeEdit);
editForm.addEventListener("submit", saveEdit);

editModal.addEventListener("click", event => {
  if (event.target === editModal) {
    closeEdit();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeEdit();
  }
});

/* =========================
   인증
========================= */

watchAuth(async user => {
  hidePanels();

  if (!user) {
    loginPanel.classList.remove("hidden");
    return;
  }

  const email = (user.email || "").trim().toLowerCase();

  if (email !== ADMIN_EMAIL.toLowerCase()) {
    deniedPanel.classList.remove("hidden");

    deniedUser.textContent =
      `현재 로그인 계정: ${user.email || "알 수 없음"}`;

    return;
  }

  adminPanel.classList.remove("hidden");

  adminUser.textContent =
    `${user.displayName || user.email || "관리자"}님, 관리자 계정으로 로그인되어 있습니다.`;

  currentPeople =
    Array.isArray(people) ? people : [];

  try {
    currentDraftIds = await loadDraftIds();

    renderPosts(
      currentPeople,
      currentDraftIds
    );
    
    openEditFromUrl();

    const registered =
      currentPeople.filter((person, index) =>
        currentDraftIds.has(
          String(getPersonNo(person, index))
        )
      ).length;

    copyAllDraftBtn.textContent =
      registered === currentPeople.length
        ? "전체 Draft 등록 완료"
        : "전체 Draft 등록";

    console.log(`관리자 인증 성공: ${user.uid}`);
    console.log(`people.js 로드 완료: ${currentPeople.length}명`);
    console.log(`현재 Draft 등록: ${registered}명`);

  } catch (e) {
    console.error(e);

    renderPosts(currentPeople);

    status(
      `Draft 상태를 불러오지 못했습니다: ${e.message}`,
      "error"
    );
  }
});

loadingPanel.classList.remove("hidden");