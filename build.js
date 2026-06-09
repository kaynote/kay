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

    // 확장자 제거
    .replace(/\.(jpg|jpeg|png|webp)$/i, "")

    // _, -, . → 공백
    .replace(/[_\-.]+/g, " ")

    // 특수문자 제거
    .replace(/[^a-z0-9가-힣\s]/g, "")

    // 공백 정리
    .replace(/\s+/g, " ")
    .trim();
}

/* =========================
   read names
========================= */
const raw = fs.readFileSync(txtPath, "utf8");

const lines = raw
  .split(/\r?\n/)
  .map(v => v.trim())
  .filter(Boolean);

/* =========================
   read images
========================= */
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

  const key = normalize(file);

  if (imageMap.has(key)) {

    console.log("");
    console.log("⚠️ 중복 key 발견");
    console.log("key =", key);
    console.log("old =", imageMap.get(key));
    console.log("new =", file);
  }

  imageMap.set(key, file);

  console.log("🖼️", file, "→", key);
}

/* =========================
   build people
========================= */
const people = lines.map(line => {

  /* 번호 제거 */
  line = line.replace(/^\d+\.\s*/, "");

  /* note 추출 */
  const noteMatch = line.match(/\((.*?)\)/);

  const note = noteMatch
    ? noteMatch[1].trim()
    : "";

  /* 괄호 제거 */
  const cleanLine = line
    .replace(/\(.*?\)/, "")
    .trim();

  /* 이름 / 한글 분리 */
  const parts = cleanLine.split(/\s+/);

  const koStartIndex = parts.findIndex(p =>
    /[가-힣]/.test(p)
  );

  let name = "";
  let ko = "";

  if (koStartIndex === -1) {

    name = cleanLine;

  } else {

    name = parts
      .slice(0, koStartIndex)
      .join(" ")
      .trim();

    ko = parts
      .slice(koStartIndex)
      .join(" ")
      .trim();
  }

  /* 화면 표시용 이름 */
  const displayName = ko
    ? `${name}\n${ko}`
    : name;

  /* 파일명 기반 매칭 */
  const key = normalize(name);

  const matchedImage = imageMap.get(key) || null;

  /* debug */
  if (matchedImage) {

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
   output
========================= */
const output =
  "// Auto-generated from names.txt\n\n" +
  "const people = " +
  JSON.stringify(people, null, 2) +
  ";\n\n" +
  "export default people;\n";

/* =========================
   write file
========================= */
fs.writeFileSync(
  outputPath,
  output,
  "utf8"
);

/* =========================
   done
========================= */
console.log("");
console.log("✅ build 완료");
console.log("👥 people :", people.length);
console.log("🖼️ images :", imageFiles.length);
console.log("📄 output :", outputPath);