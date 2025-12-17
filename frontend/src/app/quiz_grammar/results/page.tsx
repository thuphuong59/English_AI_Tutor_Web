"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Loader2, Trophy, CheckCircle, XCircle, RefreshCw, Home } from "lucide-react";

function ResultsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const sessionId = searchParams.get('sessionId');
    
    const [resultData, setResultData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchResults = async () => {
            const token = localStorage.getItem('access_token');
            if (!sessionId) return;

            try {
                const response = await fetch(`http://127.0.0.1:8000/api/quiz-grammar/${sessionId}/result`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setResultData(data);
                }
            } catch (error) {
                console.error("Error fetching results:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchResults();
    }, [sessionId]);

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        </div>
    );

    if (!resultData) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <p className="text-red-500 font-bold">Không tìm thấy dữ liệu kết quả cho phiên này.</p>
            <button 
                onClick={() => router.push('/roadmap')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
                Quay lại Roadmap
            </button>
        </div>
    );

    // Tính toán tỷ lệ phần trăm
    const percentage = resultData.total > 0 
        ? Math.round((resultData.score / resultData.total) * 100) 
        : 0;

    return (
        <main className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-2xl mx-auto text-center animate-in fade-in zoom-in duration-500">
                
                {/* Icon Cúp */}
                {/* <div className="mb-6 flex justify-center">
                    <div className="p-5 rounded-full bg-white shadow-xl ring-8 ring-blue-50 text-yellow-500">
                        <Trophy size={60} />
                    </div>
                </div> */}

                <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Complete the exercise!</h1>
                <p className="text-slate-500 mb-8 font-medium">You made a great effort today.</p>
                
                {/* Thẻ điểm số chính */}
                <div className="bg-white rounded-3xl p-8 mb-10 shadow-lg border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-indigo-600" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Results</p>
                            <div className="text-7xl font-black text-blue-600 italic">
                                {percentage}%
                            </div>
                        </div>
                        
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                                <div className="flex items-center gap-2 text-emerald-700 font-bold">
                                    <CheckCircle size={20} />
                                    <span>Correct</span>
                                </div>
                                <span className="text-2xl font-black text-emerald-600">{resultData.score}</span>
                            </div>

                            <div className="flex items-center justify-between bg-red-50 p-4 rounded-2xl border border-red-100">
                                <div className="flex items-center gap-2 text-red-700 font-bold">
                                    <XCircle size={20} />
                                    <span>Total</span>
                                </div>
                                <span className="text-2xl font-black text-slate-600">{resultData.total}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Danh sách các phần cần lưu ý (missedWords) */}
                {/* {resultData.missedWords && resultData.missedWords.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 text-left mb-10">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span className="w-2 h-6 bg-red-500 rounded-full" />
                           Sections to review
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {resultData.missedWords.map((word: string, index: number) => (
                                <span 
                                    key={index}
                                    className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-sm font-semibold border border-red-100"
                                >
                                    {word}
                                </span>
                            ))}
                        </div>
                    </div>
                )} */}

                {/* Nút điều hướng */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => router.push('/profile')}
                        className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-300 transition-all active:scale-95"
                    >
                        <Home size={20} />
                        Profile
                    </button>
                    <button
                        onClick={() => router.push('/roadmap')}
                        className="flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                    >
                        <RefreshCw size={20} />
                        Play again
                    </button>
                </div>
            </div>
        </main>
    );
}

export default function ResultsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Đang chuẩn bị kết quả...</div>}>
            <ResultsContent />
        </Suspense>
    );
}