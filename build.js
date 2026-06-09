const fs = require("fs");

const files = fs.readFileSync("names.txt", "utf-8")
    .split("\n")
    .map(v => v.trim())
    .filter(v => v);

const people = files.map(file => {
    const base = file.replace(/\.[^/.]+$/, "");

    // 이름 자동 변환 (언더바 → 공백)
    const name = base.replace(/_/g, " ");

    return {
        name: name,
        image: `images/${file}`,
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