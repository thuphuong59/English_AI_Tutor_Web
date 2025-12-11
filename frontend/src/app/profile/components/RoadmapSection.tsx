// File: RoadmapSection.tsx

"use client";
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation"; // Hook điều hướng
import { Loader2 } from "lucide-react"; // Import Loader2

// --- Khai báo Prop Interface ---
interface RoadmapSectionProps {
    userLevel: string; // ✅ Đã thêm prop userLevel
}

// TaskGroup component (Giữ nguyên)
const TaskGroup = ({ title, tasks, userProgress, onStart, taskType }: any) => {
    if (!tasks || tasks.length === 0) return null;
    return (
        <div className="pt-2">
            <h5 className="font-bold text-[10px] uppercase tracking-[0.15em] text-slate-400 mb-2.5">{title}</h5>
            <div className="space-y-2">
                {tasks.map((task: any) => {
                    const isCompleted = userProgress[task.lesson_id]?.completed || false;
                    return (
                        <div key={task.lesson_id} className="flex justify-between items-center p-3 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-blue-200 group">
                            <span className={`text-xs font-medium ${isCompleted ? 'text-slate-300 line-through' : 'text-slate-700'}`}>{task.title}</span>
                            {isCompleted ? (
                                <span className="text-emerald-500 text-[9px] font-black bg-emerald-50 px-2 py-0.5 rounded-md">DONE</span>
                            ) : (
                                <button 
                                    // TRUYỀN lessonId, title, và taskType VÀO onStart
                                    onClick={() => onStart(task.lesson_id, task.title, taskType)} 
                                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-[10px] font-black shadow-sm shadow-blue-200"
                                >
                                    START
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ✅ Cập nhật component để nhận userLevel
export function RoadmapSection({ userLevel }: RoadmapSectionProps) {
    const router = useRouter(); 
    const [roadmap, setRoadmap] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false); // Trạng thái AI tạo bài
    const [openStageIndex, setOpenStageIndex] = useState<number | null>(0);
    const [openWeekIndex, setOpenWeekIndex] = useState<{ [key: number]: number | null }>({ 0: 0 });

    useEffect(() => {
        async function loadRoadmap() {
            try {
                const userId = localStorage.getItem("authenticatedUserId");
                if (!userId) return;
                
                // Log: GET /assessment/{userId} (load roadmap)
                const res = await fetch(`http://localhost:8000/assessment/${userId}`); 
                
                // --- Xử lý lỗi Roadmap Not Found (Tùy chọn) ---
                if (!res.ok) {
                    // Nếu lỗi 404 (Không có Roadmap) hoặc lỗi khác
                    if (res.status === 404) {
                        setRoadmap({ roadmap: [], userProgress: {} });
                        return;
                    }
                    const errorData = await res.json();
                    throw new Error(errorData.detail || `Lỗi ${res.status} khi tải Roadmap.`);
                }
                
                const data = await res.json();
                const rawData = data.data?.roadmap || data.roadmap || {};
                const roadmapArray = (rawData.learning_phases || []).map((s: any) => ({
                    ...s, stage_number: s.phase_name, weeks: s.weeks || []
                }));
                setRoadmap({ roadmap: roadmapArray, userProgress: rawData.userProgress || {} });
            } catch (err) { 
                console.error(err); 
                toast.error("Không thể tải lộ trình.");
            } finally { 
                setIsLoading(false); 
            }
        }
        loadRoadmap();
    }, []);

    // ✅ Logic xử lý khi click START (Sử dụng userLevel từ props)
    const handleStartActivity = async (lessonId: string, topicTitle: string, taskType: string) => {
        const userId = localStorage.getItem("authenticatedUserId");
        const token = localStorage.getItem("access_token"); 
        
        if (!userId || !token) { 
            return toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        }

        const headers = { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` 
        };

        // 🚨 LOGIC CHUYỂN HƯỚNG SPEAKING
        if (taskType === 'speaking') {
            // ✅ SỬ DỤNG userLevel từ props
            const currentLevel = userLevel; 
            
            toast.success(`Chuyển sang luyện tập Nói Tự do với chủ đề: ${topicTitle}`);
            
            // Chuyển hướng đến trang Conversation với Level thực tế
            router.push(`/conversation?mode=free&level=${currentLevel}&topic=${encodeURIComponent(topicTitle)}`);
            return;
        }
        
        // --- LOGIC GRAMMAR (Nếu không phải speaking, tiếp tục xử lý) ---
        if (taskType === 'grammar') {
            const endpoint = `/api/quiz-grammar/start`;
            const loadingMsg = `Đang tạo bài kiểm tra Ngữ pháp: ${topicTitle}...`;
            
            setIsGenerating(true);
            const grammarLoadingId = toast.loading(loadingMsg);
            
            try {
                const response = await fetch(`http://localhost:8000${endpoint}`, {
                    method: "POST",
                    headers: headers,
                    body: JSON.stringify({ topic_name: topicTitle, lesson_id: lessonId })
                });
                const result = await response.json();
                
                if (response.ok) {
                    toast.success("Bài học đã sẵn sàng!", { id: grammarLoadingId });
                    router.push(`/quiz_grammar?sessionId=${result.id}`); 
                } else {
                    if (response.status === 403) {
                          toast.error("Bạn đã hoàn thành bài học này.", { id: grammarLoadingId });
                    } else {
                          toast.error(result.detail || `Lỗi ${response.status}: Tạo bài học thất bại.`, { id: grammarLoadingId });
                    }
                }
            } catch (err: any) {
                toast.error("Không thể kết nối API tạo bài học.", { id: grammarLoadingId });
            } finally {
                setIsGenerating(false);
            }
            return;
        }

        // --- LOGIC VOCABULARY (Giữ nguyên) ---
        if (taskType === 'vocabulary') {
            setIsGenerating(true);
            const loadingId = toast.loading(`AI is preparing your lesson: ${topicTitle}...`);

            try {
                 const response = await fetch(`http://localhost:8000/api/decks/start-topic`, {
                    method: "POST",
                    headers: headers,
                    body: JSON.stringify({ topic_name: topicTitle, lesson_id: lessonId })
                });

                const result = await response.json();

                if (response.ok) {
                    toast.success("Đã xong!", { id: loadingId });
                    router.push(`/vocabulary/${result.id}`); 
                } else {
                    if (response.status === 403) {
                          toast.error("Bạn đã hoàn thành bài học này.", { id: loadingId });
                    } else {
                        toast.error(result.detail || `Lỗi ${response.status}: Yêu cầu thất bại.`, { id: loadingId });
                    }
                }
            } catch (err: any) {
                toast.error("Không thể kết nối API.", { id: loadingId });
            } finally {
                setIsGenerating(false);
            }
            return;
        }
    };

    if (isLoading) return <div className="p-6">Đang tải lộ trình...</div>;
    if (!roadmap?.roadmap || roadmap.roadmap.length === 0) return null; // Hiển thị null nếu không có Roadmap

    return (
        <div className="relative w-full space-y-8">
            {/* Overlay loading khi AI làm việc */}
            {isGenerating && (
                <div className="fixed inset-0 bg-white/60 z-[9999] flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-blue-600 font-bold">Gemini AI is preparing the lesson....</p>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                {roadmap.roadmap.map((stage: any, sIdx: number) => (
                    <div key={sIdx} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="bg-blue-600 p-5 flex justify-between items-center cursor-pointer" onClick={() => setOpenStageIndex(openStageIndex === sIdx ? null : sIdx)}>
                            <h3 className="text-white font-bold text-sm">{stage.stage_number}</h3>
                            <div className="flex items-center gap-3 text-white">
                                <span className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded-md">{stage.duration_weeks} WEEK</span>
                                <span>{openStageIndex === sIdx ? "▲" : "▼"}</span>
                            </div>
                        </div>

                        {openStageIndex === sIdx && (
                            <div className="p-4 space-y-4 bg-slate-50/50">
                                {stage.weeks.map((week: any, wIdx: number) => (
                                    <div key={wIdx} className="bg-white rounded-2xl border border-slate-50 shadow-sm">
                                        <div className="p-4 flex justify-between items-center cursor-pointer" onClick={() => setOpenWeekIndex({...openWeekIndex, [sIdx]: openWeekIndex[sIdx] === wIdx ? null : wIdx})}>
                                            <div className="flex items-center gap-4">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${openWeekIndex[sIdx] === wIdx ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                                                    {week.week_number}
                                                </div>
                                                <span className="font-bold text-slate-700 text-xs">Week {week.week_number}</span>
                                            </div>
                                            <span className="text-slate-300 text-[10px] uppercase font-bold">{openWeekIndex[sIdx] === wIdx ? "Đóng" : "Mở"}</span>
                                        </div>

                                        {openWeekIndex[sIdx] === wIdx && (
                                            <div className="p-4 border-t space-y-6 animate-in duration-200">
                                                <TaskGroup title="Grammar focus" tasks={week.grammar.items} userProgress={roadmap.userProgress} onStart={handleStartActivity} taskType='grammar' />
                                                <TaskGroup title="Vocabulary" tasks={week.vocabulary.items} userProgress={roadmap.userProgress} onStart={handleStartActivity} taskType='vocabulary' />
                                                <TaskGroup title="Speaking skills" tasks={week.speaking.items} userProgress={roadmap.userProgress} onStart={handleStartActivity} taskType='speaking' />
                                                
                                                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-blue-700 text-[10px] font-semibold">
                                                    🎯 Mục tiêu: {week.expected_outcome}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}