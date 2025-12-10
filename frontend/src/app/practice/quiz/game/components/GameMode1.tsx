"use client";
import React, { useState, useEffect } from "react"; 
import { SmartQuestion } from "@/app/practice/types";
import OptionButton from "./optionButton"; 

type Props = {
  question: SmartQuestion;
  onSubmit: (isCorrect: boolean) => void;
};

export default function GameMode1_McV2D({ question, onSubmit }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // Tự reset khi câu hỏi thay đổi
  useEffect(() => {
    setSelected(null);
    setIsAnswered(false);
  }, [question]); // Theo dõi 'question' prop

  const handleClick = (option: string) => {
    // Không cho nhấp lại khi đã trả lời
    if (isAnswered) return;
    
    const isCorrect = option === question.correctAnswer;
    setSelected(option);
    setIsAnswered(true); // Khóa các nút lại
    
    // Gửi kết quả (đúng/sai) cho component cha
    // Cha sẽ bắt đầu setTimeout
    onSubmit(isCorrect);
  };

  return (
    <div>
      <p className="text-sm font-semibold text-blue-600 mb-2">Choose the correct definition</p>
      <h2 className="text-3xl font-bold text-gray-800 mb-8">
        {question.questionText}
      </h2>
      
      <div className="flex flex-col gap-3">
        {question.options?.map((opt) => (
          <OptionButton
            key={opt}
            text={opt}
            onClick={() => handleClick(opt)}
            isAnswered={isAnswered}
            isCorrect={opt === question.correctAnswer}
            isSelected={opt === selected}
          />
        ))}
      </div>
    </div>
  );
} 