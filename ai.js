// 슬라이드 글자를 프롬프트로 만들어 서버 함수(/gemini)에 물어본다

import { AI_COLUMNS, AI_ENDPOINT } from "./config.js";

// 슬라이드 1장 = TC 1줄. 설명 없이 JSON 배열만 받는다
const buildPrompt = (slides) => {
  console.log("[buildPrompt] slides:", slides);
  const keys = AI_COLUMNS.join(", ");
  const labeled = slides.map((text, i) => `[슬라이드 ${i + 1}] ${text}`);
  const body = labeled.join("\n");

  const prompt = `기획서 슬라이드다. 슬라이드 1장당 테스트케이스 1줄, 총 ${slides.length}줄을 만들어라.
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
