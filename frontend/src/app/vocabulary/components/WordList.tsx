'use client';

import { useState } from 'react';
import { mutate } from 'swr';
import { 
  Inbox, AlertTriangle, MoreHorizontal, Loader2, BookCopy, 
  CalendarClock, Target, CheckCircle2, Trash2, Pencil, X, Volume2 
} from 'lucide-react';
import { MyWord as Word } from '../type';
import { deleteWord, updateWord } from '@/services/vocabService';
import WordTypeBadge from './WordTypeBadge'; 

interface EditModalProps {
  wordToEdit: Word;
  onClose: () => void;
}


function EditWordModal({ wordToEdit, onClose }: EditModalProps) {
  const [word, setWord] = useState(wordToEdit.word);
  const [type, setType] = useState(wordToEdit.type || '');
  const [definition, setDefinition] = useState(wordToEdit.definition || '');
  const [example, setExample] = useState(wordToEdit.context_sentence || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateWord(wordToEdit.id, { word, type, definition, example });
      onClose();
      mutate('/vocabulary/dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to update word!');
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
            Edit Word
          </h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100">
            <X size={22} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="word" className="block text-sm font-medium text-gray-700 mb-1">Word</label>
            <input
              type="text" id="word" value={word} onChange={(e) => setWord(e.target.value)} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0067C5]"
            />
          </div>
          {/* Type Input */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Part of Speech</label>
            <input
              type="text" id="type" value={type} onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0067C5]"
              placeholder="e.g. noun"
            />
          </div>
          <div>
            <label htmlFor="definition" className="block text-sm font-medium text-gray-700 mb-1">Definition</label>
            <textarea
              id="definition" rows={3} value={definition} onChange={(e) => setDefinition(e.target.value)} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0067C5]"
            />
          </div>
          <div>
            <label htmlFor="example" className="block text-sm font-medium text-gray-700 mb-1">Example Sentence</label>
            <textarea
              id="example" rows={2} value={example} onChange={(e) => setExample(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0067C5]"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-800 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={isLoading} className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-[#0067C5] rounded-lg hover:bg-[#0055A5]">
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface Props {
  words: Word[] | undefined;
  error: any;
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

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

export default function WordList({ words, error }: Props) {
  const [loadingId, setLoadingId] = useState<number | null>(null); 
  const [openMenuId, setOpenMenuId] = useState<number | null>(null); 
  const [wordToEdit, setWordToEdit] = useState<Word | null>(null); 

  const handleDelete = async (wordId: number) => {
    if (!confirm('Are you sure you want to delete this word?')) return;
    setLoadingId(wordId);
    setOpenMenuId(null); 
    try {
      await deleteWord(wordId);
      mutate('/vocabulary/dashboard'); // Refresh list
    } catch (err) {
      console.error(err);
      alert('Failed to delete word.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleOpenEditModal = (word: Word) => {
    setWordToEdit(word);
    setOpenMenuId(null); 
  };

  if (error) return <div className="p-10 text-center text-red-600">Error Loading Word List</div>;
  if (!words) return <div className="p-10 text-center">Loading...</div>;
  if (words.length === 0) return (
    <div className="flex flex-col items-center justify-center p-10 bg-white rounded-2xl shadow-lg border border-gray-100 text-center">
      <Inbox className="w-12 h-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-semibold text-gray-700">Your Vocabulary is Empty</h3>
      <p className="text-gray-500">Try adding a new word to get started!</p>
    </div>
  );

  return (
    <>
      {wordToEdit && (
        <EditWordModal
          wordToEdit={wordToEdit}
          onClose={() => setWordToEdit(null)}
        />
      )}

      <div className="space-y-4">
        {words.map((word) => (
          <div key={word.id} className="bg-white rounded-2xl shadow-lg transition-all hover:shadow-xl overflow-hidden">
            <div className="p-5 pb-0"> 
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <h3 className="text-3xl font-bold text-gray-800">{word.word}</h3>
                  
                  {/* --- HIỂN THỊ BADGE LOẠI TỪ --- */}
                  <WordTypeBadge type={word.type} />

                  {word.pronunciation && (
                    <span className="text-lg text-gray-500 italic">
                      {word.pronunciation}
                    </span>
                  )}
                  <button 
                    onClick={(e) => playAudio(e, word.audio_url)}
                    disabled={!word.audio_url}
                    className="p-1 text-gray-400 rounded-full hover:bg-gray-100 hover:text-[#0067C5] transition-colors disabled:text-gray-200"
                  >
                    <Volume2 size={20} />
                  </button>
                </div>

                <div className="relative">
                  <button 
                    onClick={() => setOpenMenuId(openMenuId === word.id ? null : word.id)} 
                    className="text-gray-400 hover:text-[#0067C5] p-1 rounded-full hover:bg-gray-100"
                  >
                    {loadingId === word.id ? <Loader2 size={20} className="animate-spin" /> : <MoreHorizontal size={20} />}
                  </button>

                  {openMenuId === word.id && (
                    <div 
                      className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-lg z-10 overflow-hidden"
                      onMouseLeave={() => setOpenMenuId(null)} 
                    >
                      <button 
                        onClick={() => handleOpenEditModal(word)}
                        className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Pencil size={16} /> Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(word.id)}
                        className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {word.definition && (
                <div className="mb-4">
                  <h4 className="text-base font-semibold text-gray-700">Definition:</h4>
                  <p className="text-gray-800 ml-2">{word.definition}</p>
                </div>
              )}

              {word.context_sentence && (
                <div className="mt-4 pb-5 border-t border-gray-100 pt-5"> 
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 mb-2">
                    <BookCopy size={16} className="text-gray-400" />
                    <span>Context</span>
                  </div>
                  <p className="text-gray-700 italic pl-6 border-l-2 border-[#0067C5]/20">
                    "{word.context_sentence}"
                  </p>
                </div>
              )}
            </div> 

            <div className="bg-[#E8F3FD] px-5 py-3 flex justify-between items-center text-sm text-[#004C91] font-medium">
              <span className={`px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full 
                ${word.status === 'learning' ? 'bg-[#CDE4FA] text-[#004C91]' : 'bg-green-100 text-green-800'}`}>
                {word.status === 'learning' ? <Target size={14} className="mr-1" /> : <CheckCircle2 size={14} className="mr-1" />}
                {word.status === 'learning' ? 'Learning' : 'Mastered'}
              </span>
              <div className="flex items-center gap-1.5 text-gray-600">
                <CalendarClock size={16} />
                <span>Next Review:</span>
                <span className="font-semibold">
                  {word.next_review_date ? formatDate(word.next_review_date) : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};