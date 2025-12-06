import { useState, useRef, useEffect, FC } from "react";
import { Mic, MicOff, Send, Trash2 } from "lucide-react";

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  loading: boolean;
  // Truyền cả Blob (để gửi API) và URL (để hiển thị UI ngay)
  onVoiceMessage?: (audioBlob: Blob, audioUrl: string) => void;
  mode: "scenario" | "free";
}

type Status = "idle" | "recording" | "reviewing";

const ChatInput: FC<ChatInputProps> = ({
  input,
  onInputChange,
  onSend,
  loading,
  onVoiceMessage,
  mode,
}) => {
  const [status, setStatus] = useState<Status>("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const [micSupported, setMicSupported] = useState(false);
  const [audioPreview, setAudioPreview] = useState<{ blob: Blob; url: string } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && navigator.mediaDevices) {
      setMicSupported(true);
    }
  }, []);

  const startRecording = async () => {
    if (!micSupported) return alert("Microphone not supported.");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Ghi âm định dạng webm (chuẩn browser)
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecordingTime(0);
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

        if (audioBlob.size > 0) {
          const audioUrl = URL.createObjectURL(audioBlob);
          setAudioPreview({ blob: audioBlob, url: audioUrl });
          setStatus("reviewing");
        } else setStatus("idle");
      };

      mediaRecorder.start();
      setStatus("recording");
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch (err) {
      console.error(err);
      alert("Microphone access denied or not found.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && status === "recording") {
      mediaRecorderRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleDiscardAudio = () => {
    if (audioPreview) URL.revokeObjectURL(audioPreview.url);
    setAudioPreview(null);
    setStatus("idle");
  };

  const handleSendAudio = () => {
    if (audioPreview && onVoiceMessage) {
      // Gửi audio đi
      onVoiceMessage(audioPreview.blob, audioPreview.url);
      // Reset state
      setAudioPreview(null);
      setStatus("idle");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  // GIAO DIỆN REVIEW 
  if (status === "reviewing" && audioPreview) {
    return (
      <div className="flex items-center gap-3 p-3 border-t border-slate-300/40 bg-white/80 backdrop-blur-xl shadow-lg rounded-t-2xl animate-slideUp">
        <button
          onClick={handleDiscardAudio}
          disabled={loading}
          title="Discard recording"
          className="w-11 h-11 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all"
        >
          <Trash2 size={20} />
        </button>
        
        <div className="flex-1 bg-slate-100 rounded-full px-2 py-1">
             <audio src={audioPreview.url} controls className="w-full h-9" />
        </div>
        
        <button
          onClick={handleSendAudio}
          disabled={loading}
          title="Send recording"
          className="w-11 h-11 flex items-center justify-center rounded-full bg-[#0067C5] text-white shadow-md hover:bg-[#0052A3] hover:scale-105 active:scale-95 transition-all"
        >
          <Send size={20} />
        </button>
      </div>
    );
  }

  //  (Nhập text hoặc Ghi âm) 
  return (
    <div
      className={`flex items-center gap-3 p-4 border-t border-slate-300/40 bg-white/70 backdrop-blur-xl shadow-[0_-2px_20px_rgba(0,0,0,0.04)] transition-all rounded-t-2xl ${
        mode === "scenario" && status === "idle" ? "justify-center" : ""
      }`}
    >
      {/* Nút Micro */}
      <button
        onClick={status === "recording" ? stopRecording : startRecording}
        disabled={loading || !micSupported}
        title={status === "recording" ? "Stop recording" : "Start recording"}
        className={`w-12 h-12 flex items-center justify-center rounded-full shadow-lg transition-all duration-300 relative overflow-hidden ${
          status === "recording"
            ? "bg-red-500 text-white ring-4 ring-red-200 hover:bg-red-600 animate-pulse"
            : "bg-white text-[#0067C5] border border-[#0067C5] hover:bg-[#0067C5] hover:text-white"
        }`}
      >
        {status === "recording" ? <MicOff size={22} /> : <Mic size={22} />}
      </button>

      {/* Text Input (Chỉ hiện ở chế độ Free talk và khi không ghi âm) */}
      {mode === "free" && status === "idle" && (
        <div className="flex-1 relative animate-fadeIn">
          <input
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={loading}
            className="w-full bg-white/60 backdrop-blur-md border border-slate-200/50 rounded-full px-5 pr-12 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0067C5] focus:border-[#0067C5] transition-all shadow-inner"
          />
          <button
            onClick={onSend}
            disabled={loading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#0067C5] text-white rounded-full p-2.5 hover:bg-[#0052A3] hover:scale-110 active:scale-95 transition-all duration-300 disabled:opacity-40"
          >
            <Send size={18} />
          </button>
        </div>
      )}

      {/* Text thông báo đang ghi âm */}
      {status === "recording" && (
        <div className="flex-1 text-center text-sm font-semibold text-red-500 animate-pulse tracking-wide flex items-center justify-center gap-2">
           <div className="w-2 h-2 rounded-full bg-red-500"></div>
           Recording... {recordingTime}s
        </div>
      )}
    </div>
  );
};

export default ChatInput;