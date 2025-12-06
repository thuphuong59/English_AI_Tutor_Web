import { useRef, useLayoutEffect } from "react";
import { Volume2, Lightbulb, FileText, Star, Sparkles, Mic } from "lucide-react";
import { DisplayMessage } from "../types";

interface ChatAreaProps {
  messages: DisplayMessage[];
  loading: boolean;
  onSpeak: (text: string) => void;
}

const renderIconForType = (
  type?: "feedback" | "summary" | "speech" | "greeting" | "reply" | "audio_input"
) => {
  if (type === "feedback") return <Lightbulb className="w-5 h-5 text-[#0067C5] mt-1" />;
  if (type === "summary") return <FileText className="w-5 h-5 text-[#0067C5] mt-1" />;
  if (type === "speech") return <Star className="w-5 h-5 text-[#0067C5] mt-1" />;
  if (type === "audio_input") return <Mic className="w-5 h-5 text-white mt-1" />;
  
  return (
    <div className="w-8 h-8 rounded-full bg-[#0067C5]/10 flex items-center justify-center text-sm font-bold text-[#0067C5] shadow-sm mt-0.5">
      AI
    </div>
  );
};

// --- METADATA (SỬA ĐỂ ẨN GRAMMAR NẾU NULL) ---
const renderMetadata = (metadata?: DisplayMessage["metadata"]) => {
  if (!metadata) return null;
  const { grammar_score, pronunciation_score, fluency_score, tips } = metadata;
  
  // Chỉ hiển thị nếu giá trị KHÁC null và KHÁC undefined
  const showGrammar = grammar_score !== undefined && grammar_score !== null;
  const showPronunciation = pronunciation_score !== undefined && pronunciation_score !== null;
  const showFluency = fluency_score !== undefined && fluency_score !== null;

  const hasScores = showGrammar || showPronunciation || showFluency;

  return (
    <div className="mt-2 pt-2 border-t border-slate-200/60 text-xs text-slate-600 space-y-1.5">
      {hasScores && (
        <div className="flex flex-wrap gap-2">
          {/* Chỉ render nếu showGrammar = true */}
          {showGrammar && (
            <span className="px-2 py-0.5 rounded-md bg-[#0067C5]/10 text-[#0067C5] border border-[#0067C5]/20">
              Grammar: <span className="font-semibold">{(grammar_score! * 100).toFixed(0)}%</span>
            </span>
          )}
          {showPronunciation && (
            <span className="px-2 py-0.5 rounded-md bg-[#0067C5]/10 text-[#0067C5] border border-[#0067C5]/20">
              Pronunciation: <span className="font-semibold">{(pronunciation_score! * 100).toFixed(0)}%</span>
            </span>
          )}
          {showFluency && (
            <span className="px-2 py-0.5 rounded-md bg-[#0067C5]/10 text-[#0067C5] border border-[#0067C5]/20">
              Fluency: <span className="font-semibold">{(fluency_score! * 100).toFixed(0)}%</span>
            </span>
          )}
        </div>
      )}
      {tips && (
        <div className="flex items-start gap-1.5 text-slate-700">
          <span className="font-medium text-[#0067C5] mt-px">💡</span>
          <span><span className="font-medium">Tip:</span> {tips}</span>
        </div>
      )}
    </div>
  );
};

export default function ChatArea({ messages, loading, onSpeak }: ChatAreaProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = scrollContainerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-white via-slate-50 to-[#EAF3FB] min-h-0 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent"
    >
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center px-4 select-none">
          <Sparkles className="w-10 h-10 text-[#0067C5] mb-3 animate-pulse" strokeWidth={1.5} />
          <h2 className="text-2xl font-semibold text-[#0067C5] mb-2">Ready to Practice?</h2>
          <p className="text-slate-500 max-w-sm text-sm">
            Your interactive English conversation starts here. Use your voice or type to begin.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              } animate-fadeIn`}
            >
              {msg.role === "ai" && renderIconForType(msg.type)}

              <div
                className={`max-w-[80%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl shadow-md transition-all duration-300 ${
                  msg.role === "user"
                    ? "bg-[#0067C5] text-white rounded-br-none shadow-[0_2px_10px_rgba(0,103,197,0.3)]"
                    : "bg-white/80 backdrop-blur-sm text-slate-800 border border-slate-200 rounded-bl-none shadow-[0_2px_12px_rgba(0,0,0,0.05)]"
                }`}
              >
                {/* AUDIO PLAYER */}
                {msg.audioUrl && (
                  <div className={`mb-2 rounded-lg overflow-hidden ${msg.role === "user" ? "bg-white/20" : "bg-slate-100"}`}>
                    <audio controls src={msg.audioUrl} className="w-full h-8 min-w-[200px]" />
                  </div>
                )}

                {/* TEXT CONTENT */}
                {msg.audioUrl && !msg.text ? (
                  <p className="text-xs opacity-80 italic flex items-center gap-1">
                    <span className="animate-pulse">Processing audio...</span>
                  </p>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                  </p>
                )}

                {/* METADATA (Scores & Tips) */}
                {(msg.type === "feedback" || msg.type === "summary") &&
                  renderMetadata(msg.metadata)}
              </div>

              {/* SPEAK BUTTON */}
              {msg.role === "ai" && msg.text && (
                <button
                  onClick={() => onSpeak(msg.text)}
                  title="Listen"
                  className="p-2 text-slate-400 hover:text-[#0067C5] hover:bg-[#EAF3FB] rounded-full transition-all duration-300 shadow-sm hover:shadow-md flex-shrink-0 self-center"
                >
                  <Volume2 size={18} />
                </button>
              )}
            </div>
          ))}

          {/* LOADING INDICATOR */}
          {loading && (
            <div className="flex justify-start items-start gap-3">
              {renderIconForType()}
              <div className="bg-white/80 px-4 py-3 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex space-x-1.5">
                  <div className="w-2 h-2 bg-[#0067C5] rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-[#0067C5] rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-[#0067C5] rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}