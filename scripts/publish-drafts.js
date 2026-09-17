const { initializeApp, cert } =
  require("firebase-admin/app");

const { getFirestore } =
  require("firebase-admin/firestore");

const fs =
  require("fs");

const vm =
  require("vm");


/* =========================
   Firebase Admin
========================= */

const serviceAccount =
  JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT
  );

initializeApp({
  credential: cert(serviceAccount)
});

const db =
  getFirestore();


/* =========================
   게시할 번호
========================= */

const sourceNo =
  Number(
    process.env.SOURCE_NO
  );


if (!Number.isInteger(sourceNo)) {

  throw new Error(
    "게시할 번호(SOURCE_NO)가 지정되지 않았습니다."
  );

}


/* =========================
   값 정리
========================= */

function cleanValue(value) {

  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return value;

}


function normalizeGallery(gallery) {

  if (!Array.isArray(gallery)) {
    return [];
  }

  return gallery.map(item => ({

    image:
      cleanValue(item.image),

    caption:
      cleanValue(item.caption)

  }));

}


/* =========================
   현재 people.js 읽기
========================= */

function loadPeople() {

  console.log(
    "현재 people.js를 불러오는 중..."
  );


  let source =
    fs.readFileSync(
      "people.js",
      "utf8"
    );


  /*
    export default people;
    부분을 제거한 뒤
    Node.js VM에서 people 배열을 읽습니다.
  */

  source =
    source.replace(
      /export\s+default\s+people\s*;?\s*$/,
      ""
    );


  const context = {};


  vm.runInNewContext(
    `${source}\nresult = people;`,
    context
  );


  if (
    !Array.isArray(context.result)
  ) {

    throw new Error(
      "people.js에서 people 배열을 읽을 수 없습니다."
    );

  }


  return context.result;

}


/* =========================
   Draft에서 한 사람 가져오기
========================= */

async function loadDraft(no) {

  console.log(
    `Firestore Draft ${no}번을 불러오는 중...`
  );


  const draftRef =
    db
      .collection("drafts")
      .doc(String(no));


  const snapshot =
    await draftRef.get();


  if (!snapshot.exists) {

    throw new Error(
      `${no}번 Draft가 존재하지 않습니다.`
    );

  }


  const data =
    snapshot.data();


  const draft = {

    no:
      Number(data.sourceNo),

    name:
      cleanValue(data.name),

    ko:
      cleanValue(data.ko),

    displayName:
      cleanValue(data.displayName),

    note:
      cleanValue(data.note),

    image:
      cleanValue(data.image),

    gallery:
      normalizeGallery(data.gallery)

  };


  if (
    draft.no !== no
  ) {

    throw new Error(
      `Draft ${no}번의 sourceNo가 올바르지 않습니다.`
    );

  }


  return draft;

}


/* =========================
   실행
========================= */

async function main() {

  console.log(
    `========== ${sourceNo}번 게시 시작 ==========`
  );


  /* 현재 공개 데이터 */

  const people =
    loadPeople();


  console.log(
    `현재 공개 데이터: ${people.length}명`
  );


  /* 게시할 Draft */

  const draft =
    await loadDraft(
      sourceNo
    );


  /* 해당 번호 찾기 */

  const index =
    people.findIndex(
      (person, index) => {

        const no =
          Number(
            person.no ??
            index + 1
          );

        return no === sourceNo;

      }
    );


  if (index === -1) {

    throw new Error(
      `${sourceNo}번 데이터를 people.js에서 찾을 수 없습니다.`
    );

  }


  /* 기존 데이터 백업 */

  const oldPerson =
    people[index];


  console.log(
    `${sourceNo}번 데이터를 교체합니다.`
  );


  /* 해당 번호만 교체 */

  people[index] =
    draft;


  /* 다시 번호순 정렬 */

  people.sort(
    (a, b) =>
      Number(a.no) -
      Number(b.no)
  );


  /* people.js 생성 */

  const peopleJs =
`// Auto-generated from Firestore Drafts

const people = ${JSON.stringify(
  people,
  null,
  2
)};

export default people;
`;


  fs.writeFileSync(
    "people.js",
    peopleJs,
    "utf8"
  );


  console.log(
    `${sourceNo}번 게시 완료`
  );


  console.log(
    "변경된 데이터:"
  );

  console.log(
    JSON.stringify(
      draft,
      null,
      2
    )
  );


  console.log(
    `========== ${sourceNo}번 게시 완료 ==========`
  );

}


main().catch(error => {

  console.error(
    "게시 실패:"
  );

  console.error(error);

  process.exit(1);

});