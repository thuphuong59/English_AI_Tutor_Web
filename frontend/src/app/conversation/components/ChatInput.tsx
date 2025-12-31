"use client";

import { useState, useRef, useEffect, FC, KeyboardEvent } from "react";
import { Mic, Send, StopCircle, X, Loader2, CheckCircle } from "lucide-react";

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onFinish?: () => void; // Prop nhận hàm xử lý kết thúc
  loading: boolean;
  onVoiceMessage: (audioBlob: Blob, audioUrl: string) => void;
  mode: "scenario" | "free";
  disabled: boolean;
}

type Status = "idle" | "recording" | "reviewing";

const ChatInput: FC<ChatInputProps> = ({
  input,
  onInputChange,
  onSend,
  onFinish,
  loading,
  onVoiceMessage,
  mode,
  disabled,
}) => {
  const [status, setStatus] = useState<Status>("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioPreview, setAudioPreview] = useState<{ blob: Blob; url: string } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioPreview?.url) URL.revokeObjectURL(audioPreview.url);
    };
  }, [audioPreview]);

  const startRecording = async () => {
    if (loading || disabled || status !== "idle") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        if (!audioChunksRef.current.length) {
          setStatus("idle");
          return;
        }
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioPreview({ blob, url });
        setRecordingTime(0);
        setStatus("reviewing");
      };
      recorder.start();
      setStatus("recording");
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch (err) {
      alert("Microphone permission denied.");
      setStatus("idle");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && status === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const handleSendAudio = () => {
    if (!audioPreview || loading || disabled) return;
    audioPlayerRef.current?.pause();
    onVoiceMessage(audioPreview.blob, audioPreview.url);
    URL.revokeObjectURL(audioPreview.url);
    setAudioPreview(null);
    setStatus("idle");
  };

  const handleCancelAudio = () => {
    audioPlayerRef.current?.pause();
    if (audioPreview?.url) URL.revokeObjectURL(audioPreview.url);
    setAudioPreview(null);
    setStatus("idle");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !loading && !disabled && status === "idle") {
        onSend();
      }
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const isInputDisabled = loading || disabled || status !== "idle";

  if (status === "recording") {
    return (
      <div className="flex items-center justify-between w-full px-5 py-3 rounded-2xl bg-red-50 border border-red-100 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
          <span className="font-medium text-red-600 tabular-nums">{formatTime(recordingTime)}</span>
        </div>
        <button onClick={stopRecording} className="p-2 rounded-full bg-white text-red-500 hover:bg-red-100 transition shadow-sm">
          <StopCircle size={20} />
        </button>
      </div>
    );
  }

  if (status === "reviewing" && audioPreview) {
    return (
      <div className="flex items-center gap-3 w-full px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm">
        <button onClick={handleCancelAudio} className="p-2 rounded-full text-slate-400 hover:text-red-500 transition">
          <X size={18} />
        </button>
        <audio ref={audioPlayerRef} src={audioPreview.url} controls className="flex-1 h-8" />
        <button onClick={handleSendAudio} disabled={loading} className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-400 transition shadow-sm">
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
    );
  }

  if (mode === "scenario") {
    return (
      <div className="flex justify-center w-full py-2">
        <button
          onClick={startRecording}
          disabled={loading || disabled}
          className={`flex items-center gap-3 px-10 py-4 rounded-full text-lg font-semibold transition-all ${
            loading || disabled ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-lg"
          }`}
        >
          <Mic size={26} />
          Tap to speak
        </button>
      </div>
    );
  }

  // 💬 FREE TALK MODE UI
  return (
    <div className="flex items-center gap-3 w-full animate-in fade-in zoom-in-95 duration-200">
      <div
        className={`flex-1 flex items-center gap-2 px-4 py-3 rounded-full border transition ${
          isInputDisabled ? "bg-slate-100 border-transparent" : "bg-white border-slate-300 focus-within:ring-4 focus-within:ring-blue-100 shadow-sm"
        }`}
      >
        <input
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isInputDisabled}
          placeholder={disabled ? "Please wait…" : "Type a message"}
          className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
        />

        {input.trim() && (
          <button onClick={onSend} disabled={loading || disabled} className="text-blue-600 hover:scale-110 transition p-1">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Nút Finish luôn hiện ở mode Free Talk khi không ghi âm */}
        {!input.trim() && onFinish && (
          <button
            onClick={onFinish}
            disabled={loading || disabled}
            className="flex items-center gap-2 px-4 h-11 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-md disabled:opacity-50 text-sm font-medium whitespace-nowrap"
            title="Finish and Analyze"
          >
            <CheckCircle size={18} />
            <span className="hidden sm:inline">Finish</span>
          </button>
        )}

        {/* Nút Mic */}
        {!input.trim() && (
          <button
            onClick={startRecording}
            disabled={loading || disabled}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition shadow-md ${
              loading || disabled ? "bg-slate-100 text-slate-300" : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
            }`}
          >
            <Mic size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatInput;