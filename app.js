// 기능 1: PRD 입력받기
document.querySelector("#read-btn").onclick = () => {
  document.querySelector("#output").textContent = document.querySelector("#prd-input").value;
};

// 기능 2+3: 기획서(pptx) → Claude(키는 서버에) → 테스트케이스(xlsx)
const COLUMNS = ["TC ID", "대분류", "중분류", "테스트 시나리오", "사전조건", "테스트 절차", "기대 결과", "우선순위", "결과", "비고"];
const AI_COLUMNS = COLUMNS.slice(1, -2); // TC ID는 우리가 매기고, 결과/비고는 사람이 적는다
const status = document.querySelector("#status");

// 단계마다 이름·소요시간·에러를 남긴다 → 어디서 터졌는지 바로 보인다
const step = async (name, task) => {
  console.time(name);
  try { return await task(); }
  catch (e) { throw new Error(`${name} 단계에서 실패했습니다: ${e.message}`, { cause: e }); }
  finally { console.timeEnd(name); }
};

// pptx는 zip → 슬라이드 XML의 <a:t> 글자만. DOMParser가 &amp; 같은 엔티티도 풀어준다
const readSlides = async (file) => {
  const zip = await JSZip.loadAsync(file);
  const paths = Object.keys(zip.files)
    .filter((path) => /^ppt\/slides\/slide\d+\.xml$/.test(path))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true })); // slide2가 slide10보다 앞
  return Promise.all(paths.map(async (path) => {
    const doc = new DOMParser().parseFromString(await zip.file(path).async("text"), "application/xml");
    if (doc.querySelector("parsererror")) throw new Error(`${path} XML이 깨졌습니다`);
    return [...doc.getElementsByTagName("a:t")].map((node) => node.textContent).join(" ");
  }));
};

// 슬라이드 1장 = TC 1줄. 설명 없이 JSON 배열만 받는다
const askClaude = async (slides) => {
  const prompt = `기획서 슬라이드다. 슬라이드 1장당 테스트케이스 1줄, 총 ${slides.length}줄을 만들어라.
각 줄은 ${AI_COLUMNS.join(", ")} 키를 가진 JSON 객체다. 설명·코드펜스 없이 JSON 배열만 출력해라.

${slides.map((text, i) => `[슬라이드 ${i + 1}] ${text}`).join("\n")}`;

  const res = await fetch("/api/claude", { method: "POST", body: JSON.stringify({ prompt }) });
  const text = await res.text();
  if (!res.ok) throw new Error(text);
  try { return JSON.parse(text); }
  catch { console.log("AI 응답 원문:", text); throw new Error("응답이 JSON 배열이 아닙니다"); }
};

// AI를 믿지 않는다: 모르는 열은 버리고, 빠진 열은 빈칸, TC ID는 다시 매기고, 결과/비고는 비운다
const toRows = (list) => list.map((row, i) => Object.fromEntries(COLUMNS.map((c) => [c,
  c === "TC ID" ? `TC-${String(i + 1).padStart(3, "0")}` : AI_COLUMNS.includes(c) ? String(row[c] ?? "") : ""])));

const saveExcel = (rows) => {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(rows, { header: COLUMNS }), "TC");
  XLSX.writeFile(book, "testcases.xlsx");
};

// 파일 넣고 누르면 → 읽고 → AI 거치고 → 엑셀
document.querySelector("#export-btn").onclick = async () => {
  const file = document.querySelector("#ppt-input").files[0];
  if (!file) return (status.textContent = "pptx 파일을 먼저 골라주세요.");
  try {
    status.textContent = "변환 중...";
    const slides = await step("PPT 읽기", () => readSlides(file));
    const rows = toRows(await step("AI 변환", () => askClaude(slides)));
    await step("엑셀 저장", () => saveExcel(rows));
    status.textContent = `슬라이드 ${slides.length}장 → TC ${rows.length}줄 (testcases.xlsx 저장됨)`;
  } catch (e) {
    console.error(e); // cause를 따라가면 진짜 원인이 나온다
    status.textContent = e.message;
  }
};
