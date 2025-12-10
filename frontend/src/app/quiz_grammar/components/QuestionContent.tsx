// frontend/src/app/test/quiz/components/QuestionContent.tsx

import React, { useEffect } from "react"; 

type AnswerValue = string | null;

interface QuestionContentProps {
    currentQ: any;
    currentAnswer: AnswerValue; 
    setSelectedOptions: React.Dispatch<React.SetStateAction<Record<number, string>>>; 
    currentQuestion: number;
}

export default function QuestionContent({
    currentQ,
    currentAnswer,
    setSelectedOptions,
    currentQuestion,
}: QuestionContentProps) {
    
    const optionKeys = ['A', 'B', 'C', 'D']; 
    
    // Chỉ cần useEffect này để đảm bảo component không bị lỗi khi dùng AnswerValue
    useEffect(() => {
        // Cleanup logic nếu cần
    }, [currentQ?.id, currentAnswer]);
    
    if (!currentQ) {
        return (
            <div className="w-full max-w-3xl bg-white rounded-2xl p-10 shadow-lg">
                <p className="text-gray-500">Đang tải câu hỏi...</p>
            </div>
        );
    }
    
    return (
        <div className="w-full max-w-3xl bg-white rounded-2xl p-10 shadow-lg">
            
            {/* PHẦN TIÊU ĐỀ/CÂU HỎI */}
            <h2 className="text-2xl font-semibold mb-8 text-gray-800 leading-relaxed">
                <span className="text-teal-600 mr-3 font-extrabold">{currentQuestion}.</span>
                {currentQ?.question_text}
            </h2>
            
            {/* --- TRẮC NGHIỆM (MCQ) --- */}
            <div className="space-y-5">
                {currentQ?.options.map((opt: string, i: number) => {
                    const optionKey = optionKeys[i]; 
                    const isChecked = typeof currentAnswer === 'string' && currentAnswer === optionKey; 
                    
                    return (
                        <label 
                            key={optionKey} 
                            className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-150 border-2 
                                ${isChecked 
                                    ? 'border-blue-600 bg-blue-50 shadow-blue-200 shadow-md transform scale-[1.01]' 
                                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                }
                            `}
                            onClick={() =>
                                setSelectedOptions((prev: any) => ({
                                    ...prev,
                                    [currentQ.id]: optionKey, // Lưu string key
                                }))
                            }
                        >
                            {/* Chữ cái/Key đáp án */}
                            <div className={`w-8 h-8 flex items-center justify-center rounded-full text-base font-extrabold shrink-0 
                                ${isChecked ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}
                            `}>
                                {optionKey}
                            </div>

                            {/* Nội dung đáp án */}
                            <span className="text-lg text-gray-800 font-medium leading-normal">
                                {opt}
                            </span>
                        </label>
                    );
                })}
            </div>
        </div>
    );
}