// 키는 서버에만 산다. 브라우저로는 절대 안 나간다.
// Cloudflare Pages 환경변수(ANTHROPIC_API_KEY)에 키를 넣어두면 여기서 꺼내 쓴다.
export async function onRequestPost({ request, env }) {
  const { prompt } = await request.json();

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 8000,
      messages: [{ role: "user", content: prompt }] }),
  });
  if (!res.ok) return new Response(await res.text(), { status: res.status });

  const data = await res.json();
  return new Response(data.content.map((block) => block.text).join("")); // 글자만 돌려준다
}
