export interface Scenario {
  id: string;
  title: string;
}

export interface MessageMetadata {
  grammar_score?: number;
  pronunciation_score?: number;
  fluency_score?: number;
  tips?: string;
  keywords?: string[];
  detected_errors?: string[];
  evaluation?: string;
}

export interface DisplayMessage {
  role: 'user' | 'ai';
  text: string;
  type?: 'feedback' | 'summary' | 'speech' | 'greeting' | 'reply' | 'audio_input';
  audioUrl?: string;
  metadata?: MessageMetadata;
}

export interface HistorySession {
  id: string;
  created_at: string;
  topic: string;
  mode: string;
  level: string;
}

export interface HistoryMessage {
  id?: string;
  role: 'user' | 'ai' | 'system';
  text: string;
  type?: 'feedback' | 'summary' | 'speech' | 'greeting' | 'reply' | 'system' | 'audio_input' | null;
  audioUrl?: string;
  metadata?: MessageMetadata;
}

export interface HistoryDetails extends HistorySession {
  messages: HistoryMessage[];
}