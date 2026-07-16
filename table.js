// 만든 테스트케이스 줄들을 화면 표로 그린다 (엑셀 저장과 별개로 눈으로 확인용)

import { COLUMNS } from "./config.js";

// 한 줄을 <tr>로 만든다. 머리줄이면 th, 본문이면 td
const toTr = (values, tag) => {
  const tr = document.createElement("tr");
  values.forEach((text) => {
    const cell = document.createElement(tag);
    cell.textContent = text;
    tr.appendChild(cell);
  });
  return tr;
};

const renderTable = (rows) => {
  console.log("[renderTable] rows:", rows);
  const table = document.querySelector("#tc-table");
  table.replaceChildren();
  table.appendChild(toTr(COLUMNS, "th"));
  rows.forEach((row) => {
    const values = COLUMNS.map((column) => row[column]);
    table.appendChild(toTr(values, "td"));
  });
  console.log("[renderTable] 그린 줄 수:", rows.length);
};

export { renderTable };
