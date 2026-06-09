const fs = require("fs");

// 안전한 문자열 정리 함수
function cleanText(text) {
    return text
        .replace(/\.[^/.]+$/, "")        // 확장자 제거
        .replace(/^\d+\.\s*/, "")        // 앞 숫자 제거
        .replace(/\s+/g, " ")            // 공백 정리
        .replace(/[<>:"/\\|?*]/g, "_")   // 파일/브라우저 위험 문자 제거
        .trim();
}

// 파일 읽기
const files = fs.readFileSync("names.txt", "utf-8")
    .split("\n")
    .map(v => v.trim())
    .filter(Boolean);

const people = files.map(file => {
    const base = file.replace(/\.[^/.]+$/, "");
    const noNumber = base.replace(/^\d+\.\s*/, "");

    const name = noNumber.replace(/_/g, " ");
    const cleanFile = cleanText(file);

    return {
        name: name,
        image: `images/${cleanFile}`,
        meta: "",
        desc: "",
        tags: []
    };
});

// JSON 안전 출력 (JS 파일 형태 유지)
const output = `const people = ${JSON.stringify(people, null, 2)};\n`;

fs.writeFileSync("people.js", output, "utf-8");

console.log("✅ people.js 생성 완료 (안전 버전)");