const chatBox = document.getElementById("chat-box");
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const resetBtn = document.getElementById("reset-btn");

// 대화 기록 (DB 대신 브라우저 메모리에 보관)
let messages = [];

function addMessage(role, text) {
  const div = document.createElement("div");
  div.className = `message ${role}`;
  div.textContent = text; // XSS 방지를 위해 textContent 사용
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
  return div;
}

async function sendMessage(text) {
  messages.push({ role: "user", content: text });
  addMessage("user", text);

  const loading = addMessage("assistant loading", "답변 생성 중...");
  sendBtn.disabled = true;

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "요청 실패");

    loading.remove();
    messages.push({ role: "assistant", content: data.reply });
    addMessage("assistant", data.reply);
  } catch (err) {
    loading.remove();
    messages.pop(); // 실패한 사용자 메시지는 기록에서 제거
    addMessage("error", `오류: ${err.message}`);
  } finally {
    sendBtn.disabled = false;
    userInput.focus();
  }
}

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = userInput.value.trim();
  if (!text || sendBtn.disabled) return;
  userInput.value = "";
  userInput.style.height = "auto";
  sendMessage(text);
});

// Enter: 전송, Shift+Enter: 줄바꿈 (한글 조합 중에는 무시)
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    chatForm.requestSubmit();
  }
});

// 입력 내용에 맞춰 높이 자동 조절
userInput.addEventListener("input", () => {
  userInput.style.height = "auto";
  userInput.style.height = `${userInput.scrollHeight}px`;
});

resetBtn.addEventListener("click", () => {
  messages = [];
  chatBox.innerHTML = "";
  addMessage("assistant", "새로 시작하자! 무슨 얘기 할래?");
  userInput.focus();
});
