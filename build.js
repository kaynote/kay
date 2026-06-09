const fs = require("fs");
const path = require("path");

/* =========================
   paths
========================= */
const txtPath = path.join(__dirname, "names.txt");
const imagesDir = path.join(__dirname, "images");
const outputPath = path.join(__dirname, "people.js");

/* =========================
   normalize (핵심)
========================= */
function normalize(str) {
  return str
    .toLowerCase()
    .replace(/\.[^/.]+$/, "")       // 확장자 제거
    .replace(/[_\-]/g, " ")         // _ - → 공백
    .replace(/[^a-z0-9가-힣\s]/g, "") // 특수문자 제거
    .replace(/\s+/g, " ")           // 공백 정리
    .trim();
}

/* =========================
   read files
========================= */
const raw = fs.readFileSync(txtPath, "utf-8");

const images = fs.readdirSync(imagesDir)
  .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));

/* =========================
   image map (파일명 → 실제파일)
========================= */
const imageMap = new Map();

for (const img of images) {
  imageMap.set(normalize(img), img);
}

/* =========================
   parse lines
========================= */
const lines = raw
  .split(/\r?\n/)
  .map(l => l.trim())
  .filter(Boolean);

/* =========================
   build people array
========================= */
const people = lines.map(line => {

  // 1. 번호 제거
  line = line.replace(/^\d+\.\s*/, "");

  // 2. note 추출
  const match = line.match(/\((.*?)\)/);
  const note = match ? match[1] : "";

  // 3. 괄호 제거
  const withoutParen = line.replace(/\(.*?\)/, "").trim();

  // 4. 이름 분리
  const parts = withoutParen.split(" ");
  const koStartIndex = parts.findIndex(p => /[가-힣]/.test(p));

  const name = parts.slice(0, koStartIndex).join(" ").trim();
  const ko = parts.slice(koStartIndex).join(" ").trim();

  /* =========================
     🔥 핵심 매칭 로직
  ========================= */
  const key = normalize(name);
  const matchedImage = imageMap.get(key);

  return {
    name,
    ko,
    note,
    image: matchedImage || null
  };
});

/* =========================
   write output
========================= */
const output = `
// Auto-generated from names.txt
const people = ${JSON.stringify(people, null, 2)};
export default people;
`;

fs.writeFileSync(outputPath, output, "utf-8");

console.log("✅ build 완료 (파일명 fuzzy 매칭 방식)");