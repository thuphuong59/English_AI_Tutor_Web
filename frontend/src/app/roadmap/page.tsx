// "use client";
// import React, { useState, useEffect } from "react";
// import Navbar from "../../components/Navbar";
// import toast from "react-hot-toast";

// // ====================================================================
// //                             INTERFACES ĐÃ SỬA CHỮA
// // ====================================================================

// interface SubTask {
//     lesson_id: string; // ID duy nhất cho task (dùng để check userProgress)
//     title: string;      // Tên hiển thị của task (vd: "Present Simple")
// }

// interface ActivityContainer {
//     title: string;
//     lesson_id: string; // ID của nhóm task (vd: "grammar_w1")
//     items: SubTask[];
// }

// interface WeeklyPlan {
//     week_number: number;
//     // Các trường này hiện là OBJECT chứa title và items (sub-tasks)
//     grammar: ActivityContainer; 
//     vocabulary: ActivityContainer;
//     speaking: ActivityContainer;
//     expected_outcome: string;
// }

// interface Milestone {
//     milestone_name: string;
//     target_score_goal: string;
//     milestone_requirements: string[];
// }

// interface Stage {
//     phase_name: string;
//     duration_weeks: number;
//     weeks: WeeklyPlan[];

//     stage_number?: string;
//     duration?: string;
//     focus?: string;
//     milestone?: Milestone;
//     expected_outcomes?: string;
// }

// interface DiagnosticSummary {
//     estimated_level?: string;
//     weak_topics?: string[];
//     score_percent?: number;
//     correct_count?: number;
//     total_questions?: number;
// }

// interface UserProgress {
//     [activityId: string]: {
//         completed: boolean;
//         score?: number;
//     };
// }

// interface RoadmapDetails {
//     roadmap?: Stage[];
//     level?: string;
//     diagnostic_summary?: DiagnosticSummary;
//     summary?: string;
//     user_summary?: string;
//     current_status?: string;
//     userProgress?: UserProgress;
// }

// // ====================================================================
// //                             HELPER COMPONENT: TASK GROUP
// // ====================================================================

// interface TaskGroupProps {
//     title: string;
//     tasks: SubTask[] | undefined;
//     userProgress: UserProgress;
//     onStart: (taskId: string, description: string) => void;
// }

// const TaskGroup: React.FC<TaskGroupProps> = ({ title, tasks, userProgress, onStart }) => {
//     if (!tasks || tasks.length === 0) return null;

//     return (
//         <div className="border-t pt-3">
//             <h5 className="font-semibold text-base mb-2 text-gray-700">{title}</h5>
//             <div className="space-y-2">
//                 {tasks.map((task) => {
//                     // Dùng task.lesson_id làm ID duy nhất để check tiến độ
//                     const progress = userProgress[task.lesson_id]; 
//                     const isCompleted = progress?.completed || false;
//                     const score = progress?.score;

//                     return (
//                         <div key={task.lesson_id} className="flex justify-between items-center p-2 bg-white rounded shadow-sm">
//                             <span className={`text-sm ${isCompleted ? 'text-green-700 line-through' : 'text-gray-800'}`}>
//                                 {task.title} {/* Hiển thị title của task */}
//                             </span>
//                             {isCompleted ? (
//                                 <span className="text-green-600 font-bold text-xs">
//                                     ✅ Xong {score !== undefined && `(${score}%)`}
//                                 </span>
//                             ) : (
//                                 <button
//                                     onClick={() => onStart(task.lesson_id, task.title)} // Truyền lesson_id và title
//                                     className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium text-xs"
//                                 >
//                                     Bắt đầu
//                                 </button>
//                             )}
//                         </div>
//                     );
//                 })}
//             </div>
//         </div>
//     );
// };


// // ====================================================================
// //                             COMPONENT CHÍNH: ROADMAP PAGE
// // ====================================================================

// export default function RoadmapPage() {
//     const [roadmap, setRoadmap] = useState<RoadmapDetails | null>(null);
//     const [rawJson, setRawJson] = useState<any>(null);
//     const [isLoading, setIsLoading] = useState(true);
//     const [showJson, setShowJson] = useState(false);

//     const [openStageIndex, setOpenStageIndex] = useState<number | null>(null);
//     const [openWeekIndex, setOpenWeekIndex] = useState<{ [stageIdx: number]: number | null }>({});

//     useEffect(() => {
//         async function loadRoadmap() {
//             setIsLoading(true);
//             try {
//                 const userId = localStorage.getItem("authenticatedUserId");
//                 if (!userId) {
//                     toast.error("Không tìm thấy userId. Vui lòng đăng nhập lại.");
//                     setIsLoading(false);
//                     return;
//                 }

//                 const res = await fetch(`http://localhost:8000/assessment/${userId}`);
//                 if (!res.ok) throw new Error("Không thể kết nối server");

//                 const data = await res.json();
//                 setRawJson(data);

//                 // Dữ liệu từ backend đã được normalize (chứa object ActivityContainer)
//                 const rawRoadmapData = data.data?.roadmap || data.roadmap || {};
//                 const levelAssessed = data.data?.level || data.level || "Chưa xác định";                if (data.status !== "success" || !rawRoadmapData || !rawRoadmapData.learning_phases) {
//                     toast.error("Không tìm thấy lộ trình học tập.");
//                     setIsLoading(false);
//                     return;
//                 }

//                 const phases = rawRoadmapData.learning_phases || [];

//                 // --- LOGIC CHUYỂN ĐỔI VÀ TỔNG HỢP FOCUS ĐÃ SỬA ---
//                 const roadmapArray: Stage[] = phases.map((s: any, index: number): Stage => {
                    
//                     const phaseWeeks: WeeklyPlan[] = s.weeks.map((w: any) => {
//                         // Thiết lập các giá trị fallback an toàn (dù backend đã normalize, ta vẫn phòng thủ)
//                         const grammarData = w.grammar || { title: 'Chủ đề Ngữ pháp', lesson_id: '', items: [] };
//                         const vocabData = w.vocabulary || { title: 'Chủ đề Từ vựng', lesson_id: '', items: [] };
//                         const speakingData = w.speaking || { title: 'Chủ đề Luyện nói', lesson_id: '', items: [] };
                        
//                         return {
//                             week_number: w.week_number,
//                             grammar: grammarData,
//                             vocabulary: vocabData,
//                             speaking: speakingData,
//                             expected_outcome: w.expected_outcome,
//                         };
//                     });

//                     // Logic tổng hợp focus: Chỉ lấy tiêu đề nếu nó không phải là fallback
//                     const fallbackGrammar = 'Chủ đề Ngữ pháp';
//                     const fallbackVocabulary = 'Chủ đề Từ vựng';

//                     const allGrammarTitles = phaseWeeks
//                         .map(w => w.grammar.title)
//                         .filter(t => t && t !== fallbackGrammar);
//                     const allVocabularyTitles = phaseWeeks
//                         .map(w => w.vocabulary.title)
//                         .filter(t => t && t !== fallbackVocabulary);
                    
//                     const focusPoints: string[] = [];
                    
//                     // Xử lý Ngữ pháp
//                     if (allGrammarTitles.length > 0) {
//                         focusPoints.push(`Ngữ pháp trọng tâm: ${allGrammarTitles.join(" • ")}`);
//                     } else {
//                         focusPoints.push(`Ngữ pháp trọng tâm: Chưa xác định`);
//                     }

//                     // Xử lý Từ vựng
//                     if (allVocabularyTitles.length > 0) {
//                         focusPoints.push(`Từ vựng trọng tâm: ${allVocabularyTitles.join(" • ")}`);
//                     } else {
//                         focusPoints.push(`Từ vựng trọng tâm: Chưa xác định`);
//                     }

//                     return {
//                         phase_name: s.phase_name,
//                         duration_weeks: s.duration_weeks,
//                         weeks: phaseWeeks,
//                         stage_number: s.phase_name,
//                         duration: `${s.duration_weeks} tuần`,
//                         focus: focusPoints.join("; ") || "Cải thiện toàn diện",
//                         milestone: s.milestone,
//                         expected_outcomes: s.expected_outcomes,
//                     };
//                 });

//                 // Mở Giai đoạn 1 và Tuần 1 theo mặc định
//                 if (roadmapArray.length > 0) {
//                     setOpenStageIndex(0);
//                     setOpenWeekIndex({ 0: 0 }); 
//                 }

//                 setRoadmap({
//                     roadmap: roadmapArray,
//                     level: levelAssessed,
//                     diagnostic_summary: rawRoadmapData.diagnostic_summary || {},
//                     summary: rawRoadmapData.summary || "Lộ trình đang được xây dựng...",
//                     user_summary: rawRoadmapData.user_summary || rawRoadmapData.summary,
//                     current_status: rawRoadmapData.current_status || "Chưa bắt đầu",
//                     userProgress: rawRoadmapData.userProgress || {},
//                 });
//             } catch (err) {
//                 console.error("Lỗi tải roadmap:", err);
//                 toast.error("Lỗi kết nối server. Vui lòng thử lại sau.");
//             } finally {
//                 setIsLoading(false);
//             }
//         }
//         loadRoadmap();
//     }, []);

//     // --- HÀM XỬ LÝ ACCORDION ---
//     const toggleStage = (idx: number) => {
//         setOpenStageIndex(openStageIndex === idx ? null : idx);
//         setOpenWeekIndex({});
//     };

//     const toggleWeek = (stageIdx: number, weekIdx: number) => {
//         setOpenWeekIndex(prev => ({ 
//             ...prev, 
//             [stageIdx]: prev[stageIdx] === weekIdx ? null : weekIdx 
//         }));
//     };
    
//     // --- HÀM XỬ LÝ HÀNH ĐỘNG ---
//     const handleStartActivity = (taskId: string, description: string) => {
//         toast.success(`Bắt đầu nhiệm vụ: ${description}`);
//         console.log("Start activity, Task ID:", taskId);
//         // Logic điều hướng tới trang học/quiz/voice sẽ được đặt ở đây
//     };


//     if (isLoading) {
//         return (
//             <main className="min-h-screen flex items-center justify-center bg-gray-50">
//                 <div className="text-xl">Đang tải lộ trình học tập của bạn...</div>
//             </main>
//         );
//     }

//     if (!roadmap || !roadmap.roadmap || roadmap.roadmap.length === 0) {
//         return (
//             <main className="min-h-screen p-6 bg-gray-50">
//                 <Navbar />
//                 <div className="max-w-4xl mx-auto text-center mt-10">
//                     <h2 className="text-3xl font-bold text-red-600 mb-4">Không tìm thấy lộ trình học tập</h2>
//                     <p className="text-gray-600 mb-6">Có thể bạn chưa làm bài kiểm tra đầu vào hoặc dữ liệu bị lỗi.</p>
//                     <button onClick={() => setShowJson(true)} className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800">
//                         Xem dữ liệu thô (Raw JSON)
//                     </button>
//                 </div>
//             </main>
//         );
//     }

//     const { roadmap: stages, diagnostic_summary, userProgress = {} } = roadmap;

//     // --- RENDER COMPONENT ---
//     return (
//         <main className="min-h-screen bg-gray-50">
//             <Navbar />

//             {showJson && rawJson && (
//                 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//                     <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-auto p-6">
//                         <h3 className="text-xl font-bold mb-4">Raw JSON từ Server</h3>
//                         <pre className="text-xs bg-gray-100 p-4 rounded overflow-x-auto">{JSON.stringify(rawJson, null, 2)}</pre>
//                         <button onClick={() => setShowJson(false)} className="mt-4 px-5 py-2 bg-red-600 text-white rounded hover:bg-red-700">
//                             Đóng
//                         </button>
//                     </div>
//                 </div>
//             )}

//             <div className="container mx-auto p-6 mt-8 max-w-5xl">
//                 <header className="text-center mb-10">
//                     <h1 className="text-4xl font-extrabold text-emerald-700">Lộ Trình Học Tập Cá Nhân Hóa</h1>
//                     <p className="text-xl text-gray-700 mt-3">
//                         Trình độ hiện tại:{" "}
//                         <span className="font-bold text-emerald-600 text-2xl">{roadmap.level || "Chưa xác định"}</span>
//                     </p>
//                 </header>

//                 {/* Diagnostic Summary (Giữ nguyên) */}
//                 <section className="bg-white p-8 rounded-2xl shadow-lg border-l-8 border-emerald-500 mb-10">
//                     <h2 className="text-2xl font-bold text-gray-800 mb-4">Nhận xét từ bài kiểm tra</h2>
//                     {roadmap.user_summary && <p className="text-gray-700 mb-3 leading-relaxed"><strong className="text-emerald-700">Tóm tắt:</strong> {roadmap.user_summary}</p>}
//                     {roadmap.current_status && <p className="text-gray-700 mb-3"><strong className="text-emerald-700">Trạng thái:</strong> {roadmap.current_status}</p>}
//                     <p className="text-gray-700 mb-3"><strong className="text-emerald-700">Điểm yếu:</strong> {diagnostic_summary?.weak_topics?.length ? diagnostic_summary.weak_topics.join(" • ") : "Không xác định"}</p>
//                     <p className="text-lg font-semibold text-emerald-600">
//                         Kết quả: {diagnostic_summary?.correct_count ?? 0}/{diagnostic_summary?.total_questions ?? 0} câu đúng → {(diagnostic_summary?.score_percent ?? 0).toFixed(0)}%
//                     </p>
//                 </section>

//                 <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Các Giai Đoạn Học Tập</h2>

//                 <div className="space-y-6">
//                     {stages.map((stage, sIdx) => {
//                         const isStageOpen = openStageIndex === sIdx;
//                         const weeksDetail = stage.weeks || [];

//                         return (
//                             <div key={`stage-${sIdx}`} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
//                                 {/* HEADER GIAI ĐOẠN */}
//                                 <div className="bg-emerald-600 text-white p-5 flex justify-between items-center cursor-pointer" onClick={() => toggleStage(sIdx)}>
//                                     <h3 className="text-2xl font-bold">{stage.stage_number}</h3>
//                                     <span className="text-lg font-medium">{stage.duration || `${stage.duration_weeks} tuần`}</span>
//                                 </div>

//                                 {/* NỘI DUNG GIAI ĐOẠN */}
//                                 {isStageOpen && (
//                                     <div className="p-6 space-y-4">
//                                         {/* HIỂN THỊ TRỌNG TÂM GIAI ĐOẠN (Đã sửa lỗi hiển thị)
//                                         <h4 className="font-bold text-lg text-emerald-700 mb-2">{stage.focus}</h4> 
//                                         <hr/> */}
                                        
//                                         {/* MAP QUA CÁC TUẦN */}
//                                         {weeksDetail.map((week, wIdx) => {
//                                             const isWeekOpen = openWeekIndex[sIdx] === wIdx;
                                            
//                                             // Helper function to check if any required task in a group is complete
//                                             const isAnyTaskComplete = (tasks: SubTask[] | undefined) => {
//                                                 return tasks?.some(t => userProgress[t.lesson_id]?.completed) || false; 
//                                             };
                                            
//                                             // Xác định trạng thái chung của tuần
//                                             const weekStatusClass = isAnyTaskComplete(week.grammar.items) || isAnyTaskComplete(week.vocabulary.items) || isAnyTaskComplete(week.speaking.items) 
//                                                 ? 'border-l-4 border-green-500' : 'border-l-4 border-gray-300';


//                                             return (
//                                                 <div key={`week-${sIdx}-${wIdx}`} className={`border rounded-lg ${weekStatusClass}`}>
//                                                     {/* HEADER TUẦN - Đảm bảo hiển thị Title */}
//                                                     <div className="bg-gray-100 p-3 cursor-pointer flex justify-between items-center" onClick={() => toggleWeek(sIdx, wIdx)}>
//                                                         <span className="font-semibold text-gray-800">
//                                                             Tuần {week.week_number}
//                                                         </span>
//                                                         <span className="text-sm text-gray-600">{isWeekOpen ? "▲" : "▼"}</span>
//                                                     </div>

//                                                     {/* NỘI DUNG TUẦN (TASK CHI TIẾT) */}
//                                                     {isWeekOpen && (
//                                                         <div className="p-4 bg-gray-50 space-y-3">
                                                            
//                                                             {/* --- HIỂN THỊ CÁC SUB-TASK CHI TIẾT --- */}
//                                                             <TaskGroup 
//                                                                 title={`1. Ngữ pháp: ${week.grammar.title} (Quiz)`} 
//                                                                 tasks={week.grammar.items} 
//                                                                 userProgress={userProgress} 
//                                                                 onStart={handleStartActivity} 
//                                                             />
//                                                             <TaskGroup 
//                                                                 title={`2. Từ vựng: ${week.vocabulary.title} (Challenge)`} 
//                                                                 tasks={week.vocabulary.items} 
//                                                                 userProgress={userProgress} 
//                                                                 onStart={handleStartActivity} 
//                                                             />
//                                                             <TaskGroup 
//                                                                 title={`3. Luyện nói: ${week.speaking.title} (Voice Chat)`} 
//                                                                 tasks={week.speaking.items} 
//                                                                 userProgress={userProgress} 
//                                                                 onStart={handleStartActivity} 
//                                                             />
                                                            
//                                                             <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
//                                                                 <strong className="text-blue-700">Kết quả mong đợi:</strong> 
//                                                                 <span className="text-blue-800 ml-2">{week.expected_outcome}</span>
//                                                             </div>
                                                            
//                                                         </div>
//                                                     )}
//                                                 </div>
//                                             );
//                                         })}
                                        
//                                         {/* Milestone cuối giai đoạn (Giữ nguyên) */}
//                                         {stage.milestone && (
//                                             <div className="mt-6 p-5 bg-amber-50 rounded-xl border border-amber-200">
//                                                 <h4 className="font-bold text-xl text-amber-800 mb-2">Mốc quan trọng: {stage.milestone.milestone_name}</h4>
//                                                 <ul className="list-disc pl-5 text-amber-900">
//                                                     {stage.milestone.milestone_requirements.map((req, i) => (<li key={i}>{req}</li>))}
//                                                 </ul>
//                                             </div>
//                                         )}

//                                     </div>
//                                 )}
//                             </div>
//                         );
//                     })}
//                 </div>

//                 {/* RAW JSON Button (Giữ nguyên) */}
//                 {rawJson && (
//                     <div className="text-center mt-10 pb-10">
//                         <button onClick={() => setShowJson(true)} className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition">
//                             🛠️ Xem Raw JSON Data
//                         </button>
//                     </div>
//                 )}
//             </div>
//         </main>
//     );
// }