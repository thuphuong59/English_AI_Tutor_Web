
'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

import { DeckDetail, MyWord, StatsData } from '../type';
import { Loader2, AlertTriangle, ArrowLeft, Plus } from 'lucide-react';
import VocabularyStats from '../components/VocabularyStats';
import WordList from '../components/WordList';
import AddNewWordModal from '../components/AddNewWordModal';

export default function DeckDetailPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter(); // Khởi tạo router
  
  // Lấy deck_id từ URL
  const params = useParams();
  const deckId = params.deck_id;

  //  Gọi API mới: GET /api/decks/{deck_id}
  const { data, error } = useSWR<DeckDetail>(
    deckId ? `/decks/${deckId}` : null, // (Key SWR phải là /decks/...)
    fetcher
  );

  // Giao diện Đang tải (Loading)
  if (!data && !error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  //  Giao diện Lỗi (Error)
  if (error || !data) {
    return (
      <div className="container p-4 sm:p-6 mx-auto max-w-5xl text-center">
        <AlertTriangle className="mx-auto w-12 h-12 text-red-400 mb-4" />
        <h3 className="text-lg font-semibold text-red-600">Error Loading Deck</h3>
        <p className="text-gray-500">Could not fetch data for this deck. It may not exist.</p>
        <Link href="/vocabulary" className="text-blue-500 mt-4 inline-block hover:underline">
          &larr; Back to all decks
        </Link>
      </div>
    );
  }
 
  const { deck_info, stats, words } = data;

  //  Hàm xử lý khi nhấn "Bắt đầu ôn tập"
  const handleStartReview = () => {
      if (stats && stats.review_today > 0) {
          // Điều hướng đến trang review động (chúng ta sẽ tạo sau)
          router.push(`/vocabulary/review/${deckId}`);
      }
  };

  return (
    <>
      <div className="container p-4 sm:p-6 mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <Link href="/vocabulary" className="flex items-center gap-2 text-sm text-blue-500 hover:underline mb-2">
              <ArrowLeft size={16} />
              Back to all decks
            </Link>
            <h1 className="text-3xl font-bold text-gray-800">
              {deck_info?.name}
            </h1>
            {deck_info?.description && (
                <p className="text-gray-500 mt-1">{deck_info.description}</p>
            )}
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-blue-500 rounded-lg shadow-md hover:bg-blue-600"
          >
            <Plus size={18} />
            Add Word to this Deck
          </button>
        </div>

        {/* Thẻ Thống kê */}
        <div className="mb-6">
          <VocabularyStats stats={stats} error={error} onStartReview={handleStartReview} />
        </div>

        {/* Danh sách Từ vựng */}
        <div className="py-6">
          <WordList words={words} error={error} />
        </div>
      </div>

      {/* Modal (Truyền deck_id vào) */}
      {isModalOpen && (
          <AddNewWordModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            deckId={Number(deckId)} // <-- Truyền deckId
          />
      )}
    </>
  );
}