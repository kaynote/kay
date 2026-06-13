import {
  collection,
  getDocs,
  addDoc
} from
"https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import { db } from "./firebase.js";

import {
  auth,
  provider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "./firebase.js";

/* 🔥 JS도 캐시 방지 */
import people from "./people.js?v=3";

const container =
    document.getElementById("peopleContainer");
    
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

/* INIT */
function init(){
    if(!Array.isArray(people)) return;
    data = people;
    render(data);
}

/* CARD */

function createCard(p, index){

```
const card = document.createElement("div");
card.className = "card";

const photo = document.createElement("div");
photo.className = "photo";

const img = document.createElement("img");

img.src = p.image
    ? "images/" + p.image
    : "images/no-image.jpg";

img.loading = "lazy";
img.decoding = "async";

photo.appendChild(img);

const info = document.createElement("div");
info.className = "info";

const nameEl = document.createElement("div");
nameEl.className = "name";

const enEl = document.createElement("div");
enEl.className = "en";

const no = (p.no || (index + 1));

enEl.innerHTML =
    `<span class="num">${no}.</span>
     <span class="txt">${p.name || ""}</span>`;

const koEl = document.createElement("div");
koEl.className = "ko";
koEl.textContent = p.ko || "";

nameEl.appendChild(enEl);

if(p.ko){
    nameEl.appendChild(koEl);
}

const metaEl = document.createElement("div");
metaEl.className = "meta";
metaEl.textContent =
  p.tags ? p.tags.join(" · ") : "";

const descEl = document.createElement("div");
descEl.className = "desc";
descEl.innerHTML = p.note || "";

const person = p.name;

info.appendChild(nameEl);
info.appendChild(metaEl);
info.appendChild(descEl);

const commentBox =
  document.createElement("div");

commentBox.innerHTML = `
  <textarea class="commentText"
  placeholder="댓글 입력"></textarea>

  <button class="commentBtn">
    댓글 등록
  </button>

  <div class="commentList"></div>
`;

info.appendChild(commentBox);

const commentBtn =
  commentBox.querySelector(".commentBtn");

const commentText =
  commentBox.querySelector(".commentText");

const commentList =
  commentBox.querySelector(".commentList");

async function loadComments(){

  const snap =
    await getDocs(
      collection(
        db,
        "comments",
        person,
        "items"
      )
    );

  commentList.innerHTML = "";

  snap.forEach(doc => {

    const c = doc.data();

    commentList.innerHTML += `
      <div class="commentItem">
        <b>${c.name}</b><br>
        ${c.text}
      </div>
    `;

  });

}

commentBtn.onclick = async () => {

  const user = auth.currentUser;

  if(!user){
    alert("로그인 필요");
    return;
  }

  if(!commentText.value.trim()){
    return;
  }

  await addDoc(
    collection(
      db,
      "comments",
      person,
      "items"
    ),
    {
      uid: user.uid,
      name: user.displayName,
      text: commentText.value,
      createdAt: Date.now()
    }
  );

  commentText.value = "";

  await loadComments();

};

loadComments();

card.appendChild(photo);
card.appendChild(info);

return card;
```

}

/* RENDER */
function render(list){

    const fragment = document.createDocumentFragment();

    list.forEach((p, index) => {

        const key = (p.no || index) + "_" + p.name;

        if(renderedMap.has(key)){
            fragment.appendChild(renderedMap.get(key));
        }else{
            const card = createCard(p, index);
            renderedMap.set(key, card);
            fragment.appendChild(card);
        }
    });

    container.replaceChildren(fragment);
}

/* SEARCH */
function debounce(fn, delay = 150){
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), delay);
    };
}

const handleSearch = debounce((value) => {

    const k = value.toLowerCase();

    const filtered = data.filter(p =>
        (p.name || "").toLowerCase().includes(k) ||
        (p.ko || "").toLowerCase().includes(k) ||
        (p.note || "").toLowerCase().includes(k)
    );

    render(filtered);

}, 150);

searchBox.addEventListener("input", e => {
    handleSearch(e.target.value);
});

/* START */
init();

loginBtn.onclick = () =>
  signInWithPopup(auth, provider);

logoutBtn.onclick = () =>
  signOut(auth);

onAuthStateChanged(auth, user => {

  if(user){
    userInfo.textContent =
      user.displayName;
  }else{
    userInfo.textContent =
      "로그인 안됨";
  }

});