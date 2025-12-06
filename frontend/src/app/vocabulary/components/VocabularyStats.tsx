'use client';

import { useRouter } from 'next/navigation';
import { BookOpenCheck, Target, CheckCircle2 } from 'lucide-react';

interface StatsData {
  review_today: number;
  learning: number;
  mastered: number;
}

interface Props {
  stats: StatsData | undefined;
  error: any;
  onStartReview: () => void; 
}

export default function VocabularyStats({ stats, error, onStartReview }: Props) {
  const router = useRouter();

  const handleStartReviewClick = () => {
    if (stats && stats.review_today > 0) {
      onStartReview();
    }
  };


  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl shadow-lg text-red-600">
        Could not load stats. Please refresh.
      </div>
    );
  }

  // === Loading (Skeleton) ===
  if (!stats) {
    return (
      <div className="p-6 bg-white rounded-2xl shadow-md animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="h-10 bg-gray-300 rounded w-3/4 mb-4"></div>
        <div className="h-12 bg-gray-300 rounded-lg w-full mb-5"></div>
        <div className="flex justify-between pt-4 border-t border-gray-100">
          <div className="h-5 bg-gray-200 rounded w-1/3"></div>
          <div className="h-5 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-6 rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl"
      style={{
        background: 'linear-gradient(to bottom, #ffffff, #e9f3ff)',
        borderColor: '#b6dcff',
      }}
    >
      <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
        <BookOpenCheck size={20} style={{ color: '#0067C5' }} />
        Today's Progress
      </h2>

      <p className="text-3xl font-bold text-slate-800 my-3">
        You have{' '}
        <span style={{ color: '#0067C5' }}>
          {stats.review_today}
        </span>{' '}
        {stats.review_today === 1 ? 'word' : 'words'} to review
      </p>

      <button
        onClick={handleStartReviewClick}
        disabled={stats.review_today === 0}
        style={{
          backgroundColor: '#0067C5',
        }}
        className="w-full px-4 py-3 mt-3 font-semibold text-white rounded-lg shadow-md transition-all duration-200 
                   hover:brightness-110 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        Start Review
      </button>

      <div className="flex justify-between mt-5 pt-4 border-t" style={{ borderColor: '#cce3ff' }}>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Target size={16} style={{ color: '#f97316' }} />
          <span>
            Learning: <strong className="text-slate-800">{stats.learning}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CheckCircle2 size={16} style={{ color: '#16a34a' }} />
          <span>
            Mastered: <strong className="text-slate-800">{stats.mastered}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
