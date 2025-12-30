import React from "react";

interface AudioData {
    audioBlob: Blob;
    latency: number;
    duration: number;
}
type AnswerValue = string | AudioData | null; 

interface SidebarProps {
    shuffledQuestions: any[];
    currentQuestion: number;
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
        <aside className="w-1/4 bg-white shadow-md border-2 border-blue-500 p-6 rounded-xl flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <span className="text-red-600 font-extrabold text-xl">
                    {minutes}:{seconds.toString().padStart(2, "0")}
                </span>
                <button
                    onClick={onSubmit}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-bold text-lg"
                >
                    Submit
                </button>
            </div>

            <hr className="my-4 border-gray-300" />

            <h2 className="text-lg font-bold text-blue-600 mb-4">List of questions</h2>
            <div className="grid grid-cols-5 gap-3">
                {shuffledQuestions.map((q, index) => {
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
                                        ? "border-blue-600 bg-blue-50 text-blue-700 font-bold"
                                        : isAnswered
                                        ? "border-blue-500 bg-blue-500 text-white font-semibold"
                                        : "border-gray-300 bg-white text-gray-700 hover:border-blue-500 hover:text-blue-600"
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