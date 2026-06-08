const people = [

{
    name: "Adeline Orabao 아델린 오라바오",
    image: "",
    meta: "프린세스의 엄마",
    desc: `
'Adeline'은 ‘고귀한’이라는 의미를 가진 이름.
정주행 2021.11.10 가정방문 2부 23:42
`,
    tags: ["엄마", "가정방문"]
},

{
    name: "Aeshee Cartagena Lozano 에이시 카르타헤나 로자노",
    image: "",
    meta: "크라잉 에이시",
    desc: `
안경 큰 거 쓴 애.
정주행 2025.11.21 22:49
`,
    tags: ["별명", "안경"]
},

{
    name: "Akisha 아키샤",
    image: "",
    meta: "샨샨",
    desc: `
세 자매 중 둘째 여자아이.
크리스마스 댄스 경연대회 참가.
`,
    tags: ["댄스", "자매"]
},

{
    name: "Alex 알렉스",
    image: "",
    meta: "PWD 장애인",
    desc: `
간식 나눔 및 피딩 프로그램 도우미.
2025.01.05 57:14
`,
    tags: ["도우미", "PWD"]
},

{
    name: "Alexa Mae 알렉사 미",
    image: "",
    meta: "크리스틴 케이트의 여동생",
    desc: `
2024년 크리스마스 댄스 경연대회 1등 수상.
`,
    tags: ["댄스", "수상"]
},

];

const container = document.getElementById("peopleContainer");

function renderPeople(list){

    container.innerHTML = "";

    list.forEach((person, index) => {

        const card = document.createElement("div");

        card.className = "card";

        const imageHTML = person.image
            ? `<img class="photo" src="${person.image}">`
            : `<div class="photo"></div>`;

        const tagsHTML = person.tags
            .map(tag => `<span class="tag">${tag}</span>`)
            .join("");

        card.innerHTML = `

            ${imageHTML}

            <div class="info">

                <div class="name">
                    ${index + 1}. ${person.name}
                </div>

                <div class="meta">
                    ${person.meta}
                </div>

                <div class="desc">
                    ${person.desc}
                </div>

                <div>
                    ${tagsHTML}
                </div>

            </div>
        `;

        container.appendChild(card);
    });
}

renderPeople(people);

document
.getElementById("searchBox")
.addEventListener("input", function(){

    const keyword = this.value.toLowerCase();

    const filtered = people.filter(person => {

        return (

            person.name.toLowerCase().includes(keyword) ||

            person.meta.toLowerCase().includes(keyword) ||

            person.desc.toLowerCase().includes(keyword) ||

            person.tags.join(" ").toLowerCase().includes(keyword)
        );
    });

    renderPeople(filtered);
});
