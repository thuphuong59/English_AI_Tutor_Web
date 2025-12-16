"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiArrowLeft, FiUser, FiCpu } from 'react-icons/fi';

const API_BASE_URL = 'http://127.0.0.1:8000';

export default function SessionTranscriptView({ sessionId }: { sessionId: string }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTranscript = async () => {
            const token = localStorage.getItem('adminToken');
            try {
                const res = await axios.get(`${API_BASE_URL}/admin/sessions/${sessionId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setData(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchTranscript();
    }, [sessionId]);

    if (loading) return <div className="p-6">Loading transcript...</div>;
    if (!data) return <div className="p-6 text-red-500">Session not found or error loading.</div>;

    const { overview, messages } = data;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <button onClick={() => window.history.back()} className="flex items-center text-gray-600 hover:text-blue-600 mb-4 transition">
                    <FiArrowLeft className="mr-2" /> Back
                </button>
                <h1 className="text-2xl font-bold">{overview.topic || "Conversation Transcript"}</h1>
                <p className="text-gray-500 text-sm">{new Date(overview.created_at).toLocaleString()}</p>
            </div>

            {/* Chat Content */}
            <div className="space-y-6">
                {messages.map((msg: any, index: number) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg p-4 shadow-sm ${
                            msg.role === 'user' 
                            ? 'bg-blue-50 border border-blue-100 text-blue-900 rounded-br-none' 
                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                        }`}>
                            <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase opacity-70">
                                {msg.role === 'user' ? <FiUser /> : <FiCpu />}
                                {msg.role}
                            </div>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                            
                            {/* Hiển thị Metadata (nếu có Analysis/Summary) */}
                            {msg.type === 'analysis' && msg.metadata && (
                                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                                    <strong className="text-yellow-800 block mb-1">AI Analysis:</strong>
                                    {/* Render nội dung phân tích ở đây */}
                                    <pre className="text-xs overflow-auto">{JSON.stringify(msg.metadata, null, 2)}</pre>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}