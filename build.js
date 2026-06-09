const fs = require("fs");

const files = fs.readFileSync("names.txt", "utf-8")
    .split("\n")
    .map(v => v.trim())
    .filter(v => v);

const people = files.map(file => {

    // 확장자 제거
    const base = file.replace(/\.[^/.]+$/, "");

    // 앞 숫자 "4. " 제거
    const noNumber = base.replace(/^\d+\.\s*/, "");

    // 언더바 → 공백
    const name = noNumber.replace(/_/g, " ");

    // 🔥 이미지 파일명도 동일하게 정리
    const cleanFile = file.replace(/^\d+\.\s*/, "");

    return {
        name: name,
        image: `images/${cleanFile}`,
        meta: "",
        desc: "",
        tags: []
    };
});

fs.writeFileSync(
    "people.js",
    "const people = " + JSON.stringify(people, null, 2),
    "utf-8"
);

console.log("people.js 생성 완료");