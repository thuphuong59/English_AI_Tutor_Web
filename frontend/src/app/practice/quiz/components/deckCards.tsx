"use client";

import Link from "next/link";
import { Deck } from "@/app/practice/types";

type Props = {
  deck: Deck;
  deckType: "user" | "public";
};

export default function DeckCard({ deck, deckType }: Props) {
  // Build the dynamic URL
  const href = `/practice/quiz/game?type=${deckType}&id=${deck.id}`;

  return (
    <Link
      href={href}
      className="flex flex-col h-full p-6 bg-white rounded-lg border border-gray-200 shadow-sm 
                 transition-all duration-200 
                 hover:shadow-lg hover:border-blue-400 hover:-translate-y-1"
    >
  
      <h3 className="text-xl font-bold text-gray-800 mb-2 truncate">
        {deck.name}
      </h3>

      <p className="flex-grow text-gray-600 text-sm mb-4 line-clamp-2">
        {deck.description || "No description provided."}
      </p>
      
      <div className="flex-shrink-0">
        <span 
          className="inline-flex items-center text-xs font-semibold text-blue-700 
                     bg-blue-100 px-3 py-1 rounded-full"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-3.5 w-3.5 mr-1.5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth={2}
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M12 6.253v11.494m0-11.494c-2.484 0-4.75.202-7.014.593m7.014-.593c2.484 0 4.75.202 7.014.593m-7.014.593V3.75m0 2.503V3.75m0 2.503c-2.484 0-4.75.202-7.014.593m0 0v1.688m7.014-2.281c2.484 0 4.75.202 7.014.593m0 0v1.688m-7.014 8.219c-2.484 0-4.75.202-7.014.593m7.014-.593c2.484 0 4.75.202 7.014.593m-7.014.593v-1.688m0 2.281v-1.688m0 2.281c-2.484 0-4.75.202-7.014.593m0 0V20.25m7.014-1.688V20.25" 
            />
          </svg>
          {deck.wordCount} words
        </span>
      </div>
    </Link>
  );
} 