'use client';

import ReactCardFlip from 'react-card-flip';
import { Volume2, BookOpen, Quote, ChevronLeft } from 'lucide-react'; // Thêm ChevronLeft
import { useRouter } from 'next/navigation'; // Import useRouter
import WordTypeBadge from '../../../vocabulary/components/WordTypeBadge'; 

interface GenericWord {
  id: number;
  word: string;
  type?: string;
  pronunciation: string | null;
  definition: string | null;
  context_sentence: string | null;
  audio_url: string | null;
}

interface Props {
  word: GenericWord;
  isFlipped: boolean;
  onFlip: () => void;
}

const playAudio = (e: React.MouseEvent, audioUrl: string | null) => {
  e.stopPropagation();
  if (audioUrl) { 
    try {
      const audio = new Audio(audioUrl); 
      audio.play(); 
    } catch (err) {
      console.error("Lỗi khi phát âm thanh:", err);
    }
  }
};

export default function Flashcard({ word, isFlipped, onFlip }: Props) {
  const router = useRouter(); // Khởi tạo router
  
  const cardBaseStyle = 'flex flex-col w-full max-w-lg h-96 p-8 rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] cursor-pointer transition-all duration-300 hover:shadow-[0_20px_50px_-10px_rgba(0,103,197,0.15)] border';

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* --- NÚT BACK TO DECK --- */}
      <button 
        onClick={(e) => {
          e.stopPropagation();
          router.back(); // Quay lại trang trước đó (danh sách deck)
        }}
        className="mb-6 flex items-center gap-2 text-slate-500 hover:text-[#0067C5] transition-colors font-bold text-sm group"
      >
        <div className="p-1.5 rounded-lg bg-white shadow-sm group-hover:bg-[#F0F7FF] transition-colors">
          <ChevronLeft size={18} />
        </div>
        Back to Deck
      </button>

      <ReactCardFlip isFlipped={isFlipped} flipDirection="horizontal">
        
        {/* --- MẶT TRƯỚC (FRONT) --- */}
        <div 
          onClick={onFlip} 
          className={`${cardBaseStyle} bg-white border-white items-center justify-center group relative`}
        >
          <div className="text-center">
            <div className="mb-4 opacity-80">
               <WordTypeBadge type={word.type} />
            </div>
            
            <h2 className="text-5xl font-bold text-slate-800 mb-2 group-hover:scale-105 transition-transform duration-300">
              {word.word}
            </h2>
            
            <p className="text-sm text-slate-400 mt-8 animate-pulse font-medium">
              Tap to flip
            </p>
          </div>
        </div>

        {/* --- MẶT SAU (BACK) --- */}
        <div 
          onClick={onFlip} 
          className={`${cardBaseStyle} bg-[#F0F7FF] border-[#D6E8FF] justify-between`}
        >
          <div>
            <div className="flex justify-between items-start">
              <div>
                  <h3 className="text-3xl font-bold text-[#0067C5]">{word.word}</h3>
                  <div className="mt-1"><WordTypeBadge type={word.type} /></div>
              </div>
              
              <button 
                onClick={(e) => playAudio(e, word.audio_url)}
                disabled={!word.audio_url}
                className="p-3 text-[#0067C5] bg-white rounded-full shadow-sm hover:shadow-md hover:scale-110 transition-all disabled:opacity-50"
              >
                <Volume2 size={24} />
              </button>
            </div>
            
            {word.pronunciation && (
              <p className="text-lg text-slate-500 italic mt-1 font-serif">
                {word.pronunciation}
              </p>
            )}
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-4 py-2">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0067C5] mb-1">
                <BookOpen size={14} /> Definition
              </div>
              <p className="text-lg text-slate-800 leading-snug font-medium">
                {word.definition || 'No definition provided.'}
              </p>
            </div>
            
            {word.context_sentence && (
              <div className="bg-white p-3 rounded-xl border border-[#D6E8FF]">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0067C5] mb-1">
                  <Quote size={14} /> Context
                </div>
                <p className="text-base text-slate-600 italic">
                  "{word.context_sentence}"
                </p>
              </div>
            )}
          </div>
        </div>
      </ReactCardFlip>
    </div>
  );
}