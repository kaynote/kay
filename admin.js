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

const loginError = $("loginError");
const adminUser = $("adminUser");
const deniedUser = $("deniedUser");
const postList = $("postList");
const postCount = $("postCount");
const statusMessage = $("statusMessage");

let currentPeople = [];
let currentDraftIds = new Set();

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

    tr.innerHTML = `
      <td>${escapeHtml(no)}</td>
      <td class="name-cell">${escapeHtml(person.name || "")}</td>
      <td>${escapeHtml(person.ko || "")}</td>
      <td>${escapeHtml(person.displayName || "")}</td>
      <td class="note-cell">${escapeHtml(person.note || "")}</td>
      <td>${escapeHtml(person.image || "no-image.jpg")}</td>
      <td class="action-cell">
        <button class="draft-btn" ${done ? "" : "disabled"}>
          ${done ? "수정" : "Draft 등록"}
        </button>
      </td>
    `;

    const button = tr.querySelector("button");

    if (done) {
      button.addEventListener("click", () =>
        editDraft(person, no)
      );
    }

    postList.appendChild(tr);
  });
}

async function loadDraftIds() {
  const snap = await getDocs(collection(db, "drafts"));
  return new Set(snap.docs.map(doc => String(doc.id)));
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
      status(`"${person.name}"은(는) 이미 Draft에 등록되어 있습니다.`, "info");
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

    renderPosts(currentPeople, currentDraftIds);

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

/* =========================
   Draft 수정
========================= */

async function editDraft(person, no) {
  try {
    const ref = doc(db, "drafts", String(no));
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      status(`Draft ${no}번을 찾을 수 없습니다.`, "error");
      return;
    }

    const data = snap.data();

    const name = prompt(
      "이름",
      data.name || ""
    );

    if (name === null) return;

    const ko = prompt(
      "한국 이름",
      data.ko || ""
    );

    if (ko === null) return;

    const displayName = prompt(
      "표시 이름",
      data.displayName || ""
    );

    if (displayName === null) return;

    const note = prompt(
      "메모 / 설명",
      data.note || ""
    );

    if (note === null) return;

    const image = prompt(
      "이미지 파일명",
      data.image || "no-image.jpg"
    );

    if (image === null) return;

    await updateDoc(ref, {
      name,
      ko,
      displayName,
      note,
      image,
      updatedAt: new Date().toISOString()
    });

    status(
      `"${name}"의 Draft가 저장되었습니다.`,
      "success"
    );

  } catch (e) {
    console.error(e);

    status(
      e?.code === "permission-denied"
        ? "Draft 수정 권한이 거부되었습니다."
        : `Draft 수정 실패: ${e.message}`,
      "error"
    );
  }
}

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