'use client';

import Link from 'next/link';
import { PublicDeck } from '../../type'; 
import { Library, BarChart3 } from 'lucide-react';

interface Props {
  deck: PublicDeck;
}

export default function PublicDeckCard({ deck }: Props) {
  const { id, name, description, level, image_url } = deck;
  
  const defaultImage = "https://placehold.co/600x400/e2e8f0/1e293b?text=Vocabulary";

  return (
    <Link href={`/vocabulary/public-review/${id}`} className="block h-full group">
      <div className="bg-white rounded-2xl shadow-lg h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-100 overflow-hidden">
        
        <div className="h-48 w-full relative bg-gray-100 overflow-hidden">
            <img 
                src={image_url || defaultImage} 
                alt={name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                    (e.target as HTMLImageElement).src = defaultImage;
                }}
            />
            {level && (
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-blue-700 shadow-sm flex items-center gap-1">
                    <BarChart3 size={14} />
                    {level}
                </div>
            )}
        </div>

        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50 w-fit px-2 py-1 rounded-md mb-3">
            <Library size={14} />
            <span>Official Deck</span>
          </div>
          
          <h3 className="text-xl font-bold text-gray-800 line-clamp-1 mb-2 group-hover:text-blue-600 transition-colors" title={name}>
            {name}
          </h3>
          
          <p className="text-sm text-gray-500 line-clamp-2 flex-1">
            {description || "Master new words with this official vocabulary set."}
          </p>

          <div className="mt-5 pt-4 border-t border-gray-100">
            <button className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-[#0067C5] rounded-xl hover:bg-[#0055A5] transition-colors shadow-sm flex items-center justify-center gap-2">
              Practice Now
            </button>
          </div>
        </div>

      </div>
    </Link>
  );
}