import { auth, watchAuth, db } from "./firebase.js";

import people from "./people.js?v=302";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


const ADMIN_EMAIL = "ektjttnfp5@gmail.com";


const compareStatus =
  document.getElementById("compareStatus");

const compareContainer =
  document.getElementById("compareContainer");

const compareSubtitle =
  document.getElementById("compareSubtitle");


/* =========================
   HTML 이스케이프
========================= */

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================
   URL에서 번호 가져오기
========================= */

function getNoFromUrl() {

  const params =
    new URLSearchParams(
      window.location.search
    );

  return params.get("no");
}


/* =========================
   사람 번호 찾기
========================= */

function getPersonNo(person, index) {
  return person.no ?? index + 1;
}


/* =========================
   people.js에서 사람 찾기
========================= */

function findPerson(no) {

  const index =
    people.findIndex(
      (person, index) =>
        String(getPersonNo(person, index)) === String(no)
    );

  if (index === -1) {
    return null;
  }

  return people[index];
}


/* =========================
   값 비교
========================= */

function normalizeValue(value) {
  return String(value ?? "").trim();
}


function isChanged(publicValue, draftValue) {

  return normalizeValue(publicValue)
    !== normalizeValue(draftValue);

}


/* =========================
   일반 값 HTML
========================= */

function renderValue(value) {

  const text =
    String(value ?? "").trim();

  if (!text) {

    return `
      <div class="value empty">
        값 없음
      </div>
    `;

  }

  return `
    <div class="value">
      ${escapeHtml(text)}
    </div>
  `;

}


/* =========================
   이미지 HTML
========================= */

function renderImage(value) {

  const image =
    String(value ?? "").trim() ||
    "no-image.jpg";

  return `
    <div class="image-cell">

      <img
        class="compare-image"
        src="${escapeHtml(image)}"
        alt=""
        onerror="
          this.onerror=null;
          this.src='no-image.jpg';
          this.classList.add('no-image');
        "
      >

      ${renderValue(image)}

    </div>
  `;

}


/* =========================
   비교 행
========================= */

function renderRow(
  label,
  publicValue,
  draftValue,
  type = "text"
) {

  const changed =
    isChanged(
      publicValue,
      draftValue
    );

  const publicHtml =
    type === "image"
      ? renderImage(publicValue)
      : renderValue(publicValue);

  const draftHtml =
    type === "image"
      ? renderImage(draftValue)
      : renderValue(draftValue);


  return `
    <tr class="${changed ? "changed" : "same"}">

      <td class="field-name">

        ${escapeHtml(label)}

        ${
          changed
            ? `<span class="changed-label">변경됨</span>`
            : ""
        }

      </td>

      <td>
        ${publicHtml}
      </td>

      <td>
        ${draftHtml}
      </td>

    </tr>
  `;

}


/* =========================
   비교 화면
========================= */

function renderComparison(
  person,
  draft,
  no
) {

  const fields = [
    ["이름", person.name, draft.name, "text"],
    ["한국 이름", person.ko, draft.ko, "text"],
    ["표시 이름", person.displayName, draft.displayName, "text"],
    ["메모 / 설명", person.note, draft.note, "text"],
    ["이미지", person.image, draft.image, "image"]
  ];


  const changedCount =
    fields.filter(field =>
      isChanged(field[1], field[2])
    ).length;


  compareSubtitle.textContent =
    `${no}번 변경사항을 확인합니다.`;


  const summaryClass =
    changedCount > 0
      ? "changed-summary"
      : "no-change-summary";


  const summaryText =
    changedCount > 0
      ? `${changedCount}개 항목이 변경되었습니다.`
      : "변경된 항목이 없습니다.";


  compareContainer.innerHTML = `

    <div class="change-summary ${summaryClass}">

      <strong>
        ${escapeHtml(no)}번
      </strong>

      <div>
        ${summaryText}
      </div>

    </div>


    <table class="compare-table">

      <thead>

        <tr>

          <th>
            항목
          </th>

          <th>
            현재 공개 데이터
            <br>
            <small>people.js</small>
          </th>

          <th>
            Draft 데이터
            <br>
            <small>Firestore</small>
          </th>

        </tr>

      </thead>

      <tbody>

        ${fields.map(field =>
          renderRow(
            field[0],
            field[1],
            field[2],
            field[3]
          )
        ).join("")}

      </tbody>

    </table>

    <div class="compare-actions">

      <a
        href="admin.html?edit=${encodeURIComponent(no)}"
        class="back-btn"
      >
        이 번호 수정
      </a>

      <a
        href="draft-preview.html"
        class="back-btn secondary"
      >
        Draft 미리보기
      </a>

      <button
        type="button"
        class="publish-btn"
        id="publishBtn"
      >
        게시하기
      </button>

    </div>

  `;

const publishBtn =
  document.getElementById("publishBtn");

if (publishBtn) {
  publishBtn.addEventListener("click", () => {
    alert(
      `${no}번 게시 기능은 다음 단계에서 연결됩니다.`
    );
  });
}

}

/* =========================
   비교 실행
========================= */

async function loadComparison() {

  const no =
    getNoFromUrl();


  if (!no) {

    compareStatus.textContent =
      "비교할 번호가 지정되지 않았습니다.";

    compareContainer.innerHTML = `
      <div class="compare-message">
        URL에 번호가 없습니다.
      </div>
    `;

    return;

  }


  const person =
    findPerson(no);


  if (!person) {

    compareStatus.textContent =
      "해당 번호를 찾을 수 없습니다.";

    compareContainer.innerHTML = `
      <div class="compare-message">
        ${escapeHtml(no)}번 데이터를
        people.js에서 찾을 수 없습니다.
      </div>
    `;

    return;

  }


  compareStatus.textContent =
    `${no}번 Draft를 불러오는 중...`;


  try {

    const draftRef =
      doc(
        db,
        "drafts",
        String(no)
      );


    const draftSnap =
      await getDoc(draftRef);


    if (!draftSnap.exists()) {

      compareStatus.textContent =
        "Draft가 없습니다.";

      compareContainer.innerHTML = `
        <div class="compare-message">
          ${escapeHtml(no)}번은 아직 Draft에 등록되지 않았습니다.
        </div>
      `;

      return;

    }


    const draft =
      draftSnap.data();


    renderComparison(
      person,
      draft,
      no
    );


    const changedCount = [
      ["name", person.name, draft.name],
      ["ko", person.ko, draft.ko],
      ["displayName", person.displayName, draft.displayName],
      ["note", person.note, draft.note],
      ["image", person.image, draft.image]
    ].filter(item =>
      isChanged(item[1], item[2])
    ).length;


    compareStatus.textContent =
      changedCount > 0
        ? `${no}번 비교 완료 · ${changedCount}개 항목 변경`
        : `${no}번 비교 완료 · 변경사항 없음`;


  } catch (error) {

    console.error(error);


    if (error.code === "permission-denied") {

      compareStatus.textContent =
        "Draft를 읽을 권한이 없습니다.";

      compareContainer.innerHTML = `
        <div class="compare-message">
          관리자 계정으로 로그인했는지 확인하세요.
        </div>
      `;

    } else {

      compareStatus.textContent =
        "비교 중 오류가 발생했습니다.";

      compareContainer.innerHTML = `
        <div class="compare-message">
          ${escapeHtml(error.message)}
        </div>
      `;

    }

  }

}


/* =========================
   관리자 인증
========================= */

watchAuth(async user => {

  if (!user) {

    compareStatus.textContent =
      "관리자 로그인이 필요합니다.";

    compareContainer.innerHTML = `
      <div class="compare-message">

        먼저 관리자 페이지에서
        Google 계정으로 로그인하세요.

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


  if (
    email !==
    ADMIN_EMAIL.toLowerCase()
  ) {

    compareStatus.textContent =
      "관리자 계정만 사용할 수 있습니다.";

    compareContainer.innerHTML = `
      <div class="compare-message">
        현재 로그인한 계정에는
        관리자 권한이 없습니다.
      </div>
    `;

    return;

  }


  await loadComparison();

});