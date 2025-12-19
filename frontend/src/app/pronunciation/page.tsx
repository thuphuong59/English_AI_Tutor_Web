"use client";

import React, { useState, useRef } from "react";
import { Mic, Square, Loader2, RotateCcw, Sparkles, Mic2, BarChart3, CheckCircle2, Info, Volume2 } from "lucide-react";

interface AnalysisResult {
  transcript: string;
  overall_score: number;
  detailed_analysis: { word: string; ipa: string; error: string; fix: string }[];
  quick_tip: string;
}

export default function FreestylePronunciation() {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackData, setFeedbackData] = useState<AnalysisResult | null>(null);
  const [accent, setAccent] = useState<"en-US" | "en-GB">("en-US");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const playSpeech = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    const voices = window.speechSynthesis.getVoices();
    const selectedVoice = voices.find(v => v.lang.includes(accent === "en-US" ? "US" : "GB"));
    if (selectedVoice) utterance.voice = selectedVoice;

    utterance.lang = accent;
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

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
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        handleUpload(audioBlob);
      };
      mediaRecorder.start();
      setIsRecording(true);
      setFeedbackData(null);
    } catch (err) { console.error("Mic denied", err); }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleUpload = async (blob: Blob) => {
    setIsLoading(true);
    const token = localStorage.getItem("access_token");
    const formData = new FormData();
    formData.append("file", blob, "recording.wav");
    
    try {
      const res = await fetch("http://127.0.0.1:8000/api/pronunciation/check-freestyle", {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "X-Accent": accent
        },
        body: formData,
      });
      
      if (res.ok) {
        const data = await res.json();
        setFeedbackData(data);
      }
    } catch (error) { console.error("Fail", error); } finally { setIsLoading(false); }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 h-[calc(100vh-100px)] flex flex-col overflow-hidden text-slate-900">
      <div className="flex justify-end mb-4 gap-2">
        <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-100 flex gap-1">
          <button onClick={() => setAccent("en-US")} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${accent === "en-US" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400"}`}>🇺🇸 US</button>
          <button onClick={() => setAccent("en-GB")} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${accent === "en-GB" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400"}`}>🇬🇧 UK</button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-stretch flex-1 min-h-0 overflow-hidden">
        <div className="w-full lg:w-5/12 flex flex-col h-full">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 flex flex-col items-center justify-between h-full">
            <div className="w-full text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
                <div className="p-2 bg-indigo-100 rounded-lg"><Sparkles size={18} className="text-indigo-600" /></div>
                <h3 className="text-slate-800 font-bold uppercase text-xs tracking-widest">Voice Coach</h3>
              </div>
              <p className="text-slate-500 text-sm">Mode: {accent === "en-US" ? "American" : "British"} Accent</p>
            </div>

            <div className="relative group flex flex-col items-center">
              <div className="relative">
                {isRecording && <div className="absolute inset-0 flex items-center justify-center"><div className="w-32 h-32 bg-indigo-500/20 rounded-full animate-ping"></div></div>}
                {!isRecording ? (
                  <button onClick={startRecording} disabled={isLoading} className="relative z-10 w-24 h-24 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-all disabled:opacity-50"><Mic size={36} /></button>
                ) : (
                  <button onClick={stopRecording} className="relative z-10 w-24 h-24 bg-rose-500 text-white rounded-full shadow-2xl flex items-center justify-center animate-pulse"><Square size={32} fill="white" /></button>
                )}
              </div>
              <p className="mt-6 font-black text-[10px] uppercase tracking-[0.3em] text-slate-400">{isRecording ? "Listening..." : isLoading ? "Processing..." : "Tap to speak"}</p>
            </div>
            <div className="w-full pt-6 border-t border-slate-50 text-center"><p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">AI Engine</p></div>
          </div>
        </div>

        <div className="w-full lg:w-7/12 flex flex-col h-full min-h-0">
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col h-full overflow-hidden">
            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="relative mb-6"><div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div><BarChart3 className="absolute inset-0 m-auto text-indigo-600" size={24} /></div>
                <h4 className="text-indigo-900 font-bold">AI Analyzing...</h4>
              </div>
            ) : feedbackData ? (
              <div className="flex flex-col h-full min-h-0">
                <div className="bg-slate-900 px-8 py-5 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-500 rounded-xl flex flex-col items-center justify-center"><span className="text-white font-black">{feedbackData.overall_score}</span></div>
                    <span className="text-white text-[10px] font-black uppercase tracking-widest">Analysis Result</span>
                  </div>
                  <button onClick={() => setFeedbackData(null)} className="text-white/30 hover:text-white transition-all bg-white/10 p-2 rounded-lg"><RotateCcw size={16} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 min-h-0">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-3">Transcript</p>
                    <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl">
                      <p className="text-slate-800 text-lg italic">"{feedbackData.transcript}"</p>
                      <button onClick={() => playSpeech(feedbackData.transcript)} className="p-2 text-indigo-600"><Volume2 size={20} /></button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-indigo-900 uppercase">Details</p>
                    {feedbackData.detailed_analysis.map((item, idx) => (
                      <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm group">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-baseline gap-3"><span className="text-rose-500 font-bold text-lg">{item.word}</span><span className="text-slate-400 font-mono text-sm">{item.ipa}</span></div>
                          <button onClick={() => playSpeech(item.word)} className="p-2 bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white rounded-full"><Volume2 size={16} /></button>
                        </div>
                        <p className="text-slate-500 text-xs mb-2 italic">"{item.error}"</p>
                        <div className="flex items-start gap-2 pt-2 border-t border-slate-50"><Info size={12} className="text-emerald-500 mt-0.5" /><p className="text-slate-700 text-xs font-medium"><span className="text-emerald-600 font-bold">Fix:</span> {item.fix}</p></div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100 flex gap-4 items-center"><Mic2 size={18} className="text-indigo-600" /><p className="text-indigo-900 text-xs font-semibold italic">"{feedbackData.quick_tip}"</p></div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center opacity-40 h-full"><Mic2 size={64} className="text-slate-200" /><h4 className="text-slate-800 font-bold mb-2">Ready to Analyze</h4></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}