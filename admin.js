import { login, logout, watchAuth } from "./firebase.js";

/*
 * 관리자 UID
 * 현재 index.html에서 사용 중인 관리자 계정과 동일하게 사용합니다.
 *
 * 중요:
 * 이 값은 관리자 화면을 보여줄지 결정하는 용도입니다.
 * 실제 Firebase 데이터 쓰기 권한은 나중에 Security Rules에서도 반드시 제한합니다.
 */
const ADMIN_UID = "8OEfoiQCXDdIodCjbyXP0ZNints1";

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

function hideAllPanels() {
    loadingPanel.classList.add("hidden");
    loginPanel.classList.add("hidden");
    deniedPanel.classList.add("hidden");
    adminPanel.classList.add("hidden");
}

function showLoginError(message) {
    loginError.textContent = message;
    loginError.classList.remove("hidden");
}

loginBtn.addEventListener("click", async () => {
    loginError.classList.add("hidden");
    loginBtn.disabled = true;
    loginBtn.textContent = "로그인 중...";

    try {
        await login();
    } catch (error) {
        console.error("관리자 로그인 오류:", error);

        let message = "로그인에 실패했습니다.";

        if (error?.code === "auth/popup-closed-by-user") {
            message = "로그인 창이 닫혔습니다.";
        } else if (error?.code === "auth/popup-blocked") {
            message = "브라우저에서 팝업이 차단되었습니다. 팝업을 허용한 뒤 다시 시도하세요.";
        }

        showLoginError(message);
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = "Google 계정으로 로그인";
    }
});

async function doLogout() {
    try {
        await logout();
    } catch (error) {
        console.error("로그아웃 오류:", error);
        alert("로그아웃 중 문제가 발생했습니다.");
    }
}

logoutBtn.addEventListener("click", doLogout);
deniedLogoutBtn.addEventListener("click", doLogout);

watchAuth((user) => {
    hideAllPanels();

    if (!user) {
        loginPanel.classList.remove("hidden");
        return;
    }

    if (user.uid !== ADMIN_UID) {
        deniedPanel.classList.remove("hidden");

        deniedUser.textContent =
            user.email
                ? `현재 로그인 계정: ${user.email}`
                : "현재 로그인한 계정에는 관리자 권한이 없습니다.";

        return;
    }

    adminPanel.classList.remove("hidden");

    const displayName = user.name || user.email || "관리자";
    adminUser.textContent =
        `${displayName}님, 관리자 계정으로 로그인되어 있습니다.`;

    console.log("관리자 인증 성공:", user.uid);
});

loadingPanel.classList.remove("hidden");
