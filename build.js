const fs = require("fs");
const path = require("path");

const txtPath = path.join(__dirname, "names.txt");
const imagesDir = path.join(__dirname, "images");
const outputPath = path.join(__dirname, "people.js");

const raw = fs.readFileSync(txtPath, "utf-8");

const images = fs.readdirSync(imagesDir)
  .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));

// 핵심: 줄 단위 파싱
const lines = raw
  .split(/\r?\n/)
  .map(l => l.trim())
  .filter(Boolean);

const people = lines.map((line, i) => {
  // 1. 앞 번호 제거
  line = line.replace(/^\d+\.\s*/, "");

  // 2. 괄호 내용 추출
  const match = line.match(/\((.*?)\)/);
  const note = match ? match[1] : "";

  // 3. 괄호 제거
  const withoutParen = line.replace(/\(.*?\)/, "").trim();

  // 4. 이름 분리 (영문 + 한글 가정)
  const parts = withoutParen.split(" ");

  // 마지막 한글 묶음 처리 (간단 버전)
  const koStartIndex = parts.findIndex(p => /[가-힣]/.test(p));

  const name = parts.slice(0, koStartIndex).join(" ");
  const ko = parts.slice(koStartIndex).join(" ");

  return {
    name,
    ko,
    note,
    image: images[i] ? `images/${images[i]}` : null
  };
});

const output = `
// Auto-generated from names.txt
const people = ${JSON.stringify(people, null, 2)};
export default people;
`;

fs.writeFileSync(outputPath, output, "utf-8");

console.log("✅ txt → people.js 변환 완료");