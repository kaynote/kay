import { auth, watchAuth } from "./firebase.js";

import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import { db } from "./firebase.js";

const ADMIN_EMAIL = "ektjttnfp5@gmail.com";

const previewStatus =
  document.getElementById("previewStatus");

const previewGrid =
  document.getElementById("previewGrid");


function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function showStatus(message) {
  previewStatus.textContent = message;
}


function renderDrafts(drafts) {

  previewGrid.innerHTML = "";

  if (!drafts.length) {

    previewGrid.innerHTML = `
      <div class="preview-empty">
        등록된 Draft가 없습니다.
      </div>
    `;

    return;
  }


  drafts.forEach(draft => {

    const image =
      draft.image || "no-image.jpg";

    const card =
      document.createElement("article");

    card.className = "preview-card";


    card.innerHTML = `

      <img
        class="preview-image"
        src="${escapeHtml(image)}"
        alt="${escapeHtml(draft.name || "")}"
        onerror="
          this.onerror=null;
          this.src='no-image.jpg';
          this.classList.add('no-image');
        "
      >

      <div class="preview-body">

        <div class="preview-number">
          No. ${escapeHtml(draft.sourceNo)}
        </div>

        <h2 class="preview-name">
          ${escapeHtml(draft.name)}
        </h2>

        ${
          draft.ko
            ? `
              <div class="preview-ko">
                ${escapeHtml(draft.ko)}
              </div>
            `
            : ""
        }

        ${
          draft.displayName
            ? `
              <div class="preview-display-name">
                ${escapeHtml(draft.displayName)}
              </div>
            `
            : ""
        }

        ${
          draft.note
            ? `
              <div class="preview-note">
                ${escapeHtml(draft.note)}
              </div>
            `
            : ""
        }

        <div class="preview-actions">

          <a
            href="admin.html?edit=${encodeURIComponent(draft.sourceNo)}"
            class="preview-edit-btn"
          >
            수정
          </a>

        </div>

      </div>
    `;


    previewGrid.appendChild(card);

  });
}


async function loadDrafts() {

  showStatus("Draft를 불러오는 중...");

  try {

    const draftsRef =
      collection(db, "drafts");

    const draftsQuery =
      query(
        draftsRef,
        orderBy("sourceNo", "asc")
      );

    const snapshot =
      await getDocs(draftsQuery);


    const drafts =
      snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));


    renderDrafts(drafts);

    showStatus(
      `Draft ${drafts.length}명을 불러왔습니다.`
    );


  } catch (error) {

    console.error(error);

    if (error.code === "permission-denied") {

      showStatus(
        "Draft를 읽을 권한이 없습니다. 관리자 계정으로 로그인했는지 확인하세요."
      );

    } else {

      showStatus(
        `Draft를 불러오지 못했습니다: ${error.message}`
      );

    }

  }
}


watchAuth(async user => {

  if (!user) {

    showStatus(
      "관리자 로그인이 필요합니다."
    );

    previewGrid.innerHTML = `
      <div class="preview-error">
        먼저 관리자 페이지에서 Google 계정으로 로그인하세요.
        <br><br>

        <a href="admin.html">
          관리자 페이지로 이동
        </a>
      </div>
    `;

    return;
  }


  const email =
    (user.email || "")
      .trim()
      .toLowerCase();


  if (email !== ADMIN_EMAIL.toLowerCase()) {

    showStatus(
      "관리자 계정만 Draft 미리보기를 사용할 수 있습니다."
    );

    previewGrid.innerHTML = `
      <div class="preview-error">
        현재 로그인한 계정에는 관리자 권한이 없습니다.
      </div>
    `;

    return;
  }


  await loadDrafts();

});