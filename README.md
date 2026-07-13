# PRD2TC (간단 버전)

PRD를 붙여넣으면 QA 테스트 케이스(TC)로 바꿔주는 도구입니다.
[QAPRD2TC](https://github.com/YunseobSongQA/QAPRD2TC)를 기능 위주로 단순하게 다시 만듭니다. (CSS는 나중, 최신 JS 함수 사용)

## 핵심 기능 5가지

| 순서 | 기능 | 설명 | 주요 함수 |
|---|---|---|---|
| 1 | PRD 입력받기 | 입력창 글자를 변수로 가져오기 | `querySelector`, `.value` |
| 2 | 기획서(ppt) → TC 틀(excel) | pptx에서 글자 뽑아 TC 표로 저장 | `JSZip`, `DOMParser`, `XLSX` |
| 3 | AI 변환 | 비워둔 칸을 Claude 호출로 채우기 | `fetch`, `async/await` |
| 4 | 표로 표시 | TC를 화면에 표로 그리기 | `createElement`, `textContent` (← innerHTML) |
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
- `DOMParser` — XML을 정규식이 아니라 진짜 XML로 읽기 *(← matchAll + 엔티티 직접 되돌리기)*
  ```js
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  [...doc.getElementsByTagName("a:t")].map((node) => node.textContent);
  // <a:t>로그인 &amp; 가입</a:t> → "로그인 & 가입"
  ```
  왜 바꿨나: `textContent`가 `&amp;` 같은 엔티티를 알아서 풀어주고, XML이 깨졌을 때
  조용히 빈 배열을 주는 대신 에러를 던져서 어디가 문제인지 추적하기 쉽다.
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

## 쓰는 법

사용자는 파일만 고릅니다. 키도 모델도 묻지 않습니다.

1. 기획서 `.pptx` 파일 고르기 → **엑셀로 내보내기** 클릭
2. 중간에 AI를 거쳐 칸이 채워진 `testcases.xlsx` 다운로드 (슬라이드 1장 = TC 1줄)

### 키는 서버에 둔다

`app.js`는 Claude를 직접 부르지 않고 `/api/claude`(= `functions/api/claude.js`)를 부릅니다.
키는 그 서버 함수에만 있고 브라우저로는 나가지 않습니다.
**키를 `app.js`에 적으면 배포 순간 인터넷에 공개됩니다** (JS를 긁어 키를 찾는 스캐너가 상시로 돕니다).

로컬 실행 — `file://`로 열면 `/api/claude`가 없어서 안 됩니다. 로컬 서버가 필요합니다:

```bash
npx wrangler pages dev .          # http://localhost:8788
```

키는 프로젝트 루트에 `.dev.vars` 파일로 둡니다 (gitignore 되어 있음):

```
ANTHROPIC_API_KEY=sk-ant-...
```

배포 — Cloudflare Pages에 올리고, 대시보드 **Settings → Environment variables**에
`ANTHROPIC_API_KEY`를 넣으면 끝입니다. 개발자는 URL만 열면 씁니다.

모델은 `functions/api/claude.js`의 `model` 한 줄에서 바꿉니다.

AI 응답은 그대로 믿지 않습니다. `toRows()`가 우리 열 규격에 강제로 맞춥니다.
모르는 열은 버리고, 빠진 열은 빈칸으로 채우고, TC ID는 우리가 다시 매기고,
사람이 적는 칸(`결과`, `비고`)은 항상 비웁니다.

단계는 `step()`으로 감쌌습니다. `PPT 읽기` → `AI 변환` → `엑셀 저장` 중 어디서 실패했는지
화면 메시지(`AI 변환 단계에서 실패했습니다: ...`)와 콘솔(단계별 소요시간·에러)에 남습니다.

## 진행 상황

- [x] 1. PRD 입력받기
- [x] 2. 기획서(ppt) → TC 틀(excel)
- [x] 3. AI 변환
- [ ] 4. 표로 표시 ← **다음 차례**
- [ ] 5. 내보내기·복사 (엑셀 저장은 됨. 클립보드 복사가 남음)

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
