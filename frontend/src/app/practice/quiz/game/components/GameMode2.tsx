"use client";
import React, { useState, useEffect } from "react"; // 1. Import useEffect
import { SmartQuestion } from "@/app/practice/types";
import OptionButton from "./optionButton"; 

type Props = {
  question: SmartQuestion;
  onSubmit: (isCorrect: boolean) => void;
};

export default function GameMode2_McC2V({ question, onSubmit }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // Tự reset khi câu hỏi thay đổi
  useEffect(() => {
    setSelected(null);
    setIsAnswered(false);
  }, [question]); // Theo dõi 'question' prop

  const handleClick = (option: string) => {
    if (isAnswered) return;
    
    const isCorrect = option === question.correctAnswer;
    setSelected(option);
    setIsAnswered(true); // Khóa các nút lại
    
    // Gửi kết quả cho cha (cha sẽ bắt đầu setTimeout)
    onSubmit(isCorrect);
  };
  
  const questionText = question.questionText.replace(
    /________/g,
    `<span class="font-bold text-blue-600">[...]</span>`
  );

  return (
    <div>
      <p className="text-sm font-semibold text-blue-600 mb-2">Fill in the blank</p>
      <h2 
        className="text-2xl font-medium text-gray-800 mb-8 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: questionText }}
      />
      
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