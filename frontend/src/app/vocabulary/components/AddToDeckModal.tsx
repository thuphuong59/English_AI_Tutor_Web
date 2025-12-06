'use client';

import { useState } from 'react';
import { Suggestion, Deck } from '@/app/vocabulary/type'; 
import { addSuggestedWord } from '@/services/vocabService';
import { X, Loader2 } from 'lucide-react';
import { mutate } from 'swr';

interface Props {
  suggestion: Suggestion;
  decks: Deck[];
  onClose: () => void;
}

export default function AddToDeckModal({ suggestion, decks, onClose }: Props) {
  const [selectedDeckId, setSelectedDeckId] = useState<number | null>(decks[0]?.id || null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedDeckId) {
      alert('Please select a deck.');
      return;
    }
    setIsLoading(true);
    try {
      await addSuggestedWord(suggestion.id, selectedDeckId);
      mutate('/decks');
      mutate('/vocabulary/suggestions');
      onClose();
    } catch (err) {
      alert('Failed to add word.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4">
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-bold text-gray-800">Add to Deck</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:bg-gray-100 transition"
          >
            <X size={22} />
          </button>
        </div>

        <div>
          <p className="text-gray-600 mb-2">
            Add the word{' '}
            <strong style={{ color: '#0067C5' }}>
              "{suggestion.word}"
            </strong>{' '}
            to which deck?
          </p>

          <select
            value={selectedDeckId || ''}
            onChange={(e) => setSelectedDeckId(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm 
                       focus:outline-none focus:ring-2 focus:ring-[#0067C5]"
          >
            {decks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.name}
              </option>
            ))}
          </select>

          {decks.length === 0 && (
            <p className="text-sm text-red-600 mt-2">
              You must create a deck first.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-800 bg-gray-100 
                       rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !selectedDeckId}
            style={{ backgroundColor: '#0067C5' }}
            className="flex items-center justify-center px-4 py-2 text-sm font-semibold 
                       text-white rounded-lg shadow-md hover:brightness-110 
                       disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              'Add to Deck'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
