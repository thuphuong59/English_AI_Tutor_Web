"use client";

import { useState, useRef, useEffect } from "react";
import { Volume2, Loader2, Mic, User, Bot } from "lucide-react";

interface DialogueLineProps {
  text: string;
  speaker: "ai" | "user"; 
  onRecord?: () => void; 
}

export const DialogueLine: React.FC<DialogueLineProps> = ({ text, speaker, onRecord }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Dọn dẹp audio khi component unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handlePlayAudio = async () => {
    // Nếu đang phát thì dừng lại
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);

    try {
      // Gọi API Backend để lấy audio
      const response = await fetch("http://127.0.0.1:8000/audio/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error("Failed to fetch audio");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const audio = new Audio(url);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url); // Dọn dẹp bộ nhớ
      };

      audio.onerror = () => {
        setIsPlaying(false);
        setIsLoading(false);
        alert("Lỗi khi phát âm thanh.");
      };

      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("Error playing audio:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isAI = speaker === 'ai';

  return (
    <div className={`flex items-start gap-4 p-4 rounded-2xl transition-all duration-200 border group hover:shadow-sm ${
      isAI 
        ? 'bg-white border-slate-200' 
        : 'bg-blue-50 border-blue-100'
    }`}>
      
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
        isAI ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-200 text-blue-700'
      }`}>
        {isAI ? <Bot size={20} /> : <User size={20} />}
      </div>
      <div className="flex-1 min-w-0"> 
        <div className="flex justify-between items-center mb-1">
          <span className={`text-xs font-bold uppercase tracking-wider ${
            isAI ? 'text-indigo-500' : 'text-blue-600'
          }`}>
            {isAI ? 'AI Partner' : 'You'}
          </span>
        </div>
        
        <p className="text-slate-800 text-[15px] leading-relaxed font-medium">
          {text}
        </p>
      </div>

      <div className="flex gap-2 self-start mt-1">
        <button
          onClick={handlePlayAudio}
          disabled={isLoading}
          className={`w-9 h-9 flex items-center justify-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 ${
            isPlaying 
              ? "bg-indigo-600 text-white shadow-md scale-105" 
              : "bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
          }`}
          title="Nghe mẫu phát âm"
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Volume2 size={18} className={isPlaying ? "animate-pulse" : ""} />
          )}
        </button>

        {/* Nút Ghi âm (Chỉ hiện cho vai User nếu có prop onRecord) */}
        {!isAI && onRecord && (
          <button
            onClick={onRecord}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 hover:scale-105 transition-all shadow-sm"
            title="Ghi âm câu này"
          >
            <Mic size={18} />
          </button>
        )}
      </div>
    </div>
  );
};