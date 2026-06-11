const fs = require("fs");
const path = require("path");

/* =========================
   paths
========================= */
const txtPath = path.join(__dirname, "names.txt");
const imagesDir = path.join(__dirname, "images");
const outputPath = path.join(__dirname, "people.js");

/* =========================
   normalize (강화 버전)
========================= */
function normalize(str) {
  return str
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\.(jpg|jpeg|png|webp)$/i, "")
    .replace(/[_\-.]+/g, " ")          // 구분자 유지 완화
    .replace(/[^a-z0-9가-힣\s]/g, "")  // 특수문자 제거
    .replace(/\s+/g, " ")
    .trim();
}

/* =========================
   timestamp style
========================= */
function styleTimestamp(text) {
  if (!text) return text;

  return text
    .replace(
      /\d{4}\.\d{2}\.\d{2}\s\d{1,2}:\d{2}(?::\d{2})?/g,
      m => `<span class="ts">${m}</span>`
    )
    .replace(
      /\d{4}\.\d{2}\.\d{2}/g,
      m => `<span class="ts">${m}</span>`
    )
    .replace(
      /정주행/g,
      `<span class="ts">정주행</span>`
    );
}

/* =========================
   read names
========================= */
if (!fs.existsSync(txtPath)) {
  console.log("❌ names.txt 없음");
  process.exit(1);
}

const raw = fs.readFileSync(txtPath, "utf8");

const lines = raw
  .split(/\r?\n/)
  .map(v => v.trim())
  .filter(Boolean);

console.log("📄 names:", lines.length);

/* =========================
   read images
========================= */
if (!fs.existsSync(imagesDir)) {
  console.log("❌ images 폴더 없음");
  process.exit(1);
}

const imageFiles = fs
  .readdirSync(imagesDir)
  .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));

console.log("📂 image files:", imageFiles.length);

/* =========================
   image map (multi-key fallback)
========================= */
const imageMap = new Map();

for (const file of imageFiles) {

  const base = normalize(file);

  // 여러 키로 저장 (매칭률 증가)
  const keys = new Set([
    base,
    base.replace(/\s+/g, ""),          // 공백 제거 버전
  ]);

  for (const key of keys) {

    if (imageMap.has(key)) {
      console.log("⚠️ 중복 key:", key);
    }

    imageMap.set(key, file);
  }
}

/* =========================
   build people
========================= */
let people = lines.map(line => {

  line = line.replace(/^\d+\.\s*/, "");

  const noteMatch = line.match(/\((.*?)\)/);
  const note = noteMatch ? noteMatch[1].trim() : "";

  const cleanLine = line.replace(/\(.*?\)/, "").trim();

  const parts = cleanLine.split(/\s+/);

  const koStartIndex = parts.findIndex(p => /[가-힣]/.test(p));

  let name = "";
  let ko = "";

  if (koStartIndex === -1) {
    name = cleanLine;
  } else {
    name = parts.slice(0, koStartIndex).join(" ").trim();
    ko = parts.slice(koStartIndex).join(" ").trim();
  }

  const visibleName = name.replace(/[_-]\d+$/, "");

  const displayNameRaw = ko
    ? visibleName + "\n" + ko
    : visibleName;

  const displayName = styleTimestamp(displayNameRaw);

  const key = normalize(name);

  /* =========================
     image matching (fallback 강화)
  ========================= */
  let matchedImage =
    imageMap.get(key) ||
    imageMap.get(key.replace(/\s+/g, "")) ||
    imageMap.get(name.toLowerCase()) ||
    "no-image.jpg";

  if (matchedImage === "no-image.jpg") {
    console.log("🖼️ 이미지 못 찾음:", name);
  }

  return {
    name,
    ko,
    displayName,
    note,
    image: matchedImage
  };
});

/* =========================
   sort (stable)
========================= */
people.sort((a, b) =>
  (a.name || "").localeCompare(
    (b.name || ""),
    "en",
    {
      sensitivity: "base",
      numeric: true
    }
  )
);

/* =========================
   add sequence number
========================= */
people = people.map((p, i) => ({
  no: i + 1,
  ...p
}));

/* =========================
   output
========================= */
const output =
  "// Auto-generated from names.txt\n\n" +
  "const people = " +
  JSON.stringify(people, null, 2) +
  ";\n\n" +
  "export default people;\n";

/* =========================
   backup
========================= */
if (fs.existsSync(outputPath)) {
  fs.copyFileSync(outputPath, outputPath + ".backup");
}

/* =========================
   write file
========================= */
fs.writeFileSync(outputPath, output, "utf8");

/* =========================
   done
========================= */
console.log("✅ build 완료");
console.log("👥 people :", people.length);
console.log("📄 output :", outputPath);