// AI가 준 날것을 우리 열 규격의 테스트케이스 줄로 강제한다

import { COLUMNS, AI_COLUMNS } from "./config.js";

// AI를 믿지 않는다: 모르는 열은 버리고, 빠진 열은 빈칸, TC ID는 다시 매기고, 결과/비고는 비운다
// (toCell·toRow는 반복문 안에서 여러 번 도니 매번 로그하지 않는다 → toRows에서 개수만 요약)
const toCell = (column, row, index) => {
  if (column === "TC ID") {
    return `TC-${String(index + 1).padStart(3, "0")}`; // 번호는 우리가 매긴다
  }
  if (AI_COLUMNS.includes(column)) {
    return String(row[column] ?? ""); // 빠진 열은 빈칸
  }
  return ""; // 결과·비고는 사람이 채운다
};

const toRow = (row, index) => {
  const cells = COLUMNS.map((column) => [column, toCell(column, row, index)]);
  const built = Object.fromEntries(cells);
  return built;
};

const toRows = (list) => {
  console.log("[toRows] list:", list);
  const rows = list.map(toRow);
  console.log("[toRows] 만든 줄 수:", rows.length);
  return rows;
};

export { toRows };
