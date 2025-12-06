export interface MyWord {
  definition: string;
  id: number;
  word: string;
  type?: string; // <--- Thêm trường loại từ (noun, verb...)
  pronunciation: string | null;
  audio_url: string | null;
  context_sentence: string | null;
  status: 'learning' | 'mastered';
  next_review_date: string;
}

export interface Suggestion {
  id: number;
  word: string;
  type?: string; // <--- Thêm trường loại từ
  pronunciation: string | null;
  audio_url: string | null;
  definition: string;
  context_sentence: string | null;
}

export interface StatsData {
  review_today: number;
  learning: number;
  mastered: number;
}

// Dùng cho API /dashboard
export interface DashboardData {
  stats: StatsData;
  my_words: MyWord[];
  suggestions: Suggestion[];
}

export interface Deck {
  id: number;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

// Kiểu dữ liệu trả về từ API GET /api/decks
export interface DeckWithStats extends Deck {
  stats: StatsData;
}

export interface DeckDetail {
  deck_info: Deck;            // Thông tin của bộ từ (Tên, mô tả...)
  stats: StatsData;           // Thống kê của riêng bộ từ này
  words: MyWord[];            // Danh sách các từ trong bộ này
}

export interface PublicDeck {
  id: number;
  name: string;
  level: string | null;
  description: string | null;
  created_at: string; 
}

export interface PublicWord {
  id: number;
  deck_id: number;
  word: string;
  type?: string; // <--- Thêm trường loại từ
  definition: string;
  pronunciation: string | null;
  context_sentence: string | null;
  audio_url: string | null;
}

export interface PublicDeckDetail {
  deck_info: PublicDeck;
  words: PublicWord[];
}