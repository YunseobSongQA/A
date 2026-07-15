// 테스트케이스 줄들을 엑셀(xlsx) 파일로 저장한다

import { COLUMNS } from "./config.js";

const saveExcel = (rows) => {
  console.log("[saveExcel] rows:", rows);
  const sheet = XLSX.utils.json_to_sheet(rows, { header: COLUMNS });
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "TC");
  const fileName = "testcases.xlsx";
  XLSX.writeFile(book, fileName);
  console.log("[saveExcel] fileName:", fileName);
  return fileName;
};

export { saveExcel };
