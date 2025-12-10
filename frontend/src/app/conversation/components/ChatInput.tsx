"use client";

import { useState, useRef, useEffect, FC, KeyboardEvent } from "react";
import { Mic, MicOff, Send, StopCircle, X } from "lucide-react";

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  loading: boolean;
  onVoiceMessage?: (audioBlob: Blob, audioUrl: string) => void;
  mode: "scenario" | "free";
}

type Status = 'idle' | 'recording' | 'reviewing';

const ChatInput: FC<ChatInputProps> = ({
  input,
  onInputChange,
  onSend,
  loading,
  onVoiceMessage,
  mode,
}) => {
  const [status, setStatus] = useState<Status>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioPreview, setAudioPreview] = useState<{ blob: Blob, url: string } | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // --- Logic Ghi âm (Giữ nguyên logic, chỉ đổi UI) ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioPreview({ blob: audioBlob, url: audioUrl });
        setStatus('reviewing');
        setRecordingTime(0);
      };

      mediaRecorder.start();
      setStatus('recording');
      timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (err) {
      console.error("Microphone error:", err);
      alert("Cannot access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && status === 'recording') {
      mediaRecorderRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleSendAudio = () => {
    if (audioPreview && onVoiceMessage) {
      onVoiceMessage(audioPreview.blob, audioPreview.url);
      setAudioPreview(null);
      setStatus('idle');
    }
  };

  const handleCancelAudio = () => {
    setAudioPreview(null);
    setStatus('idle');
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  // --- RENDER COMPACT UI ---

  // 1. Trạng thái Đang ghi âm (Hiển thị thanh đỏ nhỏ gọn)
  if (status === 'recording') {
    return (
      <div className="flex items-center justify-between bg-red-50 border border-red-100 rounded-full px-4 py-2 animate-in fade-in slide-in-from-bottom-2">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <span className="text-red-600 font-medium text-sm tabular-nums">
            {formatTime(recordingTime)}
          </span>
          <span className="text-red-400 text-xs">Recording...</span>
        </div>
        
        <button 
          onClick={stopRecording}
          className="bg-white text-red-500 p-2 rounded-full shadow-sm hover:bg-red-100 transition-colors"
        >
          <StopCircle size={20} fill="currentColor" className="text-red-100" />
        </button>
      </div>
    );
  }

  // 2. Trạng thái Review Audio (Thanh phát lại nhỏ gọn)
  if (status === 'reviewing' && audioPreview) {
    return (
      <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full p-1 pr-2 animate-in fade-in slide-in-from-bottom-2">
        <button 
          onClick={handleCancelAudio}
          className="p-2 rounded-full text-slate-400 hover:text-red-500 hover:bg-white transition-colors"
        >
          <X size={18} />
        </button>
        
        <div className="flex-1 h-8 bg-white rounded-full flex items-center px-3 overflow-hidden">
           <audio src={audioPreview.url} controls className="h-6 w-full max-w-[200px]" />
        </div>

        <button 
          onClick={handleSendAudio}
          disabled={loading}
          className="bg-blue-600 text-white p-2 rounded-full shadow-sm hover:bg-blue-700 transition-colors"
        >
          <Send size={18} />
        </button>
      </div>
    );
  }

  // 3. Trạng thái Bình thường (Input + Mic nhỏ)
  return (
    <div className="flex items-center gap-2">
      {/* Input Field */}
      <div className="flex-1 bg-slate-100 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 border border-transparent focus-within:border-blue-300 rounded-full transition-all flex items-center px-4 py-2.5">
        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={mode === 'scenario' ? "Type your answer..." : "Type a message..."}
          disabled={loading}
          className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 placeholder:text-slate-400"
        />
        {input.trim() && (
          <button 
            onClick={onSend}
            disabled={loading}
            className="ml-2 text-blue-600 hover:text-blue-700 transition-transform hover:scale-110"
          >
            <Send size={18} />
          </button>
        )}
      </div>

      {/* Mic Button - Nhỏ gọn */}
      {!input.trim() && (
        <button
          onClick={startRecording}
          disabled={loading}
          className={`flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-full transition-all shadow-sm ${
            loading 
              ? 'bg-slate-100 text-slate-300' 
              : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md active:scale-95'
          }`}
        >
          <Mic size={20} />
        </button>
      )}
    </div>
  );
}

export default ChatInput;