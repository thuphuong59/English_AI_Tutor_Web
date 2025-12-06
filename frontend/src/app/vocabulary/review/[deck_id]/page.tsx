'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { postReviewResult } from '@/services/vocabService';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation'; 
import { Loader2, AlertTriangle, PartyPopper, X, CheckCircle2 } from 'lucide-react';
import { MyWord as ReviewWord } from '../../type'; 
import Flashcard from '../components/Flashcards'; 
import SrsButtons from '../components/SrsButtons';

export default function ReviewSession() {
  const router = useRouter();
  const params = useParams(); // Lấy params
  const deckId = params.deck_id; // Lấy ID bộ từ từ URL

  const [sessionState, setSessionState] = useState<'loading' | 'active' | 'complete' | 'error'>('loading');
  
  //  SWR KEY: Gọi API mới (dành riêng cho deck)
  const { data: queue, error } = useSWR<ReviewWord[]>(
    deckId ? `/vocabulary/deck/${deckId}/review-queue` : null, // API mới
    fetcher,
    { revalidateOnFocus: false }
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionQueue, setSessionQueue] = useState<ReviewWord[]>([]);

  useEffect(() => {
    if (error) {
      setSessionState('error');
    } else if (queue) {
      setSessionQueue(queue);
      setSessionState('active');
    }
  }, [queue, error]);

  const handleSrsClick = async (quality: number) => {
    if (sessionQueue.length === 0) return;
    const currentWord = sessionQueue[currentIndex];
    
    try {
      await postReviewResult(currentWord.id, quality);
    } catch (err) {
      console.error("Error submitting review:", err);
    }

    setIsFlipped(false);
    
    if (currentIndex < sessionQueue.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setSessionState('complete');
    }
  };


  if (sessionState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 text-gray-600">
        <Loader2 size={48} className="animate-spin text-blue-500" />
        <p className="mt-4 text-lg">Loading your review session...</p>
      </div>
    );
  }
  
  if (sessionState === 'error') {
     return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 text-center">
        <AlertTriangle size={48} className="text-red-500" />
        <h2 className="mt-4 text-2xl font-bold text-red-700">Error Loading Session</h2>
        <Link href={`/vocabulary/${deckId}`} className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          Back to Deck
        </Link>
      </div>
    );
  }
  
  if (sessionState === 'complete') {
     return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 text-center">
        <PartyPopper size={48} className="text-green-500" />
        <h2 className="mt-4 text-3xl font-bold text-gray-800">Session Complete!</h2>
        <Link href={`/vocabulary/${deckId}`} className="mt-6 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold shadow-md">
          Back to Deck
        </Link>
      </div>
    );
  }

  // Kiểm tra 'queue' (từ SWR) thay vì 'sessionQueue' (từ State)
  if (queue && queue.length === 0 && sessionState === 'active') {
     return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 text-center">
        <CheckCircle2 size={48} className="text-green-500" />
        <h2 className="mt-4 text-3xl font-bold text-gray-800">All Done!</h2>
        <p className="text-gray-600 mt-2">You have no words to review today.</p>
        <Link href={`/vocabulary/${deckId}`} className="mt-6 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold shadow-md">
          Back to Deck
        </Link>
      </div>
    );
  }
  
  // Kiểm tra sessionQueue.length
  if (sessionQueue.length === 0 || !sessionQueue[currentIndex]) {
      return (
          <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 text-gray-600">
            <Loader2 size={48} className="animate-spin text-blue-500" />
            <p className="mt-4 text-lg">Preparing session...</p>
          </div>
      );
  }

  const currentWord = sessionQueue[currentIndex];

  // GIAO DIỆN CHÍNH (ĐANG ÔN TẬP) 
  return (
    <div className="flex flex-col items-center min-h-screen p-4 sm:p-8 bg-gray-100">
      <Link href={`/vocabulary/${deckId}`} className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-200 rounded-full transition-colors">
        <X size={24} />
      </Link>
      
      <div className="w-full max-w-lg">
        {/* Thanh tiến trình */}
        <div className="mb-4">
          <span className="text-sm font-medium text-gray-700">
            Word: {currentIndex + 1} / {sessionQueue.length}
          </span>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
            <div 
              className="bg-blue-500 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${((currentIndex + 1) / sessionQueue.length) * 100}%` }}
            ></div>
          </div>
        </div>
        
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