```js
import {
  auth,
  provider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "./firebase.js";

import people from "./people.js";

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

  return card;
}

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
```
