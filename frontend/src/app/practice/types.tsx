// Định nghĩa cho một Bộ từ (Deck)
export type Deck = {
  id: number; 
  name: string;
  description: string;
  wordCount: number;
};

// Định nghĩa cho "Câu hỏi Thông minh" (Smart Question) từ API
export type SmartQuestion = {
  word: string; 
  type: "MC_V2D" | "MC_C2V" | "TYPE_D2V"; 
  questionText: string;
  options?: string[];
  correctAnswer: string;
};