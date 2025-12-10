'use client';

import { useState } from 'react';
import { createDeck } from '@/services/vocabService';
import { X, Loader2, BookPlus } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  // Callback để báo cho component cha reload dữ liệu
  onSuccess?: () => void; 
}

export default function AddNewDeckModal({ isOpen, onClose, onSuccess }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await createDeck(name, description || null);
      
      // Reset form
      setName('');
      setDescription('');
      
      // Gọi hàm success để component cha cập nhật danh sách ngay lập tức
      if (onSuccess) {
        onSuccess();
      }

      // Đóng modal sau khi đã xử lý xong
      onClose();
      
    } catch (err) {
      console.error(err);
      alert('Failed to create deck!');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md transform transition-all scale-100">
        
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BookPlus size={24} className="text-[#0067C5]" />
            Create New Deck
          </h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={22} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="deckName" className="block text-sm font-medium text-gray-700 mb-1">
              Deck Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="deckName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0067C5] focus:border-transparent transition-all"
              placeholder="e.g., IELTS Task 2 Vocab"
            />
          </div>

          <div>
            <label htmlFor="deckDesc" className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="deckDesc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0067C5] focus:border-transparent transition-all resize-none"
              placeholder="e.g., Useful words for writing essays"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-[#0067C5] rounded-lg hover:bg-[#0055A5] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Deck'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}