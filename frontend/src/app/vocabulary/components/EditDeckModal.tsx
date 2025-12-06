'use client';

import { useState } from 'react';
import { updateDeck } from '@/services/vocabService';
import { Deck } from '../type';
import { X, Loader2, Pencil } from 'lucide-react';

interface Props {
  deckToEdit: Deck;
  onClose: () => void;
}

export default function EditDeckModal({ deckToEdit, onClose }: Props) {
  const [name, setName] = useState(deckToEdit.name);
  const [description, setDescription] = useState(deckToEdit.description || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateDeck(deckToEdit.id, { name, description });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to update deck!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4">
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md">
        
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Pencil size={24} className="text-[#0067C5]" />
            Edit Deck
          </h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100">
            <X size={22} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="deckName" className="block text-sm font-medium text-gray-700 mb-1">
              Deck Name
            </label>
            <input
              type="text" id="deckName" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0067C5]"
            />
          </div>
          <div>
            <label htmlFor="deckDesc" className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="deckDesc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0067C5]"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-800 bg-gray-100 rounded-lg hover:bg-gray-200">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-[#0067C5] rounded-lg hover:brightness-110">
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
