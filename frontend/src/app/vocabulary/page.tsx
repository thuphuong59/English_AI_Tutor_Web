'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { DeckWithStats, Suggestion, PublicDeck } from './type'; 
import { Loader2, Inbox, Plus, BrainCircuit, Library } from 'lucide-react';
import DeckCard from './components/DeckCard';
import AddNewDeckModal from './components/AddNewDeckModal'; 
import SuggestedWords from './components/SuggestedWordsList'; 
import PublicDeckCard from './public-review/components/PublicDeckCard'; 

export default function VocabularyDashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'decks' | 'suggestions' | 'public'>('decks');

  // Gọi cả 3 API song song
  const { data: decks, error: decksError } = useSWR<DeckWithStats[]>('/decks', fetcher);
  const { data: suggestions, error: suggestionsError } = useSWR<Suggestion[]>('/vocabulary/suggestions', fetcher);
  const { data: publicDecks, error: publicDecksError } = useSWR<PublicDeck[]>('/public-decks', fetcher);

  const isLoading = !decks && !suggestions && !publicDecks;
  const hasError = decksError || suggestionsError || publicDecksError;

  if (isLoading && !hasError) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-12 h-12 animate-spin text-[#0067C5]" />
      </div>
    );
  }

  return (
    <>
      <div className="container p-4 sm:p-6 mx-auto max-w-5xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">My Vocabulary</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-[#0067C5] rounded-lg shadow-md hover:bg-[#0055A5]"
          >
            <Plus size={18} />
            Create New Deck
          </button>
        </div>

        <div className="flex border-b border-gray-200 mb-6">
          {/* Tab 1: My Decks */}
          <button
            onClick={() => setActiveTab('decks')}
            className={`flex items-center gap-2 px-6 py-3 font-medium text-base transition-colors
              ${activeTab === 'decks'
                ? 'border-b-2 border-[#0067C5] text-[#0067C5]'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            My Decks ({decks?.length || 0})
          </button>
          
          {/* Tab 2: AI Suggestions */}
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`flex items-center gap-2 px-6 py-3 font-medium text-base transition-colors
              ${activeTab === 'suggestions'
                ? 'border-b-2 border-[#0067C5] text-[#0067C5]'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <BrainCircuit size={18} />
            AI Suggestions ({suggestions?.length || 0})
          </button>
          
          {/* Tab 3: Public Decks */}
          <button
            onClick={() => setActiveTab('public')}
            className={`flex items-center gap-2 px-6 py-3 font-medium text-base transition-colors
              ${activeTab === 'public'
                ? 'border-b-2 border-[#0067C5] text-[#0067C5]'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <Library size={18} />
            Official Decks ({publicDecks?.length || 0})
          </button>
        </div>

        {/* Nội dung từng tab */}
        {activeTab === 'decks' && (
          <>
            {decksError && <div className="text-red-500">Error loading decks.</div>}
            {decks && decks.length === 0 && (
              <div className="text-center text-gray-500 p-10 bg-white rounded-lg shadow-sm">
                <Inbox size={40} className="mx-auto mb-2" />
                You haven't created any decks yet.
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {decks?.map((deck) => (
                <DeckCard key={deck.id} deck={deck} />
              ))}
            </div>
          </>
        )}
        
        {activeTab === 'suggestions' && (
          <>
            {suggestionsError && <div className="text-red-500">Error loading suggestions.</div>}
            <SuggestedWords 
              suggestions={suggestions} 
              decks={decks?.map(d => ({ id: d.id, name: d.name }))} 
            />
          </>
        )}
        
        {activeTab === 'public' && (
          <>
            {publicDecksError && <div className="text-red-500">Error loading official decks.</div>}
            {publicDecks && publicDecks.length === 0 && (
              <div className="text-center text-gray-500 p-10 bg-white rounded-lg shadow-sm">
                <Inbox size={40} className="mx-auto mb-2" />
                No official decks available yet.
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {publicDecks?.map((deck) => (
                <PublicDeckCard key={deck.id} deck={deck} />
              ))}
            </div>
          </>
        )}
      </div>

      <AddNewDeckModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
