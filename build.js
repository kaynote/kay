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
   timestamp formatter (FINAL)
========================= */
function formatNote(note) {
  if (!note) return "";

  let result = note;

  /**
   * 🎯 핵심 1: 정주행 / 채팅 / 기타 키워드 포함 케이스
   * YYYY.MM.DD + 한글 + HH:MM or HH:MM:SS
   */
  result = result.replace(
    /(\d{4}\.\d{1,2}\.\d{1,2})([\s\S]*?)(\d{1,2}:\d{2}(?::\d{2})?)/g,
    (m, date, middle, time) => {
      return `<span class="timestamp">${date}${middle}${time}</span>`;
    }
  );

  /**
   * 🎯 핵심 2: 정주행 단독 케이스 보강 (선택 안전망)
   */
  result = result.replace(
    /(정주행)\s+(\d{4}\.\d{1,2}\.\d{1,2})\s*(\d{1,2}:\d{2}(?::\d{2})?)/g,
    (m, label, date, time) => {
      return `<span class="timestamp">${label} ${date} ${time}</span>`;
    }
  );

  return result;
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

console.log("📂 images:", imageFiles.length);

/* =========================
   image map
========================= */
const imageMap = new Map();

for (const file of imageFiles) {
  if (normalize(file) === "no image") continue;
  imageMap.set(normalize(file), file);
}

/* =========================
   build people
========================= */
let people = lines.map((line, index) => {

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

  const matchedImage = imageMap.get(key) || "no-image.jpg";

  return {
    no: index + 1,
    name,
    ko,
    displayName,
    note: formatNote(note),
    image: matchedImage
  };
});

/* =========================
   sort
========================= */
people.sort((a, b) =>
  a.name.localeCompare(b.name, "en", {
    sensitivity: "base",
    numeric: true
  })
);

/* =========================
   re-number after sort
========================= */
people = people.map((p, i) => ({
  ...p,
  no: i + 1
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
   write
========================= */
fs.writeFileSync(outputPath, output, "utf8");

/* =========================
   done
========================= */
console.log("✅ build 완료");
console.log("👥 people :", people.length);
console.log("📄 output :", outputPath);