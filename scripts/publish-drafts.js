const { initializeApp, cert } =
  require("firebase-admin/app");

const { getFirestore } =
  require("firebase-admin/firestore");

const serviceAccount =
  JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT
  );

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

function cleanValue(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return value;
}

function normalizeGallery(gallery) {
  if (!Array.isArray(gallery)) {
    return [];
  }

  return gallery.map(item => ({
    image: cleanValue(item.image),
    caption: cleanValue(item.caption)
  }));
}

async function main() {

  console.log("Firestore Draft를 불러오는 중...");

  const snapshot =
    await db
      .collection("drafts")
      .get();

  console.log(
    `Draft ${snapshot.size}개를 불러왔습니다.`
  );

  const people =
    snapshot.docs
      .map(doc => {

        const data =
          doc.data();

        return {
          no: Number(data.sourceNo),
          name: cleanValue(data.name),
          ko: cleanValue(data.ko),
          displayName:
            cleanValue(data.displayName),
          note: cleanValue(data.note),
          image: cleanValue(data.image),
          gallery:
            normalizeGallery(data.gallery)
        };

      })
      .filter(person =>
        Number.isFinite(person.no)
      )
      .sort((a, b) =>
        a.no - b.no
      );

  console.log(
    `정렬 완료: ${people.length}명`
  );

  if (people.length === 0) {
    throw new Error(
      "Draft 데이터가 없습니다."
    );
  }

  const expectedCount = 302;

  if (people.length !== expectedCount) {
    throw new Error(
      `예상 인원 ${expectedCount}명과 실제 Draft ${people.length}명이 다릅니다. 게시를 중단합니다.`
    );
  }

  const numbers =
    people.map(person => person.no);

  const uniqueNumbers =
    new Set(numbers);

  if (
    uniqueNumbers.size !==
    people.length
  ) {
    throw new Error(
      "중복된 번호가 발견되었습니다. 게시를 중단합니다."
    );
  }

  const peopleJs =
`const people = ${JSON.stringify(
  people,
  null,
  2
)};

export default people;
`;

  const fs =
    require("fs");

  fs.writeFileSync(
    "people.js",
    peopleJs,
    "utf8"
  );

  console.log(
    "people.js 생성 완료"
  );

  console.log(
    `총 ${people.length}명`
  );
}

main().catch(error => {

  console.error(
    "게시 실패:"
  );

  console.error(error);

  process.exit(1);
});
