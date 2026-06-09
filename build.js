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
   🔥 언더바(_), 점(.), 대시(-) 전부 처리
========================= */
function normalize(str) {
  return str
    .normalize("NFKC")                 // 유니코드 정규화
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
   read files
========================= */
const raw = fs.readFileSync(txtPath, "utf-8");

const images = fs.readdirSync(imagesDir)
  .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));

console.log("📂 images 폴더 파일 수:", images.length);

/* =========================
   image map
========================= */
const imageMap = new Map();

for (const img of images) {

  const normalized = normalize(img);

  imageMap.set(normalized, img);

  // 디버그 출력
  console.log("🖼️ image:");
  console.log("   원본 =", img);
  console.log("   key  =", normalized);
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

  // 번호 제거
  line = line.replace(/^\d+\.\s*/, "");

  // note 추출
  const match = line.match(/\((.*?)\)/);
  const note = match ? match[1] : "";

  // 괄호 제거
  const withoutParen = line
    .replace(/\(.*?\)/, "")
    .trim();

  // 이름 분리
  const parts = withoutParen.split(/\s+/);

  // 한글 시작 위치
  const koStartIndex = parts.findIndex(p => /[가-힣]/.test(p));

  let name = "";
  let ko = "";

  /* =========================
     이름 처리
  ========================= */

  // 한글 이름이 없는 경우
  if (koStartIndex === -1) {

    name = withoutParen;
    ko = "";

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

  /* =========================
     image matching
  ========================= */

  const key = normalize(name);

  let matchedImage = imageMap.get(key);

  /* =========================
     🔥 fallback fuzzy search
     일부 이름 차이 허용
  ========================= */
  if (!matchedImage) {

    for (const [imgKey, imgFile] of imageMap.entries()) {

      // 포함 관계 허용
      if (
        imgKey.includes(key) ||
        key.includes(imgKey)
      ) {
        matchedImage = imgFile;
        break;
      }
    }
  }

  /* =========================
     debug
  ========================= */
  if (!matchedImage) {

    console.log("❌ 이미지 없음");
    console.log("   name =", name);
    console.log("   key  =", key);

  } else {

    console.log("✅ 매칭 성공");
    console.log("   name =", name);
    console.log("   file =", matchedImage);
  }

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

/* =========================
   done
========================= */
console.log("");
console.log("✅ build 완료");
console.log(`👥 people 수 : ${people.length}`);
console.log(`🖼️ image 수  : ${images.length}`);
console.log(`📄 output     : people.js`);