* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: #f5f6f8;
  color: #222;
  font-family: Arial, "Noto Sans KR", sans-serif;
}

/* 공통 */
.hidden {
  display: none !important;
}

/* 상단 헤더 */
.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;

  padding: 24px 32px;

  background: #fff;
  border-bottom: 1px solid #ddd;
}

.admin-header h1 {
  margin: 0 0 5px;
  font-size: 24px;
}

.admin-header p {
  margin: 0;
  color: #777;
}

/* 일반 사이트로 이동 */
.site-link {
  color: #333;
  text-decoration: none;

  padding: 10px 14px;

  border: 1px solid #ccc;
  border-radius: 8px;

  background: #fff;
}

.site-link:hover {
  background: #f0f0f0;
}

/* 관리자 메인 영역 */
.admin-main {
  width: min(1600px, calc(100% - 32px));
  margin: 24px auto 60px;
}

/* 카드 / 패널 */
.panel {
  margin-bottom: 20px;
  padding: 24px;

  background: #fff;
  border: 1px solid #ddd;
  border-radius: 12px;
}

/* 제목 영역 */
.admin-title-row,
.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

h2,
h3 {
  margin-top: 0;
}

/* 계정 정보 */
.account {
  color: #666;
}

/* 설명 문구 */
.muted {
  margin-bottom: 0;
  color: #777;
  line-height: 1.5;
}

/* 버튼 기본 */
button {
  padding: 9px 13px;

  border: 1px solid #ccc;
  border-radius: 7px;

  background: #fff;
  color: #222;

  cursor: pointer;
}

/* 버튼 마우스 오버 */
button:hover:not(:disabled) {
  background: #f0f0f0;
}

/* 비활성화 버튼 */
button:disabled {
  opacity: 0.55;
  cursor: default;
}

/* 로그인 등 주요 버튼 */
button.primary {
  background: #222;
  color: #fff;
  border-color: #222;
}

button.primary:hover:not(:disabled) {
  background: #000;
}

/* 로그인 오류 */
.error {
  margin-top: 15px;
  color: #c62828;
}

/* 인원 수 표시 */
.count-badge {
  padding: 7px 12px;

  border-radius: 20px;

  background: #eee;

  white-space: nowrap;
}

/* 상태 메시지 */
.status {
  margin: 18px 0;
  padding: 12px 14px;

  border-radius: 8px;

  line-height: 1.5;
}

/* 상태 - 기본 */
.status.info {
  background: #f0f0f0;
}

/* 상태 - 성공 */
.status.success {
  background: #e8f5e9;
}

/* 상태 - 오류 */
.status.error {
  background: #ffebee;
  color: #b71c1c;
}

/* 테이블 바깥 영역 */
.table-wrap {
  overflow-x: auto;

  margin-top: 20px;

  border: 1px solid #ddd;
  border-radius: 8px;
}

/* 인물 목록 테이블 */
table {
  width: 100%;
  min-width: 1200px;

  border-collapse: collapse;
}

/* 테이블 셀 */
th,
td {
  padding: 12px 10px;

  text-align: left;
  vertical-align: top;

  border-bottom: 1px solid #eee;
}

/* 테이블 제목 */
th {
  background: #f7f7f7;
  white-space: nowrap;
}

/* 행에 마우스를 올렸을 때 */
tbody tr:hover {
  background: #fafafa;
}

/* 인물 이름 */
.name-cell {
  font-weight: 600;
  white-space: nowrap;
}

/* 설명 */
.note-cell {
  min-width: 380px;
  max-width: 600px;

  line-height: 1.5;
}

/* 관리 버튼 영역 */
.action-cell {
  white-space: nowrap;
}

/* Draft 버튼 */
.draft-btn {
  font-size: 13px;
}


/* ========================================
   모바일 화면
   ======================================== */

@media (max-width: 700px) {

  /* 상단 헤더 */
  .admin-header {
    padding: 18px;

    align-items: flex-start;
    flex-direction: column;
  }

  /* 메인 영역 */
  .admin-main {
    width: calc(100% - 20px);
    margin-top: 10px;
  }

  /* 패널 */
  .panel {
    padding: 16px;
  }

  /* 제목 영역 */
  .admin-title-row,
  .section-title-row {
    align-items: flex-start;
    flex-direction: column;
  }
}