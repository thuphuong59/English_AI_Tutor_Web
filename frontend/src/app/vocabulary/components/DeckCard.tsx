'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DeckWithStats } from '../type';
import { BookMarked, User, Target, CheckCircle2, MoreHorizontal, Pencil, Trash2, Loader2 } from 'lucide-react';
import { deleteDeck, updateDeck } from '@/services/vocabService';
import EditDeckModal from './EditDeckModal';

interface Props {
  deck: DeckWithStats;
}

export default function DeckCard({ deck }: Props) {
  const { name, stats } = deck;
  const totalWords = (stats?.learning || 0) + (stats?.mastered || 0);
  const needsReviewCount = stats?.review_today || 0;
  const reviewColor = needsReviewCount > 0 ? 'text-red-500 font-bold' : 'text-gray-500';

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(null);
    if (!confirm(`Are you sure you want to delete the deck "${name}"?`)) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteDeck(deck.id);
    } catch (err) {
      alert('Failed to delete deck.');
      console.error(err);
      setIsDeleting(false);
    }
  };

  const handleOpenEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(null);
    setIsEditing(true);
  };

  return (
    <>
      {isEditing && (
        <EditDeckModal
          deckToEdit={deck}
          onClose={() => setIsEditing(false)}
        />
      )}

      <div className="bg-white rounded-2xl shadow-lg h-full flex flex-col justify-between border border-gray-100 overflow-hidden">
        <div className="p-5">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-bold text-gray-800 truncate">{name}</h3>
            
            <div className="relative">
              <button 
                onClick={() => setOpenMenuId(openMenuId === deck.id ? null : deck.id)}
                className="text-gray-400 hover:text-[#0067C5] p-1 rounded-full hover:bg-gray-100"
              >
                {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <MoreHorizontal size={18} />}
              </button>
              
              {openMenuId === deck.id && (
                <div 
                  className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-lg z-10"
                  onMouseLeave={() => setOpenMenuId(null)}
                >
                  <button 
                    onClick={handleOpenEdit}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Pencil size={16} /> Edit
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <BookMarked size={16} />
            <span>{totalWords} {totalWords === 1 ? 'word' : 'words'}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
            <User size={16} />
            <span>(Your Name)</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100 p-5">
          <div className="flex justify-between text-sm mb-2">
            <span className={reviewColor}>
              Review: {needsReviewCount}
            </span>
            <span className="text-gray-500">
              Mastered: {stats.mastered}
            </span>
          </div>
          
          <Link 
            href={`/vocabulary/${deck.id}`}
            style={{
              color: '#0067C5',
              backgroundColor: '#E5F0FF', 
            }}
            className="block w-full text-center px-4 py-2 mt-2 text-sm font-semibold rounded-lg hover:brightness-110 transition-colors"
          >
            Learn
          </Link>
        </div>
      </div>
    </>
  );
}
