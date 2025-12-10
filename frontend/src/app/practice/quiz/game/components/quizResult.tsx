"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Trophy, CheckCircle, XCircle } from "lucide-react";
import { postQuizFeedback } from "@/services/vocabService";

type Props = {
  score: number;
  total: number;
  missedWords: string[]; 
  onRestart: () => void;
};

export default function QuizResult({ score, total, missedWords, onRestart }: Props) {
  
  const feedbackSent = useRef(false);

  // Logic gọi API 
  useEffect(() => {
    if (missedWords.length > 0 && !feedbackSent.current) {
      feedbackSent.current = true;
      console.log("Gửi các từ sai lên server (CHỈ 1 LẦN):", missedWords);
      try {
        postQuizFeedback(missedWords);
      } catch (error) {
        console.error("Không thể gửi feedback:", error);
      }
    }
  }, [missedWords]);

  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  
  // Xác định màu sắc và lời chúc dựa trên điểm số
  let message = "Good effort!";
  let iconColor = "text-blue-500";
  if (percentage >= 80) {
    message = "Excellent job!";
    iconColor = "text-yellow-500";
  } else if (percentage < 50) {
    message = "Keep practicing!";
    iconColor = "text-slate-400";
  }

  return (
    <div className="w-full max-w-2xl mx-auto py-10 text-center animate-in fade-in zoom-in-95 duration-500">
      
      {/* Icon Trophy */}
      <div className="mb-6 flex justify-center">
        <div className={`p-4 rounded-full bg-white shadow-xl shadow-slate-200/50 ring-4 ring-slate-50 ${iconColor}`}>
          <Trophy size={64} strokeWidth={1.5} className="drop-shadow-sm" />
        </div>
      </div>

      <h2 className="text-3xl font-extrabold text-slate-800 mb-2">{message}</h2>
      <p className="text-slate-500 mb-8 text-lg font-medium">You have completed the quiz.</p>
      
      {/* Score Card */}
      <div className="bg-white rounded-3xl p-8 mb-10 shadow-lg border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-indigo-500" />
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
          <div className="text-center">
            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Score</div>
            <div className="text-6xl font-black text-blue-600 tracking-tighter">{percentage}%</div>
          </div>
          
          <div className="w-px h-16 bg-slate-200 hidden md:block"></div>
          
          <div className="text-center">
            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Correct</div>
            <div className="text-4xl font-bold text-slate-700 flex items-center justify-center gap-2">
              <span className="text-emerald-500">{score}</span>
              <span className="text-slate-300 text-2xl">/</span>
              <span>{total}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Action Buttons - Redesigned */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
        {/* Nút Back - Style Ghost/Secondary */}
        <Link 
          href="/quiz"
          className="group flex items-center justify-center gap-2 px-6 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl
                     transition-all duration-300 ease-out
                     hover:bg-slate-200 hover:text-slate-900 hover:scale-105 active:scale-95"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Decks</span>
        </Link>

        {/* Nút Play Again - Style Primary Gradient */}
        <button
          onClick={onRestart}
          className="group flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl
                     shadow-[0_8px_20px_-6px_rgba(79,70,229,0.4)]
                     transition-all duration-300 ease-out
                     hover:shadow-[0_12px_24px_-6px_rgba(79,70,229,0.5)] hover:scale-105 hover:-translate-y-0.5 active:scale-95 active:translate-y-0"
        >
          <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
          <span>Play Again</span>
        </button>
      </div>
      
      {/* DANH SÁCH TỪ SAI */}
      {missedWords.length > 0 && (
        <div className="bg-red-50/50 rounded-2xl border border-red-100 p-6 sm:p-8 text-left animate-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <XCircle size={20} />
            </div>
            <div>
              <h4 className="font-bold text-lg text-slate-800">Review Required</h4>
              <p className="text-xs text-slate-500 font-medium">Added to AI Suggestions for practice</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {missedWords.map((word) => (
              <div 
                key={word} 
                className="bg-white border border-red-100 p-3 rounded-xl flex justify-between items-center shadow-sm"
              >
                <span className="font-semibold text-slate-700 pl-1">{word}</span>
                <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md uppercase tracking-wide">Missed</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 