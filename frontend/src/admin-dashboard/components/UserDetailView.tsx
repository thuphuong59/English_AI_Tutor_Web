"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { FiArrowLeft, FiMessageSquare, FiCalendar, FiClock, FiFileText } from 'react-icons/fi';

interface UserDetailProps {
    userId: string;
}

interface UserInfo {
    id: string;
    username: string;
    role: string;
    status: string;
    created_at: string;
    session_count: number;
}

interface SessionInfo {
    id: string;
    topic: string | null; // Cho phép null
    created_at: string;
}

const API_BASE_URL = 'http://127.0.0.1:8000';

const getAdminToken = () => {
    if (typeof window !== 'undefined') return localStorage.getItem('adminToken');
    return null;
};

const UserDetailView: React.FC<UserDetailProps> = ({ userId }) => {
    const [user, setUser] = useState<UserInfo | null>(null);
    const [sessions, setSessions] = useState<SessionInfo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const token = getAdminToken();
            if (!token) return;

            try {
                console.log("Fetching details for User ID:", userId);

                // 1. Lấy thông tin User
                const userRes = await axios.get(`${API_BASE_URL}/admin/users/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log("User Data:", userRes.data);
                setUser(userRes.data);

                // 2. Lấy danh sách Sessions
                const sessionRes = await axios.get(`${API_BASE_URL}/admin/users/${userId}/sessions`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log("Sessions Data:", sessionRes.data); // <--- KIỂM TRA DÒNG NÀY TRONG CONSOLE
                setSessions(sessionRes.data);

            } catch (error) {
                console.error("Error fetching detail:", error);
            } finally {
                setLoading(false);
            }
        };

        if (userId) fetchData();
    }, [userId]);

    // Hàm format ngày an toàn
    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleString();
        } catch (e) {
            return "Invalid Date";
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
    );
    
    if (!user) return <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg border border-red-200">User not found.</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans">
            {/* Nút Quay lại */}
            <Link href="/admin/users" className="inline-flex items-center text-gray-600 hover:text-blue-600 mb-6 transition-colors duration-200 font-medium">
                <FiArrowLeft className="mr-2" /> Back to Users
            </Link>

            {/* Thông tin User Card */}
            <div className="bg-white shadow-lg rounded-xl p-6 mb-8 border border-gray-100">
                <div className="flex items-center mb-6">
                    <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md mr-4">
                        {(user.username || "U").charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">{user.username || "No Name"}</h2>
                        <p className="text-sm text-gray-500 font-mono">ID: {user.id}</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm border-t border-gray-100 pt-6">
                    <div className="flex flex-col">
                        <span className="text-gray-500 mb-1">Role</span>
                        <span className="font-semibold text-indigo-700 uppercase bg-indigo-50 px-3 py-1 rounded-full w-fit border border-indigo-100">{user.role}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-500 mb-1">Status</span>
                        <span className={`font-semibold uppercase px-3 py-1 rounded-full w-fit border ${
                            user.status === 'active' 
                            ? 'bg-green-50 text-green-700 border-green-100' 
                            : 'bg-red-50 text-red-700 border-red-100'
                        }`}>
                            {user.status}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-500 mb-1">Total Sessions</span>
                        <div className="flex items-center font-bold text-gray-800 text-lg">
                            <FiMessageSquare className="mr-2 text-blue-500" />
                            {user.session_count}
                        </div>
                    </div>
                </div>
            </div>

            {/* Danh sách Sessions */}
            <div className="flex items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                    <FiClock className="mr-2 text-blue-600" /> Learning History
                </h3>
                <span className="ml-3 bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs font-bold">{sessions.length}</span>
            </div>

            {sessions.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center border border-gray-200 shadow-sm">
                    <div className="inline-block p-4 bg-gray-50 rounded-full mb-3">
                        <FiMessageSquare className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">This user hasn't started any conversation sessions yet.</p>
                    <p className="text-xs text-gray-400 mt-2">(API returned 0 sessions)</p>
                </div>
            ) : (
                <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Topic</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sessions.map((session) => (
                                <tr key={session.id} className="hover:bg-blue-50/30 transition duration-150 group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 flex items-center">
                                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                                            {/* Xử lý hiển thị nếu topic null */}
                                            {session.topic || "General Conversation"}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex items-center">
                                            <FiCalendar className="mr-2 text-gray-400" />
                                            {formatDate(session.created_at)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link 
                                            href={`/admin/sessions/${session.id}`}
                                            className="inline-flex items-center px-4 py-2 border border-blue-600 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-600 hover:text-white transition-all duration-200 shadow-sm hover:shadow"
                                        >
                                            <FiFileText className="mr-1.5" /> View Transcript
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default UserDetailView;