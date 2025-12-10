"use client";
import React, { useState, FormEvent, useEffect } from "react"; 
import { SmartQuestion } from "@/app/practice/types";

type Props = {
  question: SmartQuestion;
  onSubmit: (isCorrect: boolean) => void;
};

export default function GameMode3_TypeD2V({ question, onSubmit }: Props) {
  const [answer, setAnswer] = useState("");
  const [isAnswered, setIsAnswered] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  
  // Tự reset khi câu hỏi thay đổi
  useEffect(() => {
    setAnswer("");
    setIsAnswered(false);
    setFeedback(null);
  }, [question]); // Theo dõi 'question' prop

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isAnswered) return; // Không cho gửi 2 lần

    const isCorrect = answer.trim().toLowerCase() === question.correctAnswer.toLowerCase();
    
    setIsAnswered(true); // Khóa input/button
    setFeedback(isCorrect ? "correct" : "incorrect");
    
    // Gửi kết quả cho cha (cha sẽ bắt đầu setTimeout)
    onSubmit(isCorrect);
  };

  const getBorderColor = () => {
    if (!isAnswered) return "border-gray-300 focus:border-blue-500";
    return feedback === "correct" ? "border-green-500" : "border-red-500";
  };

  return (
    <div>
      <p className="text-sm font-semibold text-blue-600 mb-2">Type the word</p>
      <h2 className="text-2xl font-medium text-gray-800 mb-8 leading-relaxed">
        {question.questionText}
      </h2>
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={isAnswered} // Bị khóa khi đã trả lời
          className={`w-full p-4 text-lg border-2 rounded-lg ${getBorderColor()} 
                      focus:outline-none focus:ring-2 focus:ring-blue-300
                      transition-all duration-200
                      disabled:bg-gray-50`}
          placeholder="Type the word..."
        />
        
        {isAnswered && feedback === "incorrect" && (
          <p className="text-red-600 mt-2">
            Correct answer: <b>{question.correctAnswer}</b>
          </p>
        )}
        
        <button
          type="submit"
          disabled={isAnswered || answer.length === 0} // Bị khóa khi đã trả lời
          className="w-full mt-4 p-3 bg-blue-600 text-white font-semibold rounded-lg
                     transition-all duration-200
                     hover:bg-blue-700
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Check Answer
        </button>
      </form>
    </div>
  );
} 