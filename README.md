# PRD2TC (간단 버전)

PRD를 붙여넣으면 QA 테스트 케이스(TC)로 바꿔주는 도구입니다.
[QAPRD2TC](https://github.com/YunseobSongQA/QAPRD2TC)를 기능 위주로 단순하게 다시 만듭니다. (CSS는 나중, 최신 JS 함수 사용)

## 핵심 기능 5가지

| 순서 | 기능 | 설명 | 주요 함수 |
|---|---|---|---|
| 1 | PRD 입력받기 | 입력창 글자를 변수로 가져오기 | `querySelector`, `.value` |
| 2 | 기획서(ppt) → TC 틀(excel) | pptx에서 글자 뽑아 TC 표로 저장 | `JSZip`, `DOMParser`, `XLSX` |
| 3 | AI 변환 | 비워둔 칸을 Gemini 호출로 채우기 | `fetch`, `async/await` |
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

`app.js`는 Gemini를 직접 부르지 않고 `/api/gemini`(= `functions/api/gemini.js`)를 부릅니다.
키는 그 서버 함수에만 있고 브라우저로는 나가지 않습니다.
**키를 `app.js`에 적으면 배포 순간 인터넷에 공개됩니다** (JS를 긁어 키를 찾는 스캐너가 상시로 돕니다).

로컬 실행 — `file://`로 열면 `/api/gemini`가 없어서 안 됩니다. 로컬 서버가 필요합니다:

```bash
npx wrangler pages dev .          # http://localhost:8788
```

키는 프로젝트 루트에 `.dev.vars` 파일로 둡니다 (gitignore 되어 있음):

```
GEMINI_API_KEY=...
```

배포 — Cloudflare Pages에 올리고, 대시보드 **Settings → Environment variables**에
`GEMINI_API_KEY`를 넣으면 끝입니다. 개발자는 URL만 열면 씁니다.

### 모델 이름은 고정하지 않는다

구글이 옛 모델을 계속 잘라내서, 이름을 박아두면 어느 날 갑자기 404가 납니다.
(`gemini-1.5-flash` → 막힘 → `gemini-2.5-flash` → 또 막힘.)

그래서 기본값은 구글이 최신 flash로 계속 옮겨주는 별칭 `gemini-flash-latest`를 씁니다.
그마저 404가 나면 `ListModels`로 **그 키가 실제로 부를 수 있는 모델 목록**을 물어본 뒤
flash 계열을 골라 자동 재시도합니다. 사람이 이름을 맞힐 필요가 없습니다.
특정 모델로 고정하고 싶으면 환경변수 `GEMINI_MODEL`만 넣으면 됩니다.

참고: JSON만 받도록 강제하는 `responseMimeType`은 **`v1beta`에만** 있는 필드입니다.
`v1`으로 부르면 `Unknown name "responseMimeType"` 400이 납니다.

AI 응답은 그대로 믿지 않습니다. `toRows()`가 우리 열 규격에 강제로 맞춥니다.
모르는 열은 버리고, 빠진 열은 빈칸으로 채우고, TC ID는 우리가 다시 매기고,
사람이 적는 칸(`결과`, `비고`)은 항상 비웁니다.

단계는 `step()`으로 감쌌습니다. `PPT 읽기` → `AI 변환` → `엑셀 저장` 중 어디서 실패했는지
화면 메시지(`AI 변환 단계에서 실패했습니다: ...`)와 콘솔(단계별 소요시간·에러)에 남습니다.

## 리팩토링: 체인 분리

### 체인(chain)이 뭔가

점(`.`)으로 함수를 계속 이어 붙여 **한 문장으로 여러 단계를 처리하는 것**을 메서드 체인이라고 합니다.
앞 함수가 뱉은 결과에 바로 다음 함수를 붙이는 식이라, 중간 결과에 **이름이 없습니다.**

```js
// 체인: 세 단계가 한 문장. 중간값이 어디에도 안 남는다
const texts = nodes.map((n) => n.textContent).filter((t) => t !== "").join(" ");

// 분리: 단계마다 이름이 붙는다
const raw = nodes.map((node) => node.textContent);
const filled = raw.filter((text) => text !== "");
const texts = filled.join(" ");
```

괄호 안에 함수를 또 넣는 **중첩 호출**도 같은 문제를 냅니다 (`f(g(h(x)))` — 안쪽부터 거꾸로 읽어야 함).

### 왜 쪼갰나

1. **디버깅**: 체인 중간에는 멈춰 설 곳이 없습니다. 값이 이상해도 `map` 다음인지 `filter` 다음인지 알 수 없어서,
   확인하려면 결국 코드를 쪼개야 합니다. 처음부터 쪼개져 있으면 브레이크포인트·`console.log`를 바로 걸 수 있습니다.
2. **읽기**: 이름이 곧 설명입니다. `textOnly`, `cells`, `labeled` 같은 변수명이 주석 없이 의도를 알려줍니다.
3. **에러 추적**: 한 줄이 길수록 스택트레이스의 줄 번호가 가리키는 범위가 넓어집니다. 한 줄 = 한 단계면 바로 짚힙니다.

### 실제로 쪼갠 곳

| 위치 | 전 | 후 |
|---|---|---|
| `toRows()` | `map` → `Object.fromEntries` → `map` → 중첩 삼항이 한 덩어리 | `toCell()`(셀 1칸) → `toRow()`(줄 1개) → `toRows()`(전체) |
| `readSlides()` | 경로 필터·정렬·파싱이 한 함수 | `slidePaths()`(경로 고르기) + `readSlideText()`(1장 읽기) + `readSlides()`(모으기) |
| `askGemini()` | 템플릿 리터럴 안에서 `map().join()` | 프롬프트 조립을 `buildPrompt()`로 분리 (`labeled` → `body`) |
| `saveExcel()` | `book_append_sheet(book, json_to_sheet(rows, ...), "TC")` 중첩 호출 | `sheet` 만들고 → `book` 만들고 → 붙이고 → 저장 |
| 버튼 핸들러 | `toRows(await step("AI 변환", ...))` | `aiList`(AI 날것) → `rows`(우리 규격) 두 줄로 |
| `findUsableModel()` | `.filter().map().filter()` + `find` 체인 | `callable` → `names` → `textOnly` → `flash` 단계별 변수 |

`toCell()`은 특히 중첩 삼항(`a ? b : c ? d : e`)을 `if` 세 줄로 폈습니다.
세 갈래 규칙(TC ID는 우리가 매김 / AI 값은 받되 빠지면 빈칸 / 결과·비고는 사람이 채움)이 한눈에 보입니다.

### 안 쪼갠 것

`slides.sort(...)`처럼 **한 단계짜리**는 그대로 둡니다. 체인 분리는 단계가 여럿일 때 이득이고,
한 단계를 굳이 변수에 담으면 오히려 줄만 늘어납니다.

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
| PPT 추출 | `python-pptx` | `JSZip` + `DOMParser` (pptx는 zip이라 슬라이드 XML을 직접 읽음) |
| 데이터 가공 | `pandas` | `map()` (표 한 장이라 배열로 충분) |
| 엑셀 내보내기 | `openpyxl` | `SheetJS(XLSX)` |

나중에 AI 호출을 서버에서 하게 되면, 그때는 파이썬 3종이 더 편합니다.
