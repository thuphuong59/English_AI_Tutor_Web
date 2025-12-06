'use client';

import Link from 'next/link';
import { PublicDeck } from '../../type'; 
import { Library, BookCopy, BarChart3 } from 'lucide-react';

interface Props {
  deck: PublicDeck;
}

export default function PublicDeckCard({ deck }: Props) {
  const { id, name, description, level } = deck;
  
  return (
    <Link href={`/vocabulary/public-review/${id}`}>
      <div className="bg-white rounded-2xl shadow-lg p-5 h-full flex flex-col justify-between transition-all hover:shadow-xl hover:-translate-y-1 border border-gray-100">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Library size={16} className="text-blue-500" />
            <span>Official Deck</span>
          </div>
          
          <h3 className="text-xl font-bold text-gray-800 truncate" title={name}>
            {name}
          </h3>
          
          {level && (
            <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <BarChart3 size={14} />
              Level: {level}
            </span>
          )}
          
          <p className="text-sm text-gray-500 mt-2 min-h-[40px]">
            {description}
          </p>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button className="w-full px-4 py-2 mt-2 text-sm font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            Practice
          </button>
        </div>
      </div>
    </Link>
  );
}