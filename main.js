// 화면 연결: 엑셀로 내보내기 버튼(기능2+3 파이프라인)
// index.html이 부르는 유일한 모듈. 나머지 기능은 여기서 import 한다.

import { readSlides } from "./pptx.js";
import { askGemini } from "./ai.js";
import { toRows } from "./testcase.js";
import { saveExcel } from "./excel.js";
import { renderTable } from "./table.js";

const status = document.querySelector("#status");

// 단계마다 이름·소요시간·에러를 남긴다 → 어디서 터졌는지 바로 보인다
const step = async (name, task) => {
  console.log("[step] name:", name);
  console.time(name);
  try {
    const result = await task();
    console.log("[step] result:", name, result);
    return result;
  } catch (e) {
    throw new Error(`${name} 단계에서 실패했습니다: ${e.message}`, { cause: e });
  } finally {
    console.timeEnd(name);
  }
};

// 기능 2+3: 파일 넣고 누르면 → 읽고 → AI 거치고 → 엑셀
document.querySelector("#export-btn").onclick = async () => {
  const pptInput = document.querySelector("#ppt-input");
  const file = pptInput.files[0];
  console.log("[export-btn] file:", file);
  if (!file) {
    status.textContent = "pptx 파일을 먼저 골라주세요.";
    return;
  }
  try {
    status.textContent = "변환 중...";
    const slides = await step("PPT 읽기", () => readSlides(file));
    const aiList = await step("AI 변환", () => askGemini(slides)); // AI가 준 날것
    const rows = toRows(aiList); // 우리 열 규격으로 강제
    renderTable(rows);
    await step("엑셀 저장", () => saveExcel(rows));
    status.textContent = `슬라이드 ${slides.length}장 → TC ${rows.length}줄 (testcases.xlsx 저장됨)`;
  } catch (e) {
    console.error(e); // cause를 따라가면 진짜 원인이 나온다
    status.textContent = e.message;
  }
};
