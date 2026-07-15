// 서버 함수: /gemini 주소를 만들고 Gemini 키를 "서버에만" 둔다
// 로그는 브라우저가 아니라 `wrangler pages dev`를 띄운 터미널에 뜬다

const API = "https://generativelanguage.googleapis.com/v1beta";

// responseMimeType은 v1beta에만 있는 필드다. v1로 부르면 400이 난다
const generate = (model, key, prompt) => {
  console.log("[generate] model:", model);
  const response = fetch(`${API}/models/${model}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json", // 결과물로 순수 JSON만 받도록 강제
        maxOutputTokens: 8192, // 요구사항마다 TC 여러 개면 응답이 길어진다. 기본값에 잘려 배열이 깨지지 않게 넉넉히
      },
    }),
  });
  console.log("[generate] response(대기 중):", response);
  return response;
};

// 구글이 옛 모델을 계속 잘라내서 이름이 404가 난다. 그때는 키로 쓸 수 있는 모델을 직접 물어본다
const findUsableModel = async (key) => {
  console.log("[findUsableModel] key 있음:", Boolean(key));
  const res = await fetch(`${API}/models?key=${key}`);
  if (!res.ok) {
    return null;
  }
  const { models = [] } = await res.json();

  const callable = models.filter((model) => model.supportedGenerationMethods?.includes("generateContent"));
  const names = callable.map((model) => model.name.replace(/^models\//, "")); // "models/gemini-x" → "gemini-x"
  const textOnly = names.filter((name) => !/embedding|aqa|tts|image|live|vision/.test(name)); // 글자 못 만드는 모델 제외
  const flash = textOnly.find((name) => name.includes("flash")); // 싸고 빠른 flash 우선

  const chosen = flash ?? textOnly[0] ?? null;
  console.log("[findUsableModel] chosen:", chosen);
  return chosen;
};

export async function onRequestPost(context) {
  console.log("[onRequestPost] context 도착");
  try {
    const { request, env } = context;
    const { prompt } = await request.json();

    // 대시보드에 등록해 둔 제미나이 키 가져오기
    const GEMINI_KEY = env.GEMINI_API_KEY;
    if (!GEMINI_KEY) {
      return new Response("서버 설정 오류: GEMINI_API_KEY가 없습니다.", { status: 500 });
    }

    // gemini-flash-latest는 구글이 최신 flash로 계속 옮겨주는 별칭이다
    let response = await generate(env.GEMINI_MODEL ?? "gemini-flash-latest", GEMINI_KEY, prompt);

    if (response.status === 404) {
      const fallback = await findUsableModel(GEMINI_KEY);
      if (!fallback) {
        return new Response(`구글 API 에러: ${await response.text()}`, { status: 404 });
      }
      response = await generate(fallback, GEMINI_KEY, prompt);
    }

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(`구글 API 에러: ${errorText}`, { status: response.status });
    }

    const data = await response.json();
    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiText) {
      return new Response(`구글 API 응답에 결과가 없습니다: ${JSON.stringify(data)}`, { status: 502 });
    }

    // 성공 경로: 이름 있는 결과를 한 번 만들어 return 한다
    const result = new Response(aiText, {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
    console.log("[onRequestPost] result 상태:", result.status);
    return result;
  } catch (e) {
    return new Response(`백엔드 서버 에러: ${e.message}`, { status: 500 });
  }
}
