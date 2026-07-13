export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const { prompt } = await request.json();

    // 대시보드에 등록해 둔 제미나이 키 가져오기
    const GEMINI_KEY = env.GEMINI_API_KEY;
    if (!GEMINI_KEY) {
      return new Response("서버 설정 오류: GEMINI_API_KEY가 없습니다.", { status: 500 });
    }

    // 구글 제미나이 2.5 flash 모델 호출 주소
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json" // 결과물로 순수 JSON만 받도록 강제
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(`구글 API 에러: ${errorText}`, { status: response.status });
    }

    const data = await response.json();
    const aiText = data.candidates[0].content.parts[0].text;

    return new Response(aiText, {
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });

  } catch (e) {
    return new Response(`백엔드 서버 에러: ${e.message}`, { status: 500 });
  }
}
