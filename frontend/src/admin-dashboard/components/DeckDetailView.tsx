"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { FiArrowLeft, FiPlus, FiSearch, FiEdit, FiTrash2 } from 'react-icons/fi';
import VocabModal from '../VocabModal';
import ConfirmModal from './ConfirmModal';

const API_BASE_URL = 'http://127.0.0.1:8000';

export default function DeckDetailView({ deckId }: { deckId: number }) {
    const [deck, setDeck] = useState<any>(null);
    const [vocabList, setVocabList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal States
    const [vocabModal, setVocabModal] = useState({ isOpen: false, selectedVocab: null as any });
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: 0 });

    // Lấy token an toàn (chỉ chạy ở client)
    const [token, setToken] = useState<string | null>(null);
    useEffect(() => {
        setToken(localStorage.getItem('adminToken'));
    }, []);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;
            try {
                // Lấy danh sách từ vựng
                const vocabRes = await axios.get(`${API_BASE_URL}/admin/content/decks/${deckId}/vocab`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setVocabList(vocabRes.data);
                
                // Giả lập tên Deck (để tối ưu bạn nên có thêm API get deck detail)
                setDeck({ id: deckId, name: `Deck #${deckId}` }); 
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [deckId, token]);

    const handleSaveVocab = async (data: any) => {
        if (!token) return;
        try {
            if (vocabModal.selectedVocab) {
                // --- SỬA LỖI Ở ĐÂY ---
                // Lấy ID từ state selectedVocab thay vì từ data (vì form không gửi ID)
                const vocabId = vocabModal.selectedVocab.id; 
                
                const res = await axios.put(`${API_BASE_URL}/admin/content/vocab/${vocabId}`, data, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setVocabList(prev => prev.map(v => v.id === res.data.id ? res.data : v));
            } else {
                // Create
                const res = await axios.post(`${API_BASE_URL}/admin/content/vocab`, data, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setVocabList(prev => [res.data, ...prev]);
            }
        } catch (error) {
            console.error(error);
            alert("Failed to save vocabulary.");
        }
    };

    const handleDeleteVocab = async () => {
        if (!token) return;
        try {
            await axios.delete(`${API_BASE_URL}/admin/content/vocab/${confirmModal.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVocabList(prev => prev.filter(v => v.id !== confirmModal.id));
            setConfirmModal({ ...confirmModal, isOpen: false });
        } catch (error) {
            alert("Failed to delete vocabulary.");
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
    );

    const filteredVocab = vocabList.filter(v => 
        v.word?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/admin/content/decks" className="p-2 bg-white rounded-full shadow hover:bg-gray-100 text-gray-600 transition">
                        <FiArrowLeft />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Deck Management</h1>
                        <p className="text-gray-500">Managing vocabulary for Deck ID: <span className="font-mono font-bold">{deckId}</span></p>
                    </div>
                </div>
                <button 
                    onClick={() => setVocabModal({ isOpen: true, selectedVocab: null })}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow flex items-center gap-2 transition"
                >
                    <FiPlus /> Add New Word
                </button>
            </div>

            {/* Search */}
            <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative">
                <FiSearch className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                    type="text" 
                    className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500 transition" 
                    placeholder="Search vocabulary in this deck..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Vocab List */}
            <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Word</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Definition</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Example</th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-32">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredVocab.map((vocab) => (
                            <tr key={vocab.id} className="hover:bg-green-50/30 transition duration-150">
                                <td className="px-6 py-4 align-top">
                                    <div className="flex flex-col">
                                        <div className="text-lg font-bold text-gray-900">{vocab.word}</div>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                            {vocab.type && <span className="italic text-green-600 font-medium">{vocab.type}</span>}
                                            {vocab.type && vocab.pronunciation && <span>•</span>}
                                            {vocab.pronunciation && <span className="font-mono bg-gray-100 px-1.5 rounded text-xs border">{vocab.pronunciation}</span>}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-700 align-top max-w-xs">
                                    {vocab.definition || vocab.meaning}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 italic align-top max-w-xs">
                                    {vocab.context_sentence ? `"${vocab.context_sentence}"` : '-'}
                                </td>
                                <td className="px-6 py-4 text-center align-top">
                                    <div className="flex justify-center gap-2">
                                        <button 
                                            onClick={() => setVocabModal({ isOpen: true, selectedVocab: vocab })} 
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                                            title="Edit"
                                        >
                                            <FiEdit size={18} />
                                        </button>
                                        <button 
                                            onClick={() => setConfirmModal({ isOpen: true, id: vocab.id })} 
                                            className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                                            title="Delete"
                                        >
                                            <FiTrash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredVocab.length === 0 && <div className="p-12 text-center text-gray-500">No vocabulary found in this deck.</div>}
            </div>

            {/* Modals */}
            <VocabModal 
                isOpen={vocabModal.isOpen} 
                onClose={() => setVocabModal({ ...vocabModal, isOpen: false })} 
                onSave={handleSaveVocab} 
                initialData={vocabModal.selectedVocab} 
                deckId={deckId}
            />
            <ConfirmModal 
                isOpen={confirmModal.isOpen} 
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })} 
                onConfirm={handleDeleteVocab} 
                title="Delete Vocabulary" 
                message="Are you sure you want to remove this word from the deck?" 
                isDanger={true} 
            />
        </div>
    );
}