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
   timestamp checker
========================= */
function isDate(str) {
  return /\d{4}\.\d{2}\.\d{2}/.test(str);
}

function isTime(str) {
  return /\d{1,2}:\d{2}(:\d{2})?/.test(str);
}

function isTimeLine(str) {
  return isDate(str) || isTime(str) || /정주행/.test(str);
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

  imageMap.set(key, file);

  console.log("🖼️", file, "→", key);
}

/* =========================
   build people
========================= */
let people = lines.map(line => {

  /* 번호 제거 */
  line = line.replace(/^\d+\.\s*/, "");

  /* 괄호 note */
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
  const displayName = ko ? visibleName + "\n" + ko : visibleName;

  /* =========================
     image match
  ========================= */
  const key = normalize(name);
  let matchedImage = imageMap.get(key) || "no-image.jpg";

  /* =========================
     TIMELINE PARSE
  ========================= */
  let timeline = [];

  const rest = cleanLine.replace(name, "").trim();

  if (rest) {

    // 문장 단위 or 날짜 기준 분리
    const items = rest
      .split(/(?=\d{4}\.\d{2}\.\d{2})|\s{2,}|(?=정주행)/g)
      .map(v => v.trim())
      .filter(Boolean);

    for (const item of items) {

      if (isTimeLine(item)) {
        timeline.push({
          type: "time",
          text: item
        });
      } else {
        timeline.push({
          type: "text",
          text: item
        });
      }
    }
  }

  return {
    name,
    ko,
    displayName,
    note,
    image: matchedImage,
    timeline
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
  console.log("💾 backup 생성");
}

/* =========================
   write
========================= */
fs.writeFileSync(outputPath, output, "utf8");

console.log("");
console.log("✅ build 완료");
console.log("👥 people :", people.length);
console.log("🖼️ images :", imageFiles.length);
console.log("📄 output :", outputPath);