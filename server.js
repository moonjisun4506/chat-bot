import express from "express";
import OpenAI from "openai";

const app = express();
const PORT = process.env.PORT || 3000;
const MODEL = "gpt-4o-mini";
const MAX_HISTORY = 20; // 모델에 보낼 최근 메시지 수 (토큰 절약)

const SYSTEM_PROMPT = `너는 사용자의 오랜 친구야. 항상 친구처럼 편하게 대화해.
- 존댓말 대신 반말을 써. (예: "그랬구나!", "그거 좋다~")
- 딱딱한 설명투 말고, 친구한테 말하듯 자연스럽고 따뜻하게 말해.
- 공감과 리액션을 적절히 섞되, 질문에는 정확하고 도움이 되는 답을 줘.
- 이전 대화 내용을 기억하고 자연스럽게 이어서 말해.
- 너무 길게 늘어놓지 말고 간결하게 답해.
- 이모지는 가끔만 가볍게 써.`;

if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY가 .env 파일에 설정되어 있지 않습니다.");
  process.exit(1);
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

// 대화 기록은 DB 없이 클라이언트가 보관하고, 요청마다 전체 기록을 함께 보낸다.
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages 배열이 필요합니다." });
  }

  // 클라이언트에서 온 데이터는 user/assistant 역할의 문자열만 허용
  const history = messages
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim() !== ""
    )
    .slice(-MAX_HISTORY);

  if (history.length === 0 || history[history.length - 1].role !== "user") {
    return res.status(400).json({ error: "마지막 메시지는 사용자 메시지여야 합니다." });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (err) {
    console.error("OpenAI API 오류:", err);
    res.status(500).json({ error: "AI 응답을 가져오는 중 오류가 발생했습니다." });
  }
});

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
