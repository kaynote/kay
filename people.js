const people = [

{
    name: "Adeline Orabao 아델린 오라바오",
    image: "images/adeline_orabao.jpg",
    meta: "프린세스의 엄마",
    desc: `정주행 2021.11.10 가정방문 2부 23:42`,
    tags: ["엄마", "가정방문"]
},

{
    name: "Aeshee Cartagena Lozano 에이시 카르타헤나 로자노",
    image: "images/aeshee_cartagena_lozano.jpg",
    meta: "크라잉 에이시",
    desc: `정주행 2025.11.21 22:49`,
    tags: ["안경", "별명"]
},

{
    name: "Akisha 아키샤",
    image: "images/akisha.jpg",
    meta: "샨샨",
    desc: `세 자매 중 둘째 여자아이`,
    tags: ["댄스", "자매"]
}

];

const container = document.getElementById("peopleContainer");

function renderPeople(list){

    container.innerHTML = "";

    list.forEach((person, index) => {

        const card = document.createElement("div");
        card.className = "card";

        const tagsHTML = person.tags
            .map(tag => `<span class="tag">${tag}</span>`)
            .join("");

        card.innerHTML = `
            <img class="photo" src="${person.image}">

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
