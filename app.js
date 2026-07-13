// 기능 1: PRD 입력받기
document.querySelector("#read-btn").onclick = () => {
  const input = document.querySelector("#prd-input");
  const output = document.querySelector("#output");
  output.textContent = input.value;
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

// pptx 안에서 슬라이드 XML 경로만 골라 화면 순서대로 정렬한다
const slidePaths = (zip) => {
  const all = Object.keys(zip.files);
  const slides = all.filter((path) => /^ppt\/slides\/slide\d+\.xml$/.test(path));
  return slides.sort((a, b) => a.localeCompare(b, undefined, { numeric: true })); // slide2가 slide10보다 앞
};

// 슬라이드 1장의 글자. DOMParser가 &amp; 같은 엔티티도 풀어준다
const readSlideText = async (zip, path) => {
  const xml = await zip.file(path).async("text");
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.querySelector("parsererror")) throw new Error(`${path} XML이 깨졌습니다`);
  const textNodes = [...doc.getElementsByTagName("a:t")]; // <a:t>안녕</a:t> 안의 글자
  const texts = textNodes.map((node) => node.textContent);
  return texts.join(" ");
};

const readSlides = async (file) => {
  const zip = await JSZip.loadAsync(file);
  const paths = slidePaths(zip);
  return Promise.all(paths.map((path) => readSlideText(zip, path)));
};

// 슬라이드 1장 = TC 1줄. 설명 없이 JSON 배열만 받는다
const buildPrompt = (slides) => {
  const keys = AI_COLUMNS.join(", ");
  const labeled = slides.map((text, i) => `[슬라이드 ${i + 1}] ${text}`);
  const body = labeled.join("\n");

  return `기획서 슬라이드다. 슬라이드 1장당 테스트케이스 1줄, 총 ${slides.length}줄을 만들어라.
각 줄은 ${keys} 키를 가진 JSON 객체다. 설명·코드펜스 없이 JSON 배열만 출력해라.

${body}`;
};

const askGemini = async (slides) => {
  const prompt = buildPrompt(slides);
  const body = JSON.stringify({ prompt });

  const res = await fetch("/api/gemini", { method: "POST", body });
  const text = await res.text();
  if (!res.ok) throw new Error(text);

  try { return JSON.parse(text); }
  catch { console.log("AI 응답 원문:", text); throw new Error("응답이 JSON 배열이 아닙니다"); }
};

// AI를 믿지 않는다: 모르는 열은 버리고, 빠진 열은 빈칸, TC ID는 다시 매기고, 결과/비고는 비운다
const toCell = (column, row, index) => {
  if (column === "TC ID") return `TC-${String(index + 1).padStart(3, "0")}`; // 번호는 우리가 매긴다
  if (AI_COLUMNS.includes(column)) return String(row[column] ?? ""); // 빠진 열은 빈칸
  return ""; // 결과·비고는 사람이 채운다
};

const toRow = (row, index) => {
  const cells = COLUMNS.map((column) => [column, toCell(column, row, index)]);
  return Object.fromEntries(cells);
};

const toRows = (list) => list.map(toRow);

const saveExcel = (rows) => {
  const sheet = XLSX.utils.json_to_sheet(rows, { header: COLUMNS });
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "TC");
  XLSX.writeFile(book, "testcases.xlsx");
};

// 파일 넣고 누르면 → 읽고 → AI 거치고 → 엑셀
document.querySelector("#export-btn").onclick = async () => {
  const pptInput = document.querySelector("#ppt-input");
  const file = pptInput.files[0];
  if (!file) return (status.textContent = "pptx 파일을 먼저 골라주세요.");
  try {
    status.textContent = "변환 중...";
    const slides = await step("PPT 읽기", () => readSlides(file));
    const aiList = await step("AI 변환", () => askGemini(slides)); // AI가 준 날것
    const rows = toRows(aiList); // 우리 열 규격으로 강제
    await step("엑셀 저장", () => saveExcel(rows));
    status.textContent = `슬라이드 ${slides.length}장 → TC ${rows.length}줄 (testcases.xlsx 저장됨)`;
  } catch (e) {
    console.error(e); // cause를 따라가면 진짜 원인이 나온다
    status.textContent = e.message;
  }
};
