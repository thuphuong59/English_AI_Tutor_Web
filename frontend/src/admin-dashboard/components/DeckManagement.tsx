"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { FiPlus, FiTrash2, FiEdit, FiSearch, FiLayers, FiBookOpen, FiGlobe, FiLock } from 'react-icons/fi';
import ConfirmModal from './ConfirmModal';
import DeckModal from './DeckModal'; // Import Modal vừa tạo

// Interface khớp với Backend Response
interface Deck {
    id: string;
    name: string;
    description?: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    image_url?: string;
    is_public: boolean;
    word_count: number;
    created_at: string;
}

const API_BASE_URL = 'http://127.0.0.1:8000';

const getAdminToken = () => typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

const DeckManagement: React.FC = () => {
    const [decks, setDecks] = useState<Deck[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // State cho Modal Xóa
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: '', title: '' });
    
    // State cho Modal Create/Edit
    const [deckModal, setDeckModal] = useState({ isOpen: false, selectedDeck: null as Deck | null });

    // --- API CALLS ---
    const fetchDecks = async () => {
        const token = getAdminToken();
        if (!token) return;
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/content/decks`, {
                headers: { Authorization: `Bearer ${token}` },
                params: searchTerm ? { search: searchTerm } : {}
            });
            setDecks(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDecks(); }, []);

    // --- HANDLERS ---
    const handleDelete = async () => {
        const token = getAdminToken();
        try {
            await axios.delete(`${API_BASE_URL}/admin/content/decks/${confirmModal.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDecks(prev => prev.filter(d => d.id !== confirmModal.id));
            setConfirmModal({ ...confirmModal, isOpen: false });
        } catch (error) {
            alert("Failed to delete deck.");
        }
    };

    const handleSaveDeck = async (data: any) => {
        const token = getAdminToken();
        try {
            if (deckModal.selectedDeck) {
                // UPDATE
                const res = await axios.put(`${API_BASE_URL}/admin/content/decks/${deckModal.selectedDeck.id}`, data, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setDecks(prev => prev.map(d => d.id === res.data.id ? res.data : d));
            } else {
                // CREATE
                const res = await axios.post(`${API_BASE_URL}/admin/content/decks`, data, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setDecks(prev => [res.data, ...prev]);
            }
        } catch (error) {
            alert("Failed to save deck.");
            console.error(error);
        }
    };

    if (loading && decks.length === 0) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans">
            
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Content Management</h1>
                    <p className="text-gray-500 mt-1">Manage vocabulary decks and lessons.</p>
                </div>
                <button 
                    onClick={() => setDeckModal({ isOpen: true, selectedDeck: null })}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-md flex items-center gap-2 transition-all"
                >
                    <FiPlus size={18} /> Create New Deck
                </button>
            </div>

            {/* --- SEARCH BAR --- */}
            <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                <FiSearch className="text-gray-400" />
                <input
                    type="text"
                    className="flex-grow outline-none text-sm text-gray-700 placeholder-gray-400"
                    placeholder="Search decks by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchDecks()}
                />
                <button onClick={() => fetchDecks()} className="text-blue-600 font-semibold text-sm hover:underline">Search</button>
            </div>

            {/* --- TABLE --- */}
            <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Deck Info</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Level</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Vocab Count</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {decks.map((deck) => (
                            <tr key={deck.id} className="hover:bg-blue-50/30 transition duration-150 group">
                                
                                {/* Deck Info (Image + Name) */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="h-12 w-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                                            {deck.image_url ? (
                                                <img src={deck.image_url} alt={deck.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-gray-400"><FiLayers /></div>
                                            )}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-bold text-gray-900">{deck.name}</div>
                                            <div className="text-xs text-gray-500 truncate max-w-[150px]">{deck.description || "No description"}</div>
                                        </div>
                                    </div>
                                </td>

                                {/* Level */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 rounded text-xs font-semibold capitalize border ${
                                        deck.level === 'beginner' ? 'bg-green-50 text-green-700 border-green-200' :
                                        deck.level === 'intermediate' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                        'bg-red-50 text-red-700 border-red-200'
                                    }`}>
                                        {deck.level}
                                    </span>
                                </td>

                                {/* Status */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {deck.is_public ? (
                                        <span className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 w-fit">
                                            <FiGlobe /> Public
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-200 w-fit">
                                            <FiLock /> Private
                                        </span>
                                    )}
                                </td>

                                {/* Count */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    <span className="font-mono font-bold">{deck.word_count}</span> words
                                </td>

                                {/* Actions */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col space-y-2">
                                        
                                        {/* NÚT 1: XEM TỪ VỰNG (Quan trọng nhất) */}
                                        <Link href={`/admin/content/decks/${deck.id}`} className="w-full">
                                            <button className="w-full text-green-600 border border-green-200 hover:bg-green-50 hover:border-green-300 font-medium py-1.5 px-2 rounded text-xs transition duration-200 flex items-center justify-center gap-1">
                                                <FiBookOpen /> Manage Vocab
                                            </button>
                                        </Link>

                                        <div className="grid grid-cols-2 gap-2">
                                            {/* NÚT 2: SỬA DECK */}
                                            <button 
                                                onClick={() => setDeckModal({ isOpen: true, selectedDeck: deck })}
                                                className="w-full text-indigo-600 border border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 font-medium py-1.5 px-2 rounded text-xs transition duration-200 flex items-center justify-center gap-1"
                                            >
                                                <FiEdit /> Edit
                                            </button>

                                            {/* NÚT 3: XÓA DECK */}
                                            <button 
                                                onClick={() => setConfirmModal({ isOpen: true, id: deck.id, title: deck.name })}
                                                className="w-full text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300 font-medium py-1.5 px-2 rounded text-xs transition duration-200 flex items-center justify-center gap-1"
                                            >
                                                <FiTrash2 /> Del
                                            </button>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {decks.length === 0 && (
                    <div className="p-12 text-center text-gray-500">No decks found. Create one to get started!</div>
                )}
            </div>

            {/* --- MODALS --- */}
            <ConfirmModal 
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={handleDelete}
                title="Delete Deck"
                message={`Are you sure you want to delete "${confirmModal.title}"? All vocabulary inside will also be deleted.`}
                isDanger={true}
            />

            <DeckModal 
                isOpen={deckModal.isOpen}
                onClose={() => setDeckModal({ ...deckModal, isOpen: false })}
                onSave={handleSaveDeck}
                initialData={deckModal.selectedDeck}
            />
        </div>
    );
};

export default DeckManagement;