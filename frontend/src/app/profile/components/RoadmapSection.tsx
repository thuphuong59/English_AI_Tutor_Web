// File: RoadmapSection.tsx

"use client";
import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

// --- Khai báo Prop Interface ---
interface RoadmapSectionProps {
    userLevel: string; // Level thực tế của người dùng
}

// Hàm tiện ích: Kiểm tra xem tất cả các items trong tuần đã hoàn thành chưa
const checkAllTasksCompleted = (week: any, userProgress: any) => {
    if (!week) return false;
    
    const allTasks = [
        ...(week.grammar?.items || []),
        ...(week.vocabulary?.items || []),
        ...(week.speaking?.items || []),
    ];

    if (allTasks.length === 0) return false;

    return allTasks.every((task: any) => 
        userProgress[task.lesson_id]?.completed === true
    );
};

// 🚨 Interface cho TaskGroup (Đã sửa lỗi TypeScript)
interface TaskGroupProps {
    title: string;
    tasks: any[];
    userProgress: any;
    // Định nghĩa rõ onStart chấp nhận 4 đối số và trả về Promise<void>
    onStart: (lessonId: string, topicTitle: string, taskType: string, isTitleClick: boolean) => Promise<void>; 
    taskType: string;
}

// TaskGroup component (ĐÃ SỬA LỖI TYPESCRIPT)
const TaskGroup = ({ title, tasks, userProgress, onStart, taskType }: TaskGroupProps) => {
    if (!tasks || tasks.length === 0) return null;
    return (
        <div className="pt-2">
            <h5 className="font-bold text-[10px] uppercase tracking-[0.15em] text-slate-400 mb-2.5">{title}</h5>
            <div className="space-y-2">
                {tasks.map((task: any) => {
                    const isCompleted = userProgress[task.lesson_id]?.completed || false;
                    const isTitleClickable = (taskType === 'vocabulary' || taskType === 'grammar') && !isCompleted;
                    
                    return (
                        <div key={task.lesson_id} className="flex justify-between items-center p-3 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-blue-200 group">
                            
                            {/* LOGIC CLICK TIÊU ĐỀ: TRUYỀN isTitleClick = true */}
                            <span 
                                onClick={() => {
                                    if (isTitleClickable) {
                                        onStart(task.lesson_id, task.title, taskType, true); 
                                    }
                                }}
                                className={`text-xs font-medium ${isCompleted ? 'text-slate-300 line-through' : 'text-slate-700'} 
                                    ${isTitleClickable ? 'cursor-pointer hover:text-blue-600' : ''}`}
                            >
                                {task.title}
                            </span>

                            {isCompleted ? (
                                // ✅ HIỂN THỊ FINISHED
                                <span className="text-emerald-500 text-[9px] font-black bg-emerald-50 px-2 py-0.5 rounded-md">FINISHED</span>
                            ) : (
                                // 🚨 Nút START: TRUYỀN isTitleClick = false
                                <button 
                                    onClick={() => onStart(task.lesson_id, task.title, taskType, false)} 
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

export function RoadmapSection({ userLevel }: RoadmapSectionProps) {
    const router = useRouter(); 
    const [roadmap, setRoadmap] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [openStageIndex, setOpenStageIndex] = useState<number | null>(0);
    const [openWeekIndex, setOpenWeekIndex] = useState<{ [key: number]: number | null }>({ 0: 0 });

    
    // 🚨 HÀM TỔNG HỢP & CẢI THIỆN LỘ TRÌNH (LLM Call)
    const reassessRoadmap = useCallback(async (currentProgress: any, completedWeek: any) => {
        const userId = localStorage.getItem("authenticatedUserId");
        const token = localStorage.getItem("access_token");
        if (!userId || !token) return;

        setIsGenerating(true);
        const loadingId = toast.loading(`Tuần ${completedWeek.week_number} đã hoàn thành! AI đang phân tích tiến độ để tối ưu hóa lộ trình tiếp theo...`);
        
        try {
            const assessmentResponse = await fetch(`http://localhost:8000/api/roadmap/weekly-assessment/${userId}`, {
                    method: "POST", 
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify({ completed_week_data: completedWeek, user_level: userLevel }) 
            });
            
            const assessmentData = await assessmentResponse.json();
            
            if (assessmentResponse.ok) {
                const newRoadmapData = assessmentData.new_roadmap;
                setRoadmap(newRoadmapData); 
                toast.success("Lộ trình đã được tối ưu hóa!", { id: loadingId });
                
                setOpenStageIndex(0);
                setOpenWeekIndex({ 0: 0 }); 
            } else {
                toast.error(assessmentData.detail || "Lỗi khi tối ưu hóa lộ trình.", { id: loadingId });
            }

        } catch (e) {
              toast.error("Không thể kết nối API tối ưu hóa lộ trình.", { id: loadingId });
        } finally {
            setIsGenerating(false);
        }
    }, [userLevel]);


    const loadRoadmap = useCallback(async () => {
        try {
            const userId = localStorage.getItem("authenticatedUserId");
            if (!userId) return;
            
            const res = await fetch(`http://localhost:8000/assessment/${userId}`); 
            
            if (!res.ok) {
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
                ...s, phase_name: s.phase_name, weeks: s.weeks || []
            }));
            
            const userProgressData = rawData.userProgress || rawData.user_progress || {};

            setRoadmap({ roadmap: roadmapArray, userProgress: userProgressData });

        } catch (err) { 
            console.error(err); 
            toast.error("Không thể tải lộ trình.");
        } finally { 
            setIsLoading(false); 
        }
    }, []);


    // 🚨 EFFECT CHÍNH: QUẢN LÝ TẢI VÀ KIỂM TRA HOÀN THÀNH TUẦN
    useEffect(() => {
        
        // 1. TẢI ROADMAP (Chỉ chạy một lần duy nhất khi chưa có dữ liệu)
        if (!roadmap && !isGenerating && isLoading) { 
           loadRoadmap(); 
           return; 
        }
        
        // 2. KIỂM TRA HOÀN THÀNH TUẦN
        if (roadmap?.roadmap && !isGenerating) {
            
            let weekToReassess = null;
            
            for (const stage of roadmap.roadmap) {
                for (const week of stage.weeks) {
                    const isCompleted = checkAllTasksCompleted(week, roadmap.userProgress);

                    if (isCompleted) {
                        const currentWeekIndex = stage.weeks.indexOf(week);
                        const nextWeekExists = !!stage.weeks[currentWeekIndex + 1];

                        // Nếu tuần này hoàn thành VÀ KHÔNG có tuần tiếp theo (cần AI tạo tuần mới)
                        if (!nextWeekExists) {
                            weekToReassess = week;
                            break; 
                        }
                    } else {
                        // Tìm thấy tuần đang học (chưa hoàn thành), dừng việc kiểm tra
                        break; 
                    }
                }
                if (weekToReassess) break; 
            }

            // Kích hoạt Reassessment
            if (weekToReassess) {
                 console.log(`[Reassessment Triggered] Week ${weekToReassess.week_number} completed. Reassessing.`);
                 reassessRoadmap(roadmap.userProgress, weekToReassess);
            }
        }
    }, [roadmap, loadRoadmap, reassessRoadmap, isGenerating, isLoading]);


    // ✅ Logic xử lý khi click START (Hoặc click Tiêu đề) - ĐÃ SỬA LỖI TYPESCRIPT
    const handleStartActivity = async (lessonId: string, topicTitle: string, taskType: string, isTitleClick: boolean = false): Promise<void> => {
        const userId = localStorage.getItem("authenticatedUserId");
        const token = localStorage.getItem("access_token"); 
        
        if (!userId || !token) { 
            toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
            return; // ✅ TRẢ VỀ VOID
        }

        const headers = { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` 
        };

        // 🚨 LOGIC CHUYỂN HƯỚNG SPEAKING (Free Talk)
        if (taskType === 'speaking') {
            const currentLevel = userLevel; 
            toast.success(`Chuyển sang luyện tập Nói Tự do với chủ đề: ${topicTitle}`);
            router.push(`/conversation?mode=free&level=${currentLevel}&topic=${encodeURIComponent(topicTitle)}`);
            return; // ✅ TRẢ VỀ VOID
        }
        
        // --- LOGIC GRAMMAR & VOCABULARY ---
        let endpoint: string;
        let loadingMsg: string;
        let successMsg: string;
        let failMsgType: string;

        if (taskType === 'grammar') {
            endpoint = `/api/quiz-grammar/start`;
            loadingMsg = `Đang tạo bài kiểm tra Ngữ pháp: ${topicTitle}...`;
            successMsg = "Bài học đã sẵn sàng!";
            failMsgType = "Tạo bài kiểm tra";
        } else if (taskType === 'vocabulary') {
            if (isTitleClick) {
                // CLICK TIÊU ĐỀ: Gọi API tạo Deck (công đoạn nặng)
                endpoint = `/api/decks/create-deck`;
                loadingMsg = `AI đang soạn và tạo bộ từ vựng: ${topicTitle}...`;
                successMsg = "Bộ từ vựng đã được tạo!";
                failMsgType = "Soạn bài học (Deck)";
            } else {
                // CLICK START: Gọi API tạo Quiz Session (công đoạn nhẹ, kiểm tra 404)
                endpoint = `/api/decks/start-quiz`;
                loadingMsg = `Đang chuẩn bị Quiz cho: ${topicTitle}...`;
                successMsg = "Bài Quiz đã sẵn sàng!";
                failMsgType = "Tạo Quiz";
            }
        } else {
            return; // ✅ TRẢ VỀ VOID
        }

        setIsGenerating(true);
        const loadingId = toast.loading(loadingMsg);
        
        try {
            const response = await fetch(`http://localhost:8000${endpoint}`, {
                method: "POST",
                headers: headers,
                body: JSON.stringify({ topic_name: topicTitle, lesson_id: lessonId }) 
            });
            const result = await response.json();
            
            if (response.ok) {
                toast.success(successMsg, { id: loadingId });
                
                // 🚨 CHUYỂN HƯỚNG SỬ DỤNG ID TRẢ VỀ VÀ TRUYỀN lessonId
                if (taskType === 'grammar') {
                    // Truyền lessonId cho Grammar nếu cần thiết
                    router.push(`/quiz_grammar?sessionId=${result.id}&lessonId=${lessonId}`); 
                } else if (taskType === 'vocabulary') {
                    const deckId = result.id; 
                    
                    if (isTitleClick) {
                         router.push(`/vocabulary/${deckId}`); 
                    } else {
                         // TRUYỀN lessonId qua URL params
                         router.push(`/practice/quiz/game?type=user&id=${deckId}&lessonId=${lessonId}`); 
                    }
                } 
            } else {
                if (response.status === 404 && taskType === 'vocabulary' && !isTitleClick) {
                    toast.error(`Bộ từ vựng chưa được tạo. Vui lòng click vào TIÊU ĐỀ task "${topicTitle}" để tạo Deck trước.`, { id: loadingId, duration: 6000 });
                } else if (response.status === 403) {
                     toast.error("Bạn đã hoàn thành bài học này.", { id: loadingId });
                } else {
                     toast.error(result.detail || `Lỗi ${response.status}: ${failMsgType} thất bại.`, { id: loadingId });
                }
            }
        } catch (err: any) {
            toast.error(`Không thể kết nối API để ${failMsgType.toLowerCase()}.`, { id: loadingId });
        } finally {
            setIsGenerating(false);
        }
    };

    if (isLoading) return <div className="p-6">Đang tải lộ trình...</div>;
    if (!roadmap?.roadmap || roadmap.roadmap.length === 0) return null;

    return (
        <div className="relative w-full space-y-8">
            {/* Overlay loading khi AI làm việc */}
            {isGenerating && (
                <div className="fixed inset-0 bg-white/60 z-[9999] flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-blue-600 font-bold">AI đang phân tích và tối ưu hóa lộ trình...</p>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                {roadmap.roadmap.map((stage: any, sIdx: number) => (
                    <div key={sIdx} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="bg-blue-600 p-5 flex justify-between items-center cursor-pointer" onClick={() => setOpenStageIndex(openStageIndex === sIdx ? null : sIdx)}>
                            <h3 className="text-white font-bold text-sm">{stage.phase_name}</h3>
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