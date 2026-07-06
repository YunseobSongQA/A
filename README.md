# PRD2TC (간단 버전)

PRD를 붙여넣으면 QA 테스트 케이스(TC)로 바꿔주는 도구입니다.
[QAPRD2TC](https://github.com/YunseobSongQA/QAPRD2TC)를 기능 위주로 단순하게 다시 만듭니다. (CSS는 나중, 최신 JS 함수 사용)

## 핵심 기능 5가지

| 순서 | 기능 | 설명 | 주요 함수 |
|---|---|---|---|
| 1 | PRD 입력받기 | 입력창 글자를 변수로 가져오기 | `querySelector`, `.value` |
| 2 | 규칙 기반 변환 | 키워드 찾아 TC 자동 생성 | `includes`, `filter`, `map` |
| 3 | AI 변환 | Claude 호출로 TC 생성 | `fetch`, `async/await` |
| 4 | 표로 표시 | TC를 화면에 표로 그리기 | `map`, 템플릿 리터럴, `innerHTML` |
| 5 | 내보내기·복사 | 파일 저장 / 클립보드 복사 | `Blob`, `clipboard.writeText` |

## 쓰는 함수

- `querySelector()` — 화면 요소 찾기 *(← getElementById)*
- `.includes()` — 단어 포함 여부 검사 *(← indexOf)*
- `.map()` / `.filter()` — 배열 변환·선별
- `fetch()` + `async/await` — 서버 요청·응답 대기 *(← XMLHttpRequest, .then)*
- 템플릿 리터럴 `` `${}` `` — 글자에 값 끼워넣기 *(← 문자열 +)*
- `clipboard.writeText()` — 클립보드 복사 *(← execCommand)*
- `Blob` / `createObjectURL()` — 파일 다운로드 만들기

## 진행 상황

- [ ] 1. PRD 입력받기 ← **다음 차례**
- [ ] 2. 규칙 기반 변환
- [ ] 3. AI 변환
- [ ] 4. 표로 표시
- [ ] 5. 내보내기·복사
