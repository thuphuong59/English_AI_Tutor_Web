import { DisplayMessage, HistorySession, HistoryDetails } from "../app/conversation/types";
import { authHeaders } from "./authService";

const API_BASE_URL = "http://127.0.0.1:8000";

// --- HELPERS ---

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    let message = "An API error occurred";
    try {
      const errorData = await response.json();
      message = errorData.detail || message;
    } catch {
      console.error("Server returned non-JSON error");
    }
    throw new Error(message);
  }
  return response.json();
};

// Quan trọng: Chỉ lấy Token, KHÔNG set Content-Type để browser tự xử lý boundary cho FormData
const authHeadersForm = (): HeadersInit => {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// --- HISTORY ---

export const getHistoryList = async (): Promise<HistorySession[]> => {
  const res = await fetch(`${API_BASE_URL}/conversation/history`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
};

export const getConversationDetails = async (
  sessionId: string
): Promise<HistoryDetails> => {
  const res = await fetch(`${API_BASE_URL}/conversation/history/${sessionId}`, {
    headers: authHeaders(),
  });
  const data = await handleResponse(res);

  // Parse messages an toàn nếu DB trả về string thay vì JSON array
  try {
    if (typeof data.messages === "string") {
      data.messages = JSON.parse(data.messages);
    }
  } catch {
    console.warn("Messages field not valid JSON array, fallback to []");
    data.messages = [];
  }
  return data;
};

// --- SCENARIOS ---

export const getScenarios = async (topic: string, level: string) => {
  const res = await fetch(
    `${API_BASE_URL}/conversation/scenarios?topic=${encodeURIComponent(topic)}&level=${encodeURIComponent(level)}`, 
    { headers: authHeaders() }
  );
  return handleResponse(res);
};

// --- START CONVERSATION ---

export const startConversation = async (
  mode: string,
  level: string,
  scenarioId?: string,
  topic?: string
) => {
  const res = await fetch(`${API_BASE_URL}/conversation/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ mode, level, scenario_id: scenarioId, topic }),
  });
  return handleResponse(res);
};

// --- EVALUATE SCENARIO (VOICE) ---

export const sendAndEvaluateVoice = async (
  audioBlob: Blob,
  scenarioId: string,
  level: string,
  turn: number,
  sessionId: string
) => {
  const formData = new FormData();

  // Quan trọng: Đặt tên file "user.webm" để backend nhận diện đúng định dạng
  formData.append("audio", audioBlob, "user.webm");
  formData.append("scenario_id", scenarioId);
  formData.append("level", level);
  formData.append("current_turn", String(turn));
  formData.append("session_id", sessionId);

  const res = await fetch(`${API_BASE_URL}/conversation/evaluate-scenario-voice`, {
    method: "POST",
    headers: authHeadersForm(), // Chỉ gửi Token
    body: formData,
  });

  return handleResponse(res);
};

// --- FREE TALK (TEXT) ---

export const sendFreeTalkMessage = async (
  message: string,
  history: DisplayMessage[],
  topic: string,
  level: string,
  sessionId: string
) => {
  const res = await fetch(`${API_BASE_URL}/conversation/chat/free-talk`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ message, history, topic, level, session_id: sessionId }),
  });
  return handleResponse(res);
};

// --- FREE TALK (VOICE) ---

export const sendFreeTalkVoice = async (
  audioBlob: Blob,
  history: DisplayMessage[],
  topic: string,
  level: string,
  sessionId: string
) => {
  const formData = new FormData();
  
  formData.append("audio", audioBlob, "user.webm");
  // Backend cần chuỗi JSON này để lấy context hội thoại
  formData.append("history", JSON.stringify(history));
  formData.append("topic", topic);
  formData.append("level", level);
  formData.append("session_id", sessionId);

  const res = await fetch(`${API_BASE_URL}/conversation/chat/free-talk-voice`, {
    method: "POST",
    headers: authHeadersForm(),
    body: formData,
  });
  return handleResponse(res);
};

// --- SUMMARY ---

export const getConversationSummary = async (
  history: DisplayMessage[],
  level: string,
  topic: string,
  sessionId: string
) => {
  const res = await fetch(`${API_BASE_URL}/conversation/summarize-conversation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ history, level, topic, session_id: sessionId }),
  });
  return handleResponse(res);
};

// --- DELETE ---

export const deleteConversation = async (sessionId: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/conversation/delete/${sessionId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorData.detail || `Failed to delete session (status: ${response.status})`);
  }

  return response.json(); 
};