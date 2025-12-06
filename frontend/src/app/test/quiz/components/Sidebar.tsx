// frontend/src/app/test/quiz/components/Sidebar.tsx

import React from "react";

// 🚨 BƯỚC 1: ĐỊNH NGHĨA KIỂU DỮ LIỆU MỞ RỘNG (Phải khớp với QuizPage) 🚨
interface AudioData {
    audioBlob: Blob;
    latency: number;
    duration: number;
}
type AnswerValue = string | AudioData | null; 

interface SidebarProps {
    shuffledQuestions: any[];
    currentQuestion: number;
    // 🚨 BƯỚC 2: CẬP NHẬT KIỂU selectedOptions 🚨
    selectedOptions: Record<number, AnswerValue>; 
    setCurrentQuestion: (q: number) => void;
    minutes: number;
    seconds: number;
    onSubmit: () => void;
}

export default function Sidebar({
    shuffledQuestions,
    currentQuestion,
    selectedOptions,
    setCurrentQuestion,
    minutes,
    seconds,
    onSubmit,
}: SidebarProps) {
    return (
        <aside className="w-1/4 bg-white shadow-md border-2 border-teal-500 p-6 rounded-xl flex flex-col">
            {/* Countdown và Submit */}
            <div className="flex justify-between items-center mb-4">
                <span className="text-red-600 font-extrabold text-xl">
                    {minutes}:{seconds.toString().padStart(2, "0")}
                </span>
                <button
                    onClick={onSubmit}
                    className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 font-bold text-lg"
                >
                    Submit
                </button>
            </div>

            <hr className="my-4 border-gray-300" />

            <h2 className="text-lg font-bold text-teal-600 mb-4">List of questions</h2>
            <div className="grid grid-cols-5 gap-3">
                {shuffledQuestions.map((q, index) => {
                    // 🚨 ĐIỀU CHỈNH LOGIC KIỂM TRA ĐÃ TRẢ LỜI 🚨
                    // Kiểm tra nếu câu trả lời không phải null HOẶC nếu đó là object AudioData
                    const answer = selectedOptions[q.id];
                    const isAnswered = answer !== null && answer !== undefined;

                    const isCurrent = currentQuestion === index + 1;

                    return (
                        <button
                            key={q.id}
                            onClick={() => setCurrentQuestion(index + 1)}
                            className={`w-12 h-12 flex items-center justify-center rounded-full border-2 transition
                                ${
                                    isCurrent
                                        ? "border-teal-600 bg-teal-50 text-teal-700 font-bold"
                                        : isAnswered
                                        ? "border-teal-500 bg-teal-500 text-white font-semibold"
                                        : "border-gray-300 bg-white text-gray-700 hover:border-teal-500 hover:text-teal-600"
                                }`}
                        >
                            {index + 1}
                        </button>
                    );
                })}
            </div>
        </aside>
    );
}