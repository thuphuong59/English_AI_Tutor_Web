"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link"; // Import Link để điều hướng
import { ArrowLeft } from "lucide-react"; // Import icon mũi tên
import { Deck } from "@/app/practice/types";
import DeckSelector from "./components/deckSelector";
import { fetchQuizLobbyData } from "@/services/vocabService"; 

export default function QuizLobbyPage() {
  const [userDecks, setUserDecks] = useState<Deck[]>([]);
  const [publicDecks, setPublicDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDecks = async () => {
      setLoading(true);
      setError(null);
      try {
        const { userDecks, publicDecks } = await fetchQuizLobbyData();
        setUserDecks(userDecks);
        setPublicDecks(publicDecks);
      } catch (error) {
        console.error("Failed to fetch decks:", error);
        setError((error as Error).message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDecks();
  }, []);

  if (loading) {
    return <div className="text-center p-10 text-gray-500">Loading your decks...</div>;
  }
  
  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Nút Back ngay cả khi lỗi */}
          <div className="mb-6">
            <Link href="/practice" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors">
                <ArrowLeft size={20} />
                <span>Back to Practice</span>
            </Link>
          </div>
          
          <div className="text-center border border-red-100 bg-red-50 rounded-xl p-8">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Lỗi khi tải dữ liệu
            </h1>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* --- HEADER VỚI NÚT BACK --- */}
        <div className="flex items-center mb-6">
            <Link 
                href="/practice" 
                className="group flex items-center gap-2 text-slate-500 hover:text-[#0067C5] transition-colors font-medium px-3 py-2 rounded-lg -ml-3 hover:bg-blue-50"
            >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-200" />
                <span>Back to Practice</span>
            </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Start a New Quiz
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Which vocabulary deck do you want to test yourself on?
        </p>
        
        <DeckSelector userDecks={userDecks} publicDecks={publicDecks} />
      </div>
    </main>
  );
}  