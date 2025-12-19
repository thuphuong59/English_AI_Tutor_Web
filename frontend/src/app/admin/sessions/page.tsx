"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import AdminLayout from '../../../admin-dashboard/components/AdminLayout';
import { FiMessageSquare, FiUser, FiCalendar, FiClock, FiEye, FiSearch } from 'react-icons/fi';

interface SessionGlobal {
    id: string;
    user_id: string;
    topic: string;
    created_at: string;
    profiles: {
        username: string;
        email?: string;
    };
}

const API_BASE_URL = 'http://127.0.0.1:8000';

const SessionHistoryPage = () => {
    const [sessions, setSessions] = useState<SessionGlobal[]>([]);
    const [loading, setLoading] = useState(true);
    // State cho tìm kiếm
    const [searchTerm, setSearchTerm] = useState('');

    const fetchSessions = async (query: string = '') => {
        const token = localStorage.getItem('adminToken');
        if (!token) return;
        
        setLoading(true);
        try {
            // Gửi tham số search lên API
            const res = await axios.get(`${API_BASE_URL}/admin/sessions`, {
                headers: { Authorization: `Bearer ${token}` },
                params: query ? { search: query } : {} 
            });
            setSessions(res.data);
        } catch (err) {
            console.error("Error fetching sessions:", err);
        } finally {
            setLoading(false);
        }
    };

    // Load lần đầu
    useEffect(() => {
        fetchSessions();
    }, []);

    // Xử lý khi nhấn Enter
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            fetchSessions(searchTerm);
        }
    };

    return (
        <AdminLayout>
            <div className="p-6 bg-gray-50 min-h-screen">
                
                {/* Header & Search */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Global Session History</h1>
                        <p className="text-gray-500 text-sm mt-1">Monitor conversations across the platform.</p>
                    </div>
                    
                    {/* Search Bar */}
                    <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm w-full md:w-auto">
                        <FiSearch className="text-gray-400 mr-2" />
                        <input 
                            type="text" 
                            placeholder="Search user or topic..." 
                            className="outline-none text-sm text-gray-700 w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <button 
                            onClick={() => fetchSessions(searchTerm)}
                            className="ml-2 text-xs font-bold text-blue-600 hover:text-blue-800 uppercase"
                        >
                            Search
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Topic</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Time</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {sessions.map((session) => (
                                    <tr key={session.id} className="hover:bg-blue-50/30 transition duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm mr-3 shadow-sm">
                                                    {session.profiles?.username?.charAt(0).toUpperCase() || "U"}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {session.profiles?.username || "Unknown User"}
                                                    </div>
                                                    <div className="text-xs text-gray-400 font-mono">
                                                        ID: {session.user_id.substring(0, 6)}...
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-sm text-gray-700">
                                                <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2 flex-shrink-0"></span>
                                                <span className="truncate max-w-xs block" title={session.topic}>
                                                    {session.topic || "General Conversation"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex flex-col">
                                                <span className="flex items-center gap-1 font-medium">
                                                    <FiCalendar size={14} className="text-gray-400"/> 
                                                    {new Date(session.created_at).toLocaleDateString()}
                                                </span>
                                                <span className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                                                    <FiClock size={12}/> 
                                                    {new Date(session.created_at).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <Link 
                                                href={`/admin/sessions/${session.id}`}
                                                className="inline-flex items-center px-3 py-1.5 border border-blue-200 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-50 transition shadow-sm"
                                            >
                                                <FiEye className="mr-1.5" /> View Transcript
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        {sessions.length === 0 && (
                            <div className="p-16 text-center">
                                <div className="bg-gray-100 p-4 rounded-full inline-block mb-3">
                                    <FiSearch size={24} className="text-gray-400" />
                                </div>
                                <h3 className="text-gray-900 font-medium">No sessions found</h3>
                                <p className="text-gray-500 text-sm mt-1">Try searching for a different user or topic.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default SessionHistoryPage;