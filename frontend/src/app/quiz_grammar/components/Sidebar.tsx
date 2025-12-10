// frontend/src/app/test/quiz/components/Sidebar.tsx

import React from "react";

interface SidebarProps {
    shuffledQuestions: any[];
    currentQuestion: number;
    selectedOptions: Record<number, string>; 
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
        <aside className="w-1/4 bg-white shadow-lg border border-gray-200 rounded-2xl p-6 flex flex-col 
                   sticky top-6 h-[calc(100vh-4rem)]">            
            {/* Countdown và Submit */}
            <div className="flex justify-between items-center mb-6">
                
                {/* Đồng hồ đếm ngược: Vòng tròn Nổi bật */}
                <div className="w-20 h-20 flex items-center justify-center rounded-full border-4 border-red-600 bg-red-50 shadow-md">
                    <span className="text-red-600 font-extrabold text-2xl">
                        {minutes}:{seconds.toString().padStart(2, "0")}
                    </span>
                </div>
                
                {/* Nút Submit */}
                <button
                    onClick={onSubmit}
                    className="bg-teal-600 text-white px-5 py-2.5 rounded-full font-bold text-lg hover:bg-teal-700 transition duration-200 shadow-teal-300 shadow-md"
                >
                    Submit
                </button>
            </div>

            <hr className="my-4 border-gray-100" />

            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">List of questions</h2>
            <div className="grid grid-cols-5 gap-3 overflow-y-auto pb-4">
                {shuffledQuestions.map((q, index) => {
                    const answer = selectedOptions[q.id];
                    // Logic trả lời đã đơn giản hóa cho MCQ
                    const isAnswered = typeof answer === 'string' && answer.length > 0;
                    const isCurrent = currentQuestion === index + 1;

                    return (
                        <button
                            key={q.id}
                            onClick={() => setCurrentQuestion(index + 1)}
                            className={`w-12 h-12 flex items-center justify-center rounded-full border-2 transition duration-150 text-base
                                ${
                                    isCurrent
                                        ? "border-teal-600 bg-teal-50 text-teal-700 font-extrabold shadow-inner" 
                                        : isAnswered
                                        ? "border-teal-500 bg-teal-500 text-white font-bold shadow-sm" 
                                        : "border-gray-300 bg-white text-gray-600 hover:border-blue-400 hover:text-blue-600"
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