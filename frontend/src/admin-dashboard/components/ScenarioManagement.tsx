"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPlus, FiTrash2, FiSearch, FiMessageCircle, FiGrid, FiBarChart2, FiUser, FiCpu, FiEdit, FiFilter } from 'react-icons/fi';
import ConfirmModal from './ConfirmModal';
import ScenarioModal from './ScenarioModal'; 

interface Dialogue {
    turn: number;
    speaker: 'ai' | 'user';
    line: string;
}

interface Scenario {
    id: string; 
    title: string;
    topic: string;
    level: string;
    dialogues: Dialogue[];
}

const API_BASE_URL = 'http://127.0.0.1:8000';

const getAdminToken = () => typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

const ScenarioManagement: React.FC = () => {
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // State Sắp xếp
    const [sortBy, setSortBy] = useState<'newest' | 'level_asc' | 'level_desc'>('newest');

    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: '', title: '' });
    const [scenarioModal, setScenarioModal] = useState({ isOpen: false, data: null as Scenario | null });

    const fetchScenarios = async () => {
        const token = getAdminToken();
        if (!token) return;
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/scenarios/`, {
                headers: { Authorization: `Bearer ${token}` },
                params: searchTerm ? { search: searchTerm } : {}
            });
            setScenarios(res.data);
        } catch (err) { console.error(err); } 
        finally { setLoading(false); }
    };

    useEffect(() => { fetchScenarios(); }, []);

    // Logic Sắp xếp
    const getSortedScenarios = () => {
        const sorted = [...scenarios];
        const levelOrder: Record<string, number> = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 };

        if (sortBy === 'level_asc') {
            sorted.sort((a, b) => (levelOrder[a.level] || 0) - (levelOrder[b.level] || 0));
        } else if (sortBy === 'level_desc') {
            sorted.sort((a, b) => (levelOrder[b.level] || 0) - (levelOrder[a.level] || 0));
        } 
        return sorted;
    };

    const handleDelete = async () => {
        const token = getAdminToken();
        try {
            await axios.delete(`${API_BASE_URL}/admin/scenarios/${confirmModal.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setScenarios(prev => prev.filter(s => s.id !== confirmModal.id));
            setConfirmModal({ ...confirmModal, isOpen: false });
        } catch (err) { alert("Failed to delete scenario."); }
    };

    const handleSave = async (data: any) => {
        const token = getAdminToken();
        try {
            if (scenarioModal.data) {
                // UPDATE
                const res = await axios.put(`${API_BASE_URL}/admin/scenarios/${scenarioModal.data.id}`, data, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setScenarios(prev => prev.map(s => s.id === res.data.id ? res.data : s));
            } else {
                // CREATE
                const res = await axios.post(`${API_BASE_URL}/admin/scenarios/`, data, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setScenarios(prev => [res.data, ...prev]);
            }
        } catch (err) { 
            console.error(err);
            alert("Failed to save scenario."); 
        }
    };

    const getLevelBadge = (level: string) => {
        const lvl = level?.toLowerCase() || '';
        if (lvl.includes('beginner')) return 'bg-green-100 text-green-700 border-green-200';
        if (lvl.includes('intermediate')) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        if (lvl.includes('advanced')) return 'bg-red-100 text-red-700 border-red-200';
        return 'bg-gray-100 text-gray-700 border-gray-200';
    };

    if (loading && scenarios.length === 0) return (
        <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div></div>
    );

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Roleplay Scenarios</h1>
                    <p className="text-gray-500 mt-1">Manage AI conversation scripts.</p>
                </div>
                {/* --- NÚT CHÍNH: MÀU XANH --- */}
                <button 
                    onClick={() => setScenarioModal({ isOpen: true, data: null })}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-md flex items-center gap-2 transition-all"
                >
                    <FiPlus size={18} /> New Scenario
                </button>
            </div>

            {/* --- TOOLBAR: SEARCH & SORT --- */}
            <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-4">
                <div className="flex-grow flex items-center gap-3 w-full bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                    <FiSearch className="text-gray-400" />
                    <input
                        type="text"
                        className="bg-transparent outline-none text-sm text-gray-700 w-full"
                        placeholder="Search by title..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchScenarios()}
                    />
                </div>
                
                {/* Dropdown Sắp xếp */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <FiFilter className="text-gray-500" />
                    <select 
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:border-blue-500 bg-white"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                    >
                        <option value="newest">Newest First</option>
                        <option value="level_asc">Level: Beginner → Advanced</option>
                        <option value="level_desc">Level: Advanced → Beginner</option>
                    </select>
                </div>
                
                {/* --- NÚT SEARCH: MÀU XANH --- */}
                <button onClick={() => fetchScenarios()} className="text-blue-600 font-semibold text-sm hover:underline whitespace-nowrap">Search</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getSortedScenarios().map(scen => (
                    <div key={scen.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col h-full">
                        <div className="p-5 border-b border-gray-50 flex justify-between items-start">
                            <div>
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${getLevelBadge(scen.level)}`}>
                                    {scen.level}
                                </span>
                                <h3 className="text-lg font-bold text-gray-800 mt-2 leading-snug">{scen.title}</h3>
                                <div className="flex items-center text-xs text-gray-500 mt-1 font-medium">
                                    <FiGrid className="mr-1.5" /> {scen.topic}
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button 
                                    onClick={() => setScenarioModal({ isOpen: true, data: scen })}
                                    className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                                    title="Edit Scenario"
                                >
                                    <FiEdit size={18} />
                                </button>
                                <button 
                                    onClick={() => setConfirmModal({isOpen: true, id: scen.id, title: scen.title})} 
                                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                    title="Delete Scenario"
                                >
                                    <FiTrash2 size={18} />
                                </button>
                            </div>
                        </div>
                        
                        <div className="p-4 bg-gray-50/50 flex-grow">
                            <div className="text-xs font-semibold text-gray-400 uppercase mb-2 flex items-center gap-1">
                                <FiMessageCircle /> Preview
                            </div>
                            <div className="space-y-2 h-32 overflow-y-auto custom-scrollbar pr-2">
                                {scen.dialogues && scen.dialogues.length > 0 ? (
                                    scen.dialogues.map((d, idx) => (
                                        <div key={idx} className="text-sm">
                                            {/* Giữ màu speaker khác nhau để dễ đọc: AI Xanh, User Tím/Indigo */}
                                            <span className={`font-bold mr-1 inline-flex items-center gap-1 ${d.speaker === 'ai' ? 'text-blue-600' : 'text-indigo-600'}`}>
                                                {d.speaker === 'ai' ? <FiCpu size={10}/> : <FiUser size={10}/>}
                                                {d.speaker === 'ai' ? 'AI' : 'User'}:
                                            </span> 
                                            <span className="text-gray-700">{d.line}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="italic text-gray-400 text-sm">No dialogues available.</p>
                                )}
                            </div>
                        </div>
                        
                        <div className="p-3 bg-white border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 rounded-b-xl">
                            <span className="flex items-center gap-1">
                                <FiBarChart2 /> {scen.dialogues?.length || 0} turns
                            </span>
                            <span className="font-mono opacity-50">ID: {scen.id.toString().substring(0, 4)}...</span>
                        </div>
                    </div>
                ))}
            </div>

            {scenarios.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <h3 className="text-lg font-medium text-gray-900">No scenarios found</h3>
                </div>
            )}

            <ConfirmModal 
                isOpen={confirmModal.isOpen} 
                onClose={() => setConfirmModal({...confirmModal, isOpen: false})}
                onConfirm={handleDelete}
                title="Delete Scenario"
                message={`Are you sure you want to delete "${confirmModal.title}"?`}
                isDanger={true}
            />

            <ScenarioModal 
                isOpen={scenarioModal.isOpen}
                onClose={() => setScenarioModal({...scenarioModal, isOpen: false})}
                onSave={handleSave}
                initialData={scenarioModal.data} 
            />
        </div>
    );
};

export default ScenarioManagement;