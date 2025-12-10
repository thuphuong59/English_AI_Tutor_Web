import { mutate } from 'swr';
import { authHeaders, API_BASE_URL } from './authService';

const VOCAB_API_URL = `${API_BASE_URL}/vocabulary`;
const DECK_API_URL = `${API_BASE_URL}/decks`;
const ANALYSIS_API_URL = `${API_BASE_URL}/analysis`;
const PUBLIC_DECK_API_URL = `${API_BASE_URL}/public-decks`;
const QUIZ_DATA_API_URL = `${API_BASE_URL}/quiz-data`;
const QUIZ_API_URL = `${API_BASE_URL}/quiz`;

// Helper: Gửi request với method POST, PATCH, DELETE...
const sendData = async (url: string, method: 'POST' | 'PATCH' | 'PUT' | 'DELETE', body?: object) => {
  const res = await fetch(url, {
    method: method,
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Lỗi khi gửi dữ liệu (${res.status})`);
  }
  return res.json();
};

// Helper: Gửi request GET
const getData = async (url: string) => {
  const res = await fetch(url, {
    method: 'GET',
    headers: authHeaders(), 
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Lỗi khi tải dữ liệu (${res.status})`);
  }
  return res.json();
};


export const postReviewResult = async (wordId: number, quality: number) => {
  try {
    return await sendData(`${VOCAB_API_URL}/review`, 'POST', {
      word_id: wordId,
      quality: quality,
    });
  } catch (error) {
    console.error('Lỗi khi gửi kết quả review:', error);
    throw error;
  }
};

export const addNewWordManually = async (
  wordData: { word: string; type: string; definition: string; example: string },
  deckId: number
) => {
  try {
    const response = await sendData(`${VOCAB_API_URL}/deck/${deckId}/new-word`, 'POST', wordData);
    mutate(`/decks/${deckId}`);
    return response;
  } catch (error) {
    console.error('Lỗi khi thêm từ mới:', error);
    throw error;
  }
};

export const updateWord = async (wordId: number, wordData: { word?: string; type?: string; definition?: string; example?: string }) => {
  try {
    const response = await sendData(`${VOCAB_API_URL}/${wordId}`, 'PATCH', wordData);
    mutate('/vocabulary/dashboard');
    return response;
  } catch (error) {
    console.error('Lỗi khi cập nhật từ:', error);
    throw error;
  }
};

export const deleteWord = async (wordId: number) => {
  try {
    const response = await sendData(`${VOCAB_API_URL}/${wordId}`, 'DELETE');
    mutate('/vocabulary/dashboard');
    return response;
  } catch (error) {
    console.error('Lỗi khi xóa từ:', error);
    throw error;
  }
};


export const createDeck = async (name: string, description: string | null) => {
  try {
    const response = await sendData(`${DECK_API_URL}/`, 'POST', {
      name: name,
      description: description,
    });
    mutate('/decks'); 
    return response;
  } catch (error) {
    console.error('Lỗi khi tạo bộ từ:', error);
    throw error;
  }
};

export const updateDeck = async (deckId: number, data: { name?: string; description?: string }) => {
  try {
    const response = await sendData(`${DECK_API_URL}/${deckId}`, 'PATCH', data);
    mutate('/decks');
    return response;
  } catch (error) {
    console.error('Lỗi khi cập nhật bộ từ:', error);
    throw error;
  }
};

export const deleteDeck = async (deckId: number) => {
  try {
    const response = await sendData(`${DECK_API_URL}/${deckId}`, 'DELETE');
    mutate('/decks');
    return response;
  } catch (error) {
    console.error('Lỗi khi xóa bộ từ:', error);
    throw error;
  }
};


export const addSuggestedWord = async (suggestionId: number, deckId: number) => {
  try {
    const response = await sendData(`${VOCAB_API_URL}/suggestions/add`, 'POST', {
      suggestion_id: suggestionId,
      deck_id: deckId,
    });
    
    mutate('/decks');
    mutate('/vocabulary/suggestions');
    
    return response;
  } catch (error) {
    console.error('Lỗi khi thêm từ gợi ý:', error);
    throw error;
  }
};

export const analyzeConversationSession = async (sessionId: string) => {
  try {
    const response = await sendData(`${ANALYSIS_API_URL}/`, 'POST', {
      session_id: sessionId,
    });
    
    if (response.words_added > 0) {
      mutate('/vocabulary/suggestions');
    }
    return response;
  } catch (error) {
    console.error('Lỗi khi gọi API phân tích:', error);
    throw error;
  }
};



export const fetchQuizLobbyData = async () => {
  try {
    const [userDecksRes, publicDecksRes] = await Promise.all([
      getData(`${DECK_API_URL}/`),
      getData(PUBLIC_DECK_API_URL)
    ]);
    
    return {
      userDecks: userDecksRes,
      publicDecks: publicDecksRes
    };
    
  } catch (error) {
    console.error('Lỗi khi tải dữ liệu Quiz Lobby:', error);
    throw error;
  }
};

export const fetchSmartQuiz = async (deckType: string, deckId: number) => {
  try {
    const url = `${QUIZ_DATA_API_URL}/${deckType}-deck/${deckId}`;
    return await getData(url);
  } catch (error) {
    console.error('Lỗi khi tải Smart Quiz:', error);
    throw error;
  }
};

export const postQuizFeedback = async (missedWords: string[]) => {
  try {
    const response = await sendData(`${QUIZ_API_URL}/feedback`, 'POST', {
      missed_words: missedWords,
    });
    
    mutate('/vocabulary/suggestions');
    return response;
  } catch (error) {
    console.error('Lỗi khi gửi Quiz Feedback:', error);
    throw error;
  }
};


export const saveQuizScore = async (deckId: number | null, score: number, total: number) => {
  try {
    return await sendData(`${QUIZ_API_URL}/save-result`, 'POST', {
      deck_id: deckId,
      score: score,
      total_questions: total 
    });
  } catch (error) {
    console.error('Lỗi khi lưu điểm:', error);
    throw error;
  }
};
