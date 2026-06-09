const fs = require("fs");
const path = require("path");

const txtPath = path.join(__dirname, "names.txt");
const imagesDir = path.join(__dirname, "images");
const outputPath = path.join(__dirname, "people.js");

const raw = fs.readFileSync(txtPath, "utf-8");

// 이미지 목록
const images = fs.readdirSync(imagesDir)
  .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));

// 🔥 파일명 정규화 함수 (핵심)
function normalize(str) {
  return str
    .toLowerCase()
    .replace(/\.[^/.]+$/, "")     // 확장자 제거
    .replace(/[_\-]/g, " ")       // _ - → 공백
    .replace(/\s+/g, " ")         // 중복 공백 제거
    .trim();
}

// 이미지 lookup map 생성
const imageMap = new Map();

for (const img of images) {
  const key = normalize(img);
  imageMap.set(key, img);
}

// 줄 파싱
const lines = raw
  .split(/\r?\n/)
  .map(l => l.trim())
  .filter(Boolean);

const people = lines.map(line => {
  // 1. 번호 제거
  line = line.replace(/^\d+\.\s*/, "");

  // 2. 괄호 note 추출
  const match = line.match(/\((.*?)\)/);
  const note = match ? match[1] : "";

  // 3. 괄호 제거
  const withoutParen = line.replace(/\(.*?\)/, "").trim();

  // 4. 이름 split
  const parts = withoutParen.split(" ");
  const koStartIndex = parts.findIndex(p => /[가-힣]/.test(p));

  const name = parts.slice(0, koStartIndex).join(" ").trim();
  const ko = parts.slice(koStartIndex).join(" ").trim();

  // 🔥 핵심: 이름 기반으로 이미지 찾기
  const key = normalize(name);
  const matchedImage = imageMap.get(key);

  return {
    name,
    ko,
    note,
    image: matchedImage ? `images/${matchedImage}` : null
  };
});

const output = `
// Auto-generated from names.txt
const people = ${JSON.stringify(people, null, 2)};
export default people;
`;

fs.writeFileSync(outputPath, output, "utf-8");

console.log("✅ txt → people.js 변환 완료 (파일명 기반 매칭)");