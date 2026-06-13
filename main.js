import {
  auth,
  provider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "./firebase.js";

import {
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp
}
from "./firebase.js";

import people from "./people.js";

const container =
  document.getElementById("peopleContainer");
  
  const container =
  document.getElementById("peopleContainer");

  console.log("container:", container);
  console.log("people:", people);

const loginBtn =
  document.getElementById("loginBtn");

const logoutBtn =
  document.getElementById("logoutBtn");

const userInfo =
  document.getElementById("userInfo");

const searchBox =
  document.getElementById("searchBox");

let data = [];
let renderedMap = new Map();

/* ---------------------------
   AUTH
--------------------------- */

loginBtn.addEventListener("click", async () => {

  try {

    await signInWithPopup(
      auth,
      provider
    );

  } catch (err) {

    console.error(err);

    alert(
      "로그인 실패\n\n" +
      err.message
    );
  }

});

logoutBtn.addEventListener("click", async () => {

  try {

    await signOut(auth);

  } catch (err) {

    console.error(err);

  }

});

onAuthStateChanged(auth, user => {

  if (user) {

    userInfo.textContent =
      `${user.displayName}`;

    loginBtn.style.display =
      "none";

    logoutBtn.style.display =
      "inline-block";

  } else {

    userInfo.textContent =
      "로그인 안됨";

    loginBtn.style.display =
      "inline-block";

    logoutBtn.style.display =
      "none";
  }

});

/* ---------------------------
   INIT
--------------------------- */

function init() {

  if (!Array.isArray(people)) {

    console.error(
      "people.js 오류"
    );

    return;
  }

  data = people;

  render(data);
}

/* ---------------------------
   CARD
--------------------------- */

function createCard(p, index) {

  const card =
    document.createElement("div");

  card.className = "card";

  /* PHOTO */

  const photo =
    document.createElement("div");

  photo.className = "photo";

  const img =
    document.createElement("img");

  img.src = p.image
    ? `images/${p.image}`
    : "images/no-image.jpg";

  img.loading = "lazy";
  img.decoding = "async";

  img.onerror = () => {
    img.src =
      "images/no-image.jpg";
  };

  photo.appendChild(img);

  /* INFO */

  const info =
    document.createElement("div");

  info.className = "info";

  const nameEl =
    document.createElement("div");

  nameEl.className = "name";

  const enEl =
    document.createElement("div");

  enEl.className = "en";

  const no =
    p.no || (index + 1);

  enEl.innerHTML =
    `
      <span class="num">
        ${no}.
      </span>

      <span class="txt">
        ${p.name || ""}
      </span>
    `;

  nameEl.appendChild(enEl);

  if (p.ko) {

    const koEl =
      document.createElement("div");

    koEl.className = "ko";

    koEl.textContent =
      p.ko;

    nameEl.appendChild(koEl);
  }

  const metaEl =
    document.createElement("div");

  metaEl.className = "meta";

  metaEl.textContent =
    Array.isArray(p.tags)
      ? p.tags.join(" · ")
      : "";

  const descEl =
    document.createElement("div");

  descEl.className = "desc";

  descEl.innerHTML =
    p.note || "";

  info.appendChild(nameEl);
  info.appendChild(metaEl);
  info.appendChild(descEl);

  card.appendChild(photo);
  card.appendChild(info);

  /* 카드 클릭 시 팝업 */
card.addEventListener("click", () => {
    openPersonModal(p);
});

  return card;
}

```js
/* ---------------------------
   MODAL
--------------------------- */

let currentPerson = null;

async function openPersonModal(person){

  currentPerson = person;

  let modal =
    document.getElementById("modal");

  if(!modal){

    modal = document.createElement("div");

    modal.id = "modal";

    modal.innerHTML = `
      <div id="modalOverlay"></div>

      <div id="modalContent">

        <button id="closeModal">
          ✕
        </button>

        <div id="modalBody"></div>

      </div>
    `;

    document.body.appendChild(modal);

    document
      .getElementById("closeModal")
      .onclick = () => {

      modal.remove();

    };

    document
      .getElementById("modalOverlay")
      .onclick = () => {

      modal.remove();

    };
  }

  const body =
    document.getElementById("modalBody");

  body.innerHTML = `

    <h2>
      ${person.name || ""}
    </h2>

    ${
      person.ko
      ? `<h3>${person.ko}</h3>`
      : ""
    }

    <img
      src="${
        person.image
          ? `images/${person.image}`
          : "images/no-image.jpg"
      }"
      style="
        max-width:300px;
        width:100%;
        border-radius:10px;
      "
    >

    <div style="margin-top:15px">
      ${person.note || ""}
    </div>

    <hr>

    <button id="likeBtn">
      👍 좋아요
    </button>

    <span id="likeCount">
      0
    </span>

    <hr>

    <h3>댓글</h3>

    <div id="commentList"></div>

    <textarea
      id="commentText"
      rows="3"
      style="
        width:100%;
        margin-top:10px;
      "
    ></textarea>

    <button
      id="commentBtn">
      댓글 등록
    </button>
  `;

  setupLikeButton(person.name);

  setupCommentButton(person.name);

  loadLikes(person.name);

  loadComments(person.name);
}

async function loadLikes(name){

  const countEl =
    document.getElementById(
      "likeCount"
    );

  const ref =
    doc(db,"likes",name);

  const snap =
    await getDoc(ref);

  if(!snap.exists()){

    await setDoc(ref,{
      count:0
    });

    countEl.textContent = "0";

    return;
  }

  countEl.textContent =
    snap.data().count || 0;
}

async function setupLikeButton(name){

  const btn =
    document.getElementById(
      "likeBtn"
    );

  btn.onclick = async ()=>{

    if(!auth.currentUser){

      alert(
        "로그인 후 이용하세요."
      );

      return;
    }

    const uid =
      auth.currentUser.uid;

    const likeId =
      uid + "_" + name;

    const likeRef =
      doc(
        db,
        "userLikes",
        likeId
      );

    const liked =
      await getDoc(
        likeRef
      );

    if(liked.exists()){

      alert(
        "이미 좋아요를 눌렀습니다."
      );

      return;
    }

    await setDoc(
      likeRef,
      {
        liked:true
      }
    );

    const countRef =
      doc(
        db,
        "likes",
        name
      );

    await setDoc(
      countRef,
      {
        count:0
      },
      {
        merge:true
      }
    );

    await updateDoc(
      countRef,
      {
        count:increment(1)
      }
    );

    loadLikes(name);
  };
}

function setupCommentButton(name){

  const btn =
    document.getElementById(
      "commentBtn"
    );

  btn.onclick = async ()=>{

    if(!auth.currentUser){

      alert(
        "로그인 후 이용하세요."
      );

      return;
    }

    const text =
      document
      .getElementById(
        "commentText"
      )
      .value
      .trim();

    if(!text){
      return;
    }

    await addDoc(
      collection(
        db,
        "comments"
      ),
      {
        person:name,
        uid:
          auth.currentUser.uid,
        name:
          auth.currentUser.displayName,
        text,
        createdAt:
          serverTimestamp()
      }
    );

    document
      .getElementById(
        "commentText"
      )
      .value = "";

    loadComments(name);
  };
}

async function loadComments(name){

  const list =
    document.getElementById(
      "commentList"
    );

  if(!list){
    return;
  }

  list.innerHTML = "";

  const q =
    query(
      collection(
        db,
        "comments"
      ),
      where(
        "person",
        "==",
        name
      )
    );

  const snap =
    await getDocs(q);

  snap.forEach(docSnap=>{

    const c =
      docSnap.data();

    const div =
      document.createElement(
        "div"
      );

    div.style.marginBottom =
      "8px";

    div.innerHTML =
      `<b>${c.name}</b><br>${c.text}`;

    list.appendChild(div);
  });
}
```

/* ---------------------------
   RENDER
--------------------------- */

function render(list) {

  const fragment =
    document.createDocumentFragment();

  list.forEach((p, index) => {

    const key =
      `${p.no || index}_${p.name}`;

    if (renderedMap.has(key)) {

      fragment.appendChild(
        renderedMap.get(key)
      );

    } else {

      const card =
        createCard(p, index);

      renderedMap.set(
        key,
        card
      );

      fragment.appendChild(card);
    }

  });

  container.replaceChildren(
    fragment
  );
}

/* ---------------------------
   SEARCH
--------------------------- */

function debounce(
  fn,
  delay = 150
) {

  let timer;

  return (...args) => {

    clearTimeout(timer);

    timer = setTimeout(
      () => fn(...args),
      delay
    );
  };
}

const handleSearch =
  debounce(value => {

    const keyword =
      value.trim().toLowerCase();

    if (!keyword) {

      render(data);

      return;
    }

    const filtered =
      data.filter(p => {

        const name =
          (p.name || "")
          .toLowerCase();

        const ko =
          (p.ko || "")
          .toLowerCase();

        const note =
          (p.note || "")
          .toLowerCase();

        return (
          name.includes(keyword) ||
          ko.includes(keyword) ||
          note.includes(keyword)
        );
      });

    render(filtered);

  });

searchBox.addEventListener(
  "input",
  e => {

    handleSearch(
      e.target.value
    );

  }
);

/* ---------------------------
   START
--------------------------- */

init();