import { login, logout, watchAuth, db } from "./firebase.js";
import people from "./people.js?v=302";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const ADMIN_EMAIL = "ektjttnfp5@gmail.com";
const loadingPanel = document.getElementById("loadingPanel");
const loginPanel = document.getElementById("loginPanel");
const deniedPanel = document.getElementById("deniedPanel");
const adminPanel = document.getElementById("adminPanel");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const deniedLogoutBtn = document.getElementById("deniedLogoutBtn");
const loginError = document.getElementById("loginError");
const adminUser = document.getElementById("adminUser");
const deniedUser = document.getElementById("deniedUser");
const postList = document.getElementById("postList");
const postCount = document.getElementById("postCount");
const statusMessage = document.getElementById("statusMessage");

function hideAllPanels() {
  loadingPanel.classList.add("hidden"); loginPanel.classList.add("hidden");
  deniedPanel.classList.add("hidden"); adminPanel.classList.add("hidden");
}
function showLoginError(message) { loginError.textContent = message; loginError.classList.remove("hidden"); }
function showStatus(message, type="info") { statusMessage.textContent=message; statusMessage.className=`status ${type}`; statusMessage.classList.remove("hidden"); }
function escapeHtml(value) { return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }

function renderPosts(list) {
  postList.innerHTML = "";
  postCount.textContent = `${list.length}개`;
  list.forEach((person, index) => {
    const tr = document.createElement("tr");
    const no=person.no ?? index+1, name=person.name||"", ko=person.ko||"", displayName=person.displayName||"", note=person.note||"", image=person.image||"no-image.jpg";
    tr.innerHTML=`<td>${escapeHtml(no)}</td><td class="name-cell">${escapeHtml(name)}</td><td>${escapeHtml(ko)}</td><td>${escapeHtml(displayName)}</td><td class="note-cell">${escapeHtml(note)}</td><td>${escapeHtml(image)}</td><td class="action-cell"><button class="draft-btn" data-no="${escapeHtml(no)}">Draft로 복사</button></td>`;
    postList.appendChild(tr);
  });
  postList.querySelectorAll(".draft-btn").forEach(button=>button.addEventListener("click",()=>{
    const person=list.find(item=>Number(item.no)===Number(button.dataset.no));
    if(!person){showStatus("해당 인물을 찾을 수 없습니다.","error");return;}
    copyToDraft(person,button);
  }));
}

async function copyToDraft(person, button) {
  const draftId=String(person.no); button.disabled=true; button.textContent="복사 중...";
  try {
    const draftRef=doc(db,"drafts",draftId); const existing=await getDoc(draftRef);
    if(existing.exists() && !confirm(`"${person.name}"의 Draft가 이미 있습니다. 기존 Draft를 원본 데이터로 다시 덮어쓸까요?`)) { button.disabled=false; button.textContent="Draft로 복사"; return; }
    await setDoc(draftRef,{sourceNo:person.no,name:person.name||"",ko:person.ko||"",displayName:person.displayName||"",note:person.note||"",image:person.image||"no-image.jpg",status:"draft",updatedAt:new Date().toISOString()});
    showStatus(`"${person.name}"을(를) Draft로 복사했습니다. 공개 사이트의 원본은 변경하지 않았습니다.`,'success'); button.textContent="Draft 완료";
  } catch(error) {
    console.error("Draft 복사 오류:",error);
    showStatus(error?.code==="permission-denied"?"Firebase에서 Draft 쓰기 권한이 거부되었습니다. Firestore Security Rules 설정이 필요합니다.":`Draft 복사에 실패했습니다: ${error.message}`,"error");
    button.disabled=false; button.textContent="Draft로 복사";
  }
}

loginBtn.addEventListener("click",async()=>{ loginError.classList.add("hidden"); loginBtn.disabled=true; loginBtn.textContent="로그인 중..."; try{await login();}catch(error){console.error(error); let message="로그인에 실패했습니다."; if(error?.code==="auth/popup-closed-by-user")message="로그인 창이 닫혔습니다."; else if(error?.code==="auth/popup-blocked")message="브라우저에서 팝업이 차단되었습니다. 팝업을 허용한 뒤 다시 시도하세요."; showLoginError(message);}finally{loginBtn.disabled=false;loginBtn.textContent="Google 계정으로 로그인";} });
async function doLogout(){try{await logout();}catch(error){console.error(error);alert("로그아웃 중 문제가 발생했습니다.");}}
logoutBtn.addEventListener("click",doLogout); deniedLogoutBtn.addEventListener("click",doLogout);
watchAuth(user=>{
  hideAllPanels();
  if(!user){loginPanel.classList.remove("hidden");return;}
  const email=(user.email||"").trim().toLowerCase();
  if(email!==ADMIN_EMAIL.toLowerCase()){deniedPanel.classList.remove("hidden");deniedUser.textContent=user.email?`현재 로그인 계정: ${user.email}`:"현재 로그인한 계정에는 관리자 권한이 없습니다.";return;}
  adminPanel.classList.remove("hidden"); adminUser.textContent=`${user.displayName||user.email||"관리자"}님, 관리자 계정으로 로그인되어 있습니다.`;
  const peopleList=Array.isArray(people)?people:[]; renderPosts(peopleList);
  console.log(`관리자 인증 성공: ${user.uid}`); console.log(`people.js 로드 완료: ${peopleList.length}명`);
});
loadingPanel.classList.remove("hidden");
