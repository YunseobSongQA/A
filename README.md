# PRD2TC (간단 버전)

PRD를 붙여넣으면 QA 테스트 케이스(TC)로 바꿔주는 도구입니다.
[QAPRD2TC](https://github.com/YunseobSongQA/QAPRD2TC)를 기능 위주로 단순하게 다시 만듭니다. (CSS는 나중, 최신 JS 함수 사용)

## 핵심 기능 5가지

| 순서 | 기능 | 설명 | 주요 함수 |
|---|---|---|---|
| 1 | PRD 입력받기 | 입력창 글자를 변수로 가져오기 | `querySelector`, `.value` |
| 2 | 기획서(ppt) → TC 틀(excel) | pptx에서 글자 뽑아 TC 표로 저장 | `JSZip`, `matchAll`, `XLSX` |
| 3 | AI 변환 | 비워둔 칸을 Claude 호출로 채우기 | `fetch`, `async/await` |
| 4 | 표로 표시 | TC를 화면에 표로 그리기 | `map`, 템플릿 리터럴, `innerHTML` |
| 5 | 내보내기·복사 | 파일 저장 / 클립보드 복사 | `Blob`, `clipboard.writeText` |

## 쓰는 함수

- `querySelector()` — 화면 요소 찾기 *(← getElementById)*
  ```js
  const input = document.querySelector("#prd-input");
  ```
- `.files[0]` — 파일 선택창에서 고른 파일 가져오기
  ```js
  const file = pptInput.files[0];
  ```
- `JSZip.loadAsync()` — pptx(=zip 파일) 풀기
  ```js
  const zip = await JSZip.loadAsync(file);
  const xml = await zip.file("ppt/slides/slide1.xml").async("text");
  ```
- `.matchAll()` — 정규식으로 여러 곳 한 번에 찾기 *(← exec 반복문)*
  ```js
  [...xml.matchAll(/<a:t>(.*?)<\/a:t>/gs)].map((found) => found[1]);
  // <a:t>로그인 화면</a:t> → "로그인 화면"
  ```
- `.map()` / `.filter()` — 배열 변환·선별
  ```js
  names.filter((name) => name.endsWith(".xml")).map((name) => name.length);
  ```
- `Promise.all()` — 여러 비동기 작업을 한꺼번에 기다리기
  ```js
  const slides = await Promise.all(names.map(readOneSlide));
  ```
- `fetch()` + `async/await` — 서버 요청·응답 대기 *(← XMLHttpRequest, .then)*
  ```js
  const res = await fetch(url, { method: "POST", body: json });
  ```
- 템플릿 리터럴 `` `${}` `` — 글자에 값 끼워넣기 *(← 문자열 +)*
  ```js
  `TC-${String(index + 1).padStart(3, "0")}`; // "TC-001"
  ```
- `XLSX.utils.json_to_sheet()` / `XLSX.writeFile()` — 엑셀 파일 만들고 내려받기
  ```js
  const sheet = XLSX.utils.json_to_sheet(rows, { header: TC_COLUMNS });
  XLSX.writeFile(book, "testcases.xlsx");
  ```
- `clipboard.writeText()` — 클립보드 복사 *(← execCommand)*
  ```js
  await navigator.clipboard.writeText(text);
  ```
- `Blob` / `createObjectURL()` — 파일 다운로드 만들기
  ```js
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  ```

## 기능 2 쓰는 법

1. `index.html`을 브라우저로 열기
2. 기획서 `.pptx` 파일 고르기 → **엑셀로 내보내기** 클릭
3. `testcases.xlsx` 다운로드 (슬라이드 1장 = TC 1줄)

나오는 건 **틀뿐입니다.** 열 이름과 줄 수(= 슬라이드 수), TC ID만 하드코딩으로 채우고
나머지 칸은 `(AI 변환 예정)`으로 비워둡니다. 슬라이드에서 뽑은 글자는 엑셀에 넣지 않고,
기능 3에서 AI에게 넘겨 그 칸들을 채우게 할 재료로만 씁니다.

## 진행 상황

- [x] 1. PRD 입력받기
- [x] 2. 기획서(ppt) → TC 틀(excel)
- [ ] 3. AI 변환 ← **다음 차례**
- [ ] 4. 표로 표시
- [ ] 5. 내보내기·복사

## 왜 python-pptx / pandas / openpyxl 을 안 썼나

셋 다 좋은 라이브러리지만 **파이썬**이라 브라우저에서 못 돕니다.
이 프로젝트는 `index.html`을 열면 끝나는 정적 웹페이지라서, 파이썬을 쓰려면 서버를 따로 띄워야 합니다.
그래서 브라우저에서 같은 일을 하는 짝으로 바꿨습니다.

| 하는 일 | 파이썬이면 | 여기서 쓴 것 |
|---|---|---|
| PPT 추출 | `python-pptx` | `JSZip` + `matchAll` (pptx는 zip이라 슬라이드 XML을 직접 읽음) |
| 데이터 가공 | `pandas` | `map()` (표 한 장이라 배열로 충분) |
| 엑셀 내보내기 | `openpyxl` | `SheetJS(XLSX)` |

나중에 AI 호출을 서버에서 하게 되면, 그때는 파이썬 3종이 더 편합니다.
