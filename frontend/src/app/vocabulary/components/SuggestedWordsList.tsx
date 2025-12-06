'use client';

import { useState } from 'react';
import { Suggestion, Deck } from '../type'; 
import { Inbox, AlertTriangle, Loader2, BookCopy, Plus, BrainCircuit, Volume2 } from 'lucide-react';
import { addSuggestedWord } from '@/services/vocabService'; 
import { mutate } from 'swr';
import WordTypeBadge from './WordTypeBadge'; 

function AddToDeckModal({
  suggestion,
  decks,
  onClose,
}: {
  suggestion: Suggestion;
  decks: { id: number; name: string }[];
  onClose: () => void;
}) {
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
        <h3 className="text-lg font-semibold mb-4">Add "{suggestion.word}" to...</h3>
        <select
          value={selectedDeckId || ''}
          onChange={(e) => setSelectedDeckId(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0067C5]"
        >
          {decks.map(deck => (
            <option key={deck.id} value={deck.id}>{deck.name}</option>
          ))}
        </select>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-800 bg-gray-100 rounded-lg hover:bg-gray-200">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !selectedDeckId}
            className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-[#0067C5] rounded-lg hover:brightness-110 disabled:bg-gray-400"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Add to Deck'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface Props {
  suggestions: Suggestion[] | undefined;
  decks: { id: number; name: string }[] | undefined;
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

export default function SuggestedWordsList({ suggestions, decks }: Props) {
  const [wordToMove, setWordToMove] = useState<Suggestion | null>(null);

  if (!suggestions) return <div className="text-center p-10"><Loader2 className="animate-spin" /></div>;

  if (suggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-10 bg-white rounded-2xl shadow-lg border border-gray-100 text-center">
        <BrainCircuit className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700">AI Inbox is Empty</h3>
        <p className="text-gray-500">Have a conversation with the AI Tutor to get smart suggestions!</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {suggestions.map((sugg) => (
          <div key={sugg.id} className="bg-white rounded-2xl shadow-lg transition-all hover:shadow-xl overflow-hidden">
            <div className="p-5">
              <div className="flex justify-between items-start">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <h3 className="text-3xl font-bold text-gray-800">{sugg.word}</h3>
                  
                  {/* --- HIỂN THỊ BADGE --- */}
                  <WordTypeBadge type={sugg.type} />

                  {sugg.pronunciation && (
                    <span className="text-lg text-gray-500 italic">{sugg.pronunciation}</span>
                  )}
                  <button 
                    onClick={(e) => playAudio(e, sugg.audio_url)}
                    disabled={!sugg.audio_url}
                    className="p-1 text-gray-400 rounded-full hover:bg-gray-100 hover:text-[#0067C5] transition-colors disabled:text-gray-200"
                  >
                    <Volume2 size={20} />
                  </button>
                </div>

                <button 
                  onClick={() => setWordToMove(sugg)}
                  disabled={!decks || decks.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white bg-[#0067C5] rounded-lg hover:brightness-110 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  title={(!decks || decks.length === 0) ? "You must create a deck first" : "Add to deck"}
                >
                  <Plus size={16} /> Add
                </button>
              </div>

              <div className="mt-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 mb-2">
                  <BookCopy size={16} className="text-gray-400" />
                  <span>Definition</span>
                </div>
                <p className="text-gray-700 pl-6 mt-1">{sugg.definition}</p>
              </div>
              
              {sugg.context_sentence && (
                <div className="mt-4 pb-3 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 mb-2">
                    <BookCopy size={16} className="text-gray-400" />
                    <span>Context (from your chat)</span>
                  </div>
                  <p className="text-gray-700 italic pl-6 border-l-2 border-[#0067C5]">
                    "{sugg.context_sentence}"
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {wordToMove && decks && (
        <AddToDeckModal
          suggestion={wordToMove}
          decks={decks}
          onClose={() => setWordToMove(null)}
        />
      )}
    </>
  );
}