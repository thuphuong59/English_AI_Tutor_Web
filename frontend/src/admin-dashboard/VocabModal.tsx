"use client";

import React, { useState, useEffect } from 'react';
import { FiX, FiSave, FiType, FiMic, FiAlignLeft, FiVolume2, FiHash } from 'react-icons/fi';

interface VocabModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    initialData?: any;
    deckId: number; // Cần biết đang thêm vào bộ nào
}

const VocabModal: React.FC<VocabModalProps> = ({ isOpen, onClose, onSave, initialData, deckId }) => {
    const [formData, setFormData] = useState({
        word: '',
        type: 'noun',
        pronunciation: '', // IPA
        definition: '',
        context_sentence: '',
        audio_url: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                word: initialData.word || '',
                type: initialData.type || 'noun',
                pronunciation: initialData.pronunciation || initialData.ipa || '',
                definition: initialData.definition || initialData.meaning || '',
                context_sentence: initialData.context_sentence || initialData.example_sentence || '',
                audio_url: initialData.audio_url || ''
            });
        } else {
            setFormData({ word: '', type: 'noun', pronunciation: '', definition: '', context_sentence: '', audio_url: '' });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, deck_id: deckId });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-teal-600 p-4 flex justify-between items-center text-white">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        {initialData ? 'Edit Vocabulary' : 'Add New Word'}
                    </h3>
                    <button onClick={onClose}><FiX size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Hàng 1: Word & Type */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Word</label>
                            <div className="flex items-center border rounded-lg px-3 py-2 mt-1">
                                <FiType className="text-gray-400 mr-2"/>
                                <input type="text" required className="w-full outline-none font-bold text-lg" placeholder="apple" value={formData.word} onChange={e => setFormData({...formData, word: e.target.value})} />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Type</label>
                            <div className="flex items-center border rounded-lg px-3 py-2 mt-1">
                                <FiHash className="text-gray-400 mr-2"/>
                                <select className="w-full outline-none bg-white" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                                    <option value="noun">Noun</option>
                                    <option value="verb">Verb</option>
                                    <option value="adj">Adj</option>
                                    <option value="adv">Adv</option>
                                    <option value="phrase">Phrase</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Hàng 2: IPA & Definition */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Pronunciation (IPA)</label>
                        <div className="flex items-center border rounded-lg px-3 py-2 mt-1">
                            <FiMic className="text-gray-400 mr-2"/>
                            <input type="text" className="w-full outline-none font-mono text-gray-600" placeholder="/ˈæp.l̩/" value={formData.pronunciation} onChange={e => setFormData({...formData, pronunciation: e.target.value})} />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Definition</label>
                        <div className="flex items-start border rounded-lg px-3 py-2 mt-1">
                            <FiAlignLeft className="text-gray-400 mr-2 mt-1"/>
                            <textarea required rows={2} className="w-full outline-none" placeholder="A round fruit with red or green skin..." value={formData.definition} onChange={e => setFormData({...formData, definition: e.target.value})} />
                        </div>
                    </div>

                    {/* Hàng 3: Example */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Example Sentence</label>
                        <input type="text" className="w-full border rounded-lg px-3 py-2 mt-1 outline-none" placeholder="She eats an apple every day." value={formData.context_sentence} onChange={e => setFormData({...formData, context_sentence: e.target.value})} />
                    </div>

                    <div className="pt-4 flex justify-end gap-2 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"><FiSave /> Save Word</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VocabModal;