"use client";

import React, { useEffect, useRef } from "react";
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

  const percentage = Math.round((score / total) * 100);

  return (
    <div className="w-full max-w-2xl mx-auto py-8 text-center">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">Quiz Completed!</h2>
      
      <p className="text-xl text-gray-600 mb-2">
        Your Score:
      </p>
      {/* Điểm % lớn */}
      <div className="text-7xl font-bold text-blue-600 mb-2">{percentage}%</div>
      {/* Điểm phân số (ví dụ: 8 / 10) */}
      <div className="text-lg text-gray-500 font-medium mb-8">
        {score} / {total} Correct
      </div>
      

      <button
        onClick={onRestart}
        className="px-10 py-3 bg-blue-600 text-white font-semibold rounded-lg
                   transition-all duration-200 
                   hover:bg-blue-700 focus:outline-none 
                   focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      >
        Play Again
      </button>
      
      {/* DANH SÁCH TỪ SAI */}
      {missedWords.length > 0 && (
        <div className="mt-12 pt-8 border-t border-gray-200 text-left">
          <h4 className="font-semibold text-xl text-gray-700 mb-2">Words to review:</h4>
          <p className="text-sm text-gray-500 mb-4">
            (We've added these to your "AI Suggestions" list for you to practice later!)
          </p>
          <div className="flex flex-col gap-2">
            {missedWords.map((word) => (
              <div 
                key={word} 
                className="bg-gray-100 p-3 rounded-md flex justify-between items-center"
              >
                <span className="font-medium text-gray-800">{word}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}