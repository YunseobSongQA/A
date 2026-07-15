// 슬라이드 글자를 프롬프트로 만들어 서버 함수(/gemini)에 물어본다

import { AI_COLUMNS, AI_ENDPOINT } from "./config.js";

// 요구사항 1개 → TC 여러 개(정상 흐름 + 경계·예외). 설명 없이 JSON 배열만 받는다
const buildPrompt = (slides) => {
  console.log("[buildPrompt] slides:", slides);
  const keys = AI_COLUMNS.join(", ");
  const labeled = slides.map((text, i) => `[슬라이드 ${i + 1}]\n${text}`);
  const body = labeled.join("\n\n");

  const prompt = `아래는 기획서 슬라이드다. 한 슬라이드 안에 요구사항이 여러 개(표의 행 RQ-01, RQ-02 ... 형태) 들어 있을 수 있다.
요구사항 하나마다 정상 흐름(Happy Path) 1개와 경계·예외(Edge Case) 1개 이상을 각각 별도의 테스트케이스 줄로 만들어라.
그래서 슬라이드 1장에서 여러 줄이 나오는 게 정상이다. 줄 수를 슬라이드 수에 맞추지 마라.
각 줄은 ${keys} 키를 가진 JSON 객체다. 설명·코드펜스 없이 JSON 배열만 출력해라.

${body}`;
  console.log("[buildPrompt] prompt:", prompt);
  return prompt;
};

const askGemini = async (slides) => {
  console.log("[askGemini] slides:", slides);
  const prompt = buildPrompt(slides);
  const body = JSON.stringify({ prompt });

  const res = await fetch(AI_ENDPOINT, { method: "POST", body });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(text);
  }

  let list;
  try {
    list = JSON.parse(text);
  } catch {
    console.log("[askGemini] AI 응답 원문:", text);
    throw new Error("응답이 JSON 배열이 아닙니다");
  }
  console.log("[askGemini] list:", list);
  return list;
};

export { askGemini };
