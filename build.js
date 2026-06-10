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

  if (normalize(file) === "no image") {
    continue;
  }

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
const people = lines.map(line => {

  /* 번호 제거
     ex) 1. Maria Santos
  */
  line = line.replace(/^\d+\.\s*/, "");

  /* note 추출
     ex) (VIP)
  */
  const noteMatch = line.match(/\((.*?)\)/);

  const note = noteMatch
    ? noteMatch[1].trim()
    : "";

  /* note 제거 */
  const cleanLine = line
    .replace(/\(.*?\)/, "")
    .trim();

  /* 영어 / 한글 분리 */
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

  /* 표시용 이름 */
  const visibleName =
    name.replace(/[_-]\d+$/, "");

  const displayName = ko
    ? visibleName + "\n" + ko
    : visibleName;

  /* 이미지 매칭 */
  const key = normalize(name);

  let matchedImage = imageMap.get(key);   

  if (!matchedImage) {
    matchedImage = "no-image.jpg";
  }

  /* 로그 */
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
    note,
    image: matchedImage
  };

});

/* =========================
   sort alphabetically
========================= */
people.sort((a, b) =>
  a.name.localeCompare(b.name, "en", {
    sensitivity: "base"
  })
);

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

  const backupPath =
    outputPath + ".backup";

  fs.copyFileSync(
    outputPath,
    backupPath
  );

  console.log("");
  console.log("💾 backup 생성");
  console.log("📄", backupPath);
}

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