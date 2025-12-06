"use client";

import React, { useState } from "react";
import { Deck } from "@/app/practice/types";
import DeckCard from "./deckCards";

type Props = {
  userDecks: Deck[];
  publicDecks: Deck[];
};

export default function DeckSelector({ userDecks, publicDecks }: Props) {
  const [activeTab, setActiveTab] = useState<"public" | "user">("public");

  const renderDecks = (decks: Deck[], type: "user" | "public") => {
    if (decks.length === 0) {
      return (
        <div className="text-center text-gray-500 py-10">
          <p>No decks found in this section.</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {decks.map((deck) => (
          <DeckCard key={deck.id} deck={deck} deckType={type} />
        ))}
      </div>
    );
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("public")}
          className={`px-6 py-3 font-semibold text-lg transition-all
            ${
              activeTab === "public"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
        >
          Official Decks
        </button>
        <button
          onClick={() => setActiveTab("user")}
          className={`px-6 py-3 font-semibold text-lg transition-all
            ${
              activeTab === "user"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
        >
          My Decks ({userDecks.length})
        </button>
      </div>

      {/* Deck List */}
      {activeTab === "public" && renderDecks(publicDecks, "public")}
      {activeTab === "user" && renderDecks(userDecks, "user")}
    </div>
  );
}