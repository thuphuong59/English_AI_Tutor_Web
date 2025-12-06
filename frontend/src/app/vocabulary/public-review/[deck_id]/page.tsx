// app/vocabulary/public-review/[deck_id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { useParams } from 'next/navigation';
import Link from 'next/link';

import { PublicDeckDetail, PublicWord } from '../../type';
import { Loader2, AlertTriangle, X, PartyPopper } from 'lucide-react';
import Flashcard from '../../review/components/Flashcards'; 
import SrsButtons from '../../review/components/SrsButtons';

export default function PublicReviewSession() {
  const params = useParams();
  const deckId = params.deck_id;
  
  //  Gọi API GET /api/public-decks/{deck_id}
  const { data, error } = useSWR<PublicDeckDetail>(
    deckId ? `/public-decks/${deckId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionQueue, setSessionQueue] = useState<PublicWord[]>([]);
  const [sessionState, setSessionState] = useState<'loading' | 'active' | 'error'>('loading');

  useEffect(() => {
    if (error) {
      setSessionState('error');
    } else if (data?.words) {
      //  Xáo trộn (Shuffle) các từ vựng công cộng
      setSessionQueue(data.words.sort(() => Math.random() - 0.5));
      setSessionState('active');
    }
  }, [data, error]);

  // 5. LOGIC KHÁC BIỆT:
  // KHÔNG gọi API 'postReviewResult'
  const handleSrsClick = (quality: number) => {
    setIsFlipped(false);
    
    if (currentIndex < sessionQueue.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Nếu hết từ, xáo trộn lại và bắt đầu lại từ đầu
      alert("You finished the deck! Let's shuffle and start over.");
      setSessionQueue(sessionQueue.sort(() => Math.random() - 0.5));
      setCurrentIndex(0);
    }
  };


  if (sessionState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 text-gray-600">
        <Loader2 size={48} className="animate-spin text-blue-500" />
        <p className="mt-4 text-lg">Loading Public Deck...</p>
      </div>
    );
  }
  
  if (sessionState === 'error' || !data) {
     return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 text-center">
        <AlertTriangle size={48} className="text-red-500" />
        <h2 className="mt-4 text-2xl font-bold text-red-700">Error Loading Deck</h2>
        <Link href="/vocabulary" className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          Back to Vocabulary
        </Link>
      </div>
    );
  }
  
  if (sessionQueue.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 text-center">
          <h2 className="mt-4 text-2xl font-bold text-gray-700">This deck is empty.</h2>
          <Link href="/vocabulary" className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Back to Vocabulary
          </Link>
        </div>
      );
  }

  const currentWord = sessionQueue[currentIndex];

  // GIAO DIỆN CHÍNH (ĐANG ÔN TẬP) 
  return (
    <div className="flex flex-col items-center min-h-screen p-4 sm:p-8 bg-gray-100">
      <Link href="/vocabulary" className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-200 rounded-full">
        <X size={24} />
      </Link>
      
      <div className="w-full max-w-lg">
        {/* Tiêu đề Bộ từ */}
        <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">{data.deck_info.name}</h2>
            <p className="text-sm text-gray-500">Word: {currentIndex + 1} / {sessionQueue.length}</p>
        </div>
        
        {/*  TÁI SỬ DỤNG Flashcard (Truyền PublicWord) */}
        {/* Chúng ta cần sửa Flashcard để nhận kiểu dữ liệu chung */}
        <Flashcard
          word={currentWord}
          isFlipped={isFlipped}
          onFlip={() => setIsFlipped(!isFlipped)}
        />

        {isFlipped && <SrsButtons onSrsClick={handleSrsClick} />}
      </div>
    </div>
  );
}