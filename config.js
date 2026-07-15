// 공용 상수: 열 규격과 AI 서버 함수 주소

// 테스트케이스 표의 10개 열
const COLUMNS = [
  "TC ID", "대분류", "중분류",
  "테스트 시나리오", "사전조건", "테스트 절차",
  "기대 결과", "우선순위", "결과", "비고",
];

// TC ID는 우리가 매기고, 결과/비고는 사람이 적는다 → AI가 채울 열만 추린다
const AI_COLUMNS = COLUMNS.slice(1, -2);

// functions/gemini.js가 만드는 서버 함수 주소 (키는 서버에만 둔다)
const AI_ENDPOINT = "/gemini";

console.log("[config] COLUMNS:", COLUMNS);
console.log("[config] AI_COLUMNS:", AI_COLUMNS);
console.log("[config] AI_ENDPOINT:", AI_ENDPOINT);

export { COLUMNS, AI_COLUMNS, AI_ENDPOINT };
