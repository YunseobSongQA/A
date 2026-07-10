// 기능 1: PRD 입력받기

// 화면 요소 찾기
const input = document.querySelector("#prd-input");
const button = document.querySelector("#read-btn");
const output = document.querySelector("#output");

// 버튼을 누르면 입력창 글자를 읽어와 화면에 보여주기
button.addEventListener("click", () => {
  const prdText = input.value; // 입력창 글자 가져오기
  output.textContent = prdText; // 읽은 값 확인
});

// 기능 2: 기획서(ppt) → 테스트케이스(excel) 틀 만들기

// 화면 요소 찾기
const pptInput = document.querySelector("#ppt-input");
const exportBtn = document.querySelector("#export-btn");
const statusText = document.querySelector("#status");

// TC 표의 큰 틀은 하드코딩. 빈 칸은 나중에 AI가 채운다.
const TC_COLUMNS = [
  "TC ID", "대분류", "중분류", "테스트 시나리오", "사전조건",
  "테스트 절차", "기대 결과", "우선순위", "결과", "비고",
];
const TODO = "(AI 변환 예정)";

// XML 특수문자 되돌리기 (&amp; → &)
const decode = (text) =>
  text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");

// pptx는 사실 zip 파일 → 슬라이드 XML에서 글자만 뽑기
async function readSlides(file) {
  const zip = await JSZip.loadAsync(file);
  const names = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true })); // slide2 가 slide10 보다 앞

  return Promise.all(
    names.map(async (name) => {
      const xml = await zip.file(name).async("text");
      return [...xml.matchAll(/<a:t>(.*?)<\/a:t>/gs)] // <a:t>안녕</a:t> 안의 글자
        .map((found) => decode(found[1]).trim())
        .filter((text) => text !== "");
    })
  );
}

// 슬라이드 1장 = TC 1줄. 틀(줄 수 + TC ID)만 만들고 칸은 비워둔다.
// 슬라이드 글자는 엑셀에 넣지 않고, 기능 3에서 AI에게 넘겨 칸을 채우게 한다.
function toTestCases(slideCount) {
  return Array.from({ length: slideCount }, (_, index) => ({
    "TC ID": `TC-${String(index + 1).padStart(3, "0")}`,
    "대분류": TODO,
    "중분류": TODO,
    "테스트 시나리오": TODO,
    "사전조건": TODO,
    "테스트 절차": TODO,
    "기대 결과": TODO,
    "우선순위": TODO,
    "결과": "", // 테스트 해보고 Pass/Fail 적는 칸
    "비고": "",
  }));
}

// 엑셀 파일로 저장
function saveExcel(rows) {
  const sheet = XLSX.utils.json_to_sheet(rows, { header: TC_COLUMNS });
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "TC");
  XLSX.writeFile(book, "testcases.xlsx");
}

// 버튼을 누르면 pptx 읽기 → TC 틀 만들기 → 엑셀 내려받기
exportBtn.addEventListener("click", async () => {
  const file = pptInput.files[0]; // 고른 파일 가져오기
  if (!file) {
    statusText.textContent = "pptx 파일을 먼저 골라주세요.";
    return;
  }

  statusText.textContent = "변환 중...";
  const slides = await readSlides(file); // 뽑은 글자는 기능 3(AI 변환)에서 쓴다
  saveExcel(toTestCases(slides.length));
  statusText.textContent = `슬라이드 ${slides.length}장 → TC ${slides.length}줄 (testcases.xlsx 저장됨)`;
});
