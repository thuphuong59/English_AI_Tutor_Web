"use client";
import React from "react";

type Props = {
  text: string;
  onClick: () => void;
  isAnswered: boolean;
  isCorrect: boolean;
  isSelected: boolean;
};

export default function OptionButton({ text, onClick, isAnswered, isCorrect, isSelected }: Props) {

  const getButtonClass = () => {
    if (isAnswered) {
      if (isCorrect) {
        return "bg-green-100 border-green-300 text-green-800 font-semibold";
      }
      if (isSelected && !isCorrect) {
        // Màu đỏ nếu user chọn sai
        return "bg-red-100 border-red-300 text-red-800 font-semibold line-through";
      }
      // Màu xám mờ nếu là đáp án sai 
      return "bg-gray-50 border-gray-200 text-gray-400 opacity-70";
    }
    
    //  Trạng thái chờ (chưa trả lời)
    return "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-400";
  };

  return (
    <button
      onClick={onClick}
      disabled={isAnswered}
      className={`w-full p-4 border-2 rounded-lg text-left font-medium 
                  transition-all duration-200 disabled:cursor-not-allowed ${getButtonClass()}`}
    >
      {text}
    </button>
  );
}