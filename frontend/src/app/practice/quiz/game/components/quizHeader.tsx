"use client";

type Props = {
  current: number;
  total: number;
};

export default function QuizHeader({ current, total }: Props) {
  const progressPercentage = (current / total) * 100;
  
  return (
    <div className="mb-4">
      <p className="text-lg font-semibold text-gray-700 mb-2">
        Question {current}
        <span className="text-gray-400"> / {total}</span>
      </p>
      <div className="w-full bg-gray-200 rounded-full h-2.5 shadow-inner">
        <div 
          className="bg-blue-600 h-2.5 rounded-full 
                     transition-all duration-300 ease-out" 
          style={{ width: `${progressPercentage}%` }}>
        </div>
      </div>
    </div>
  );
}