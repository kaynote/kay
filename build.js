const fs = require("fs");
const path = require("path");

/* =========================
   paths
========================= */
const txtPath = path.join(__dirname, "names.txt");
const imagesDir = path.join(__dirname, "images");
const outputPath = path.join(__dirname, "people.js");

/* =========================
   normalize
========================= */
function normalize(str) {
  return str
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\.(jpg|jpeg|png|webp)$/i, "")
    .replace(/[_\-.]+/g, " ")
    .replace(/[^a-z0-9가-힣\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* =========================
   timestamp formatter
========================= */
function formatNote(note) {
  if (!note) return "";

  /**
   * 지원 패턴
   * 1) 2021.11.10
   * 2) 2021.11.10 23:42
   * 3) 23:42 / 57:14 (타임코드)
   *
   * ❌ 제외: 2025년 3월 15일 (한글 날짜)
   */

  const timestampRegex =
    /(\d{4}\.\d{1,2}\.\d{1,2}(?:\s*\d{1,2}:\d{2})?|\b\d{1,2}:\d{2}\b)/g;

  return note.replace(
    timestampRegex,
    '<span class="timestamp">$1</span>'
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

console.log("");
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

console.log("");
console.log("📂 image files:", imageFiles.length);

/* =========================
   image map
========================= */
const imageMap = new Map();

for (const file of imageFiles) {

  if (normalize(file) === "no image") continue;

  const key = normalize(file);

  if (imageMap.has(key)) {
    console.log("");
    console.log("⚠️ 중복 key 발견");
    console.log("key =", key);
    console.log("old =", imageMap.get(key));
    console.log("new =", file);
    console.log("➡️ 최신 파일로 덮어쓰기");
  }

  imageMap.set(key, file);

  console.log("🖼️", file, "→", key);
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

  const displayName = ko
    ? visibleName + " " + ko
    : visibleName;

  const key = normalize(name);

  let matchedImage = imageMap.get(key);

  if (!matchedImage) {
    matchedImage = "no-image.jpg";
  }

  if (matchedImage !== "no-image.jpg") {
    console.log("");
    console.log("✅ MATCH");
    console.log("name =", name);
    console.log("key  =", key);
    console.log("file =", matchedImage);
  } else {
    console.log("");
    console.log("❌ NO IMAGE");
    console.log("name =", name);
    console.log("key  =", key);
    console.log("➡️ no-image.jpg 사용");
  }

  return {
    name,
    ko,
    displayName,
    note: note,
    image: matchedImage
  };

});

/* =========================
   sort alphabetically
========================= */
people.sort((a, b) =>
  a.name.localeCompare(b.name, "en", {
    sensitivity: "base",
    numeric: true
  })
);

/* =========================
   add sequence number
========================= */
people = people.map((person, index) => ({
  no: index + 1,
  ...person
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
   backup old file
========================= */
if (fs.existsSync(outputPath)) {
  const backupPath = outputPath + ".backup";

  fs.copyFileSync(outputPath, backupPath);

  console.log("");
  console.log("💾 backup 생성");
  console.log("📄", backupPath);
}

/* =========================
   write file
========================= */
fs.writeFileSync(outputPath, output, "utf8");

/* =========================
   done
========================= */
console.log("");
console.log("✅ build 완료");
console.log("👥 people :", people.length);
console.log("🖼️ images :", imageFiles.length);
console.log("📄 output :", outputPath);