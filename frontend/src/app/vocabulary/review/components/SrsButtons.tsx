
'use client';

import { RotateCcw, Brain, Check, CheckCheck } from 'lucide-react';

interface Props {
  onSrsClick: (quality: number) => void;
}

export default function SrsButtons({ onSrsClick }: Props) {
  
  // Helper style chung cho các nút
  const buttonStyle = "flex flex-col items-center justify-center p-4 font-semibold text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 w-full max-w-lg">
      <button
        onClick={() => onSrsClick(0)}
        className={`${buttonStyle} bg-red-500 hover:bg-red-600`}
      >
        <RotateCcw size={20} className="mb-1" />
        Again
      </button>

      <button
        onClick={() => onSrsClick(1)}
        className={`${buttonStyle} bg-orange-500 hover:bg-orange-600`}
      >
        <Brain size={20} className="mb-1" />
        Hard
      </button>
      
      <button
        onClick={() => onSrsClick(3)}
        className={`${buttonStyle} bg-green-500 hover:bg-green-600`}
      >
        <Check size={20} className="mb-1" />
        Good
      </button>
      <button
        onClick={() => onSrsClick(5)}
        className={`${buttonStyle} bg-blue-500 hover:bg-blue-600`}
      >
        <CheckCheck size={20} className="mb-1" />
        Easy
      </button>
    </div>
  );
}
