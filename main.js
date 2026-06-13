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
  serverTimestamp
} from "./firebase.js";

import people from "./people.js";

/* ---------------- DOM ---------------- */

const container = document.getElementById("peopleContainer");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userInfo = document.getElementById("userInfo");
const searchBox = document.getElementById("searchBox");

/* ---------------- STATE ---------------- */

let data = [];
let renderedMap = new Map();

/* ---------------- AUTH ---------------- */

loginBtn.onclick = async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    alert(e.message);
  }
};

logoutBtn.onclick = async () => {
  await signOut(auth);
};

onAuthStateChanged(auth, user => {
  if (user) {
    userInfo.textContent = user.displayName;
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
  } else {
    userInfo.textContent = "로그인 안됨";
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
  }
});

/* ---------------- INIT ---------------- */

function init() {
  data = Array.isArray(people) ? people : [];
  render(data);
}

/* ---------------- CARD ---------------- */

function createCard(p, index) {
  const card = document.createElement("div");
  card.className = "card";

  const img = document.createElement("img");
  img.src = p.image ? `images/${p.image}` : "images/no-image.jpg";

  const info = document.createElement("div");
  info.innerHTML = `
    <div>${p.no || index + 1}. ${p.name}</div>
    <div>${p.ko || ""}</div>
  `;

  card.appendChild(img);
  card.appendChild(info);

  card.onclick = () => openModal(p);

  return card;
}

/* ---------------- RENDER ---------------- */

function render(list) {
  const frag = document.createDocumentFragment();

  list.forEach((p, i) => {
    const card = createCard(p, i);
    frag.appendChild(card);
  });

  container.replaceChildren(frag);
}

/* ---------------- MODAL ---------------- */

function openModal(p) {
  const modal = document.getElementById("modal");
  const body = document.getElementById("modalBody");

  modal.classList.remove("hidden");

  body.innerHTML = `
    <h2>${p.name}</h2>
    <h3>${p.ko || ""}</h3>
    <img src="images/${p.image}" style="width:100%;max-width:300px;">
    <p>${p.note || ""}</p>
  `;

  document.getElementById("closeModal").onclick = closeModal;
  document.getElementById("modalOverlay").onclick = closeModal;
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}

/* ---------------- SEARCH ---------------- */

function debounce(fn, delay = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

const handleSearch = debounce(val => {
  const k = val.toLowerCase();

  const filtered = data.filter(p =>
    (p.name || "").toLowerCase().includes(k) ||
    (p.ko || "").toLowerCase().includes(k) ||
    (p.note || "").toLowerCase().includes(k)
  );

  render(filtered);
});

searchBox.addEventListener("input", e => {
  handleSearch(e.target.value);
});

/* ---------------- START ---------------- */

init();