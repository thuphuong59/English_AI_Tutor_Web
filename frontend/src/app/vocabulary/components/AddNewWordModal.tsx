'use client';

import { useState } from 'react';
import { addNewWordManually } from '@/services/vocabService';
import { X, Loader2, BookPlus } from 'lucide-react'; 

interface Props {
  isOpen: boolean;
  onClose: () => void;
  deckId: number;
}

export default function AddNewWordModal({ isOpen, onClose, deckId }: Props) {
  const [word, setWord] = useState('');
  const [type, setType] = useState(''); 
  const [definition, setDefinition] = useState('');
  const [example, setExample] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deckId) {
      alert('Error: No deck selected.');
      return;
    }

    setIsLoading(true);
    try {
      // Gửi thêm type lên server
      await addNewWordManually({ word, type, definition, example }, deckId);
      onClose();
      setWord('');
      setType('');
      setDefinition('');
      setExample('');
    } catch (err) {
      console.error(err);
      alert('Failed to save word!');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4">
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md">
        
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BookPlus size={24} style={{ color: '#0067C5' }} />
            Add New Word
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={22} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Word */}
          <div>
            <label htmlFor="word" className="block text-sm font-medium text-gray-700 mb-1">
              Word
            </label>
            <input
              type="text"
              id="word"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0067C5]"
              placeholder="e.g., essential"
            />
          </div>

          {/* Type (New) */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Part of Speech (Optional)
            </label>
            <input
              type="text"
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0067C5]"
              placeholder="e.g., adjective, noun, idiom"
            />
          </div>

          {/* Definition */}
          <div>
            <label htmlFor="definition" className="block text-sm font-medium text-gray-700 mb-1">
              Definition
            </label>
            <textarea
              id="definition"
              rows={3}
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0067C5] resize-none"
              placeholder="e.g., Extremely important; absolutely necessary."
            />
          </div>

          {/* Example */}
          <div>
            <label htmlFor="example" className="block text-sm font-medium text-gray-700 mb-1">
              Example Sentence (Optional)
            </label>
            <textarea
              id="example"
              rows={2}
              value={example}
              onChange={(e) => setExample(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0067C5] resize-none"
              placeholder="e.g., Regular practice is essential for improvement."
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-800 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              style={{ backgroundColor: '#0067C5' }}
              className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-md hover:brightness-110 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Word'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}