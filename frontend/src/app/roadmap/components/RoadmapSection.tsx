// // frontend/src/app/roadmap/components/RoadmapSection.tsx

// import React from 'react';

// // Định nghĩa lại các interfaces (ĐÃ ĐỒNG BỘ VÀ THÊM CÁC TRƯỜNG BIẾN THỂ)
// interface DailyActivity {
//     time_allocation?: string;
//     activity?: string;
//     purpose?: string; 
//     resources?: string[];
//     time_estimate?: string;
//     details?: string;
//     materials_suggestions?: string;
// }
// interface Milestone {
//     milestone_name?: string;
//     target_score_goal?: string;
//     milestone_requirements?: string[];
// }

// // 🚨 FIX: THÊM phase_name VÀO LEARNINGPHASE 🚨
// interface LearningPhase {
//     stage_number?: string; // Trường cũ
//     phase_name?: string; // 👈 FIX: Trường LLM tạo ra (Cần thiết cho lỗi này)
//     duration?: string;
//     focus?: string;
//     focus_points?: string[];
//     daily_activities?: DailyActivity[];
//     expected_outcomes?: string;
//     milestone?: Milestone;
    
//     // Các trường biến thể cần được truy cập an toàn:
//     duration_estimate?: string; 
//     grammar_focus?: string[]; 
//     speaking_practice?: string[];
//     reflex_building?: string;
// }

// interface RoadmapSectionProps {
//     phase: LearningPhase;
//     index: number;
// }

// export default function RoadmapSection({ phase, index }: RoadmapSectionProps) {
    
//     // Lấy các trường LLM tạo ra, dùng giá trị mặc định nếu thiếu
//     // 🚨 FIX: Sử dụng phase_name hoặc stage_number (tên cũ) 🚨
//     const title = phase.phase_name || phase.stage_number || `Giai đoạn ${index + 1}`;
    
//     const durationText = phase.duration || phase.duration_estimate || 'Chưa xác định';
//     // Lấy focus_points (mảng) hoặc focus (chuỗi)
//     const focusText = (phase.focus_points && phase.focus_points.join(', ')) || phase.focus || 'Chưa có trọng tâm';

//     // Đảm bảo dữ liệu chi tiết là mảng trước khi map
//     const dailyActivities = phase.daily_activities || [];
//     const grammarPoints = phase.grammar_focus || [];
//     const speakingPoints = phase.speaking_practice || [];
//     const milestone = phase.milestone || {};


//     return (
//         // Timeline Item
//         <div className="relative px-6 md:px-12">
//             {/* Dot/Timeline Marker */}
//             <div className="absolute w-6 h-6 rounded-full bg-emerald-500 border-4 border-white transform -translate-x-1/2 left-0 md:left-0 top-0 flex items-center justify-center text-white font-bold shadow-md">
//                 {index + 1}
//             </div>

//             {/* Content Card */}
//             <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-300 transform translate-x-4 md:translate-x-0">
                
//                 {/* Tên Giai đoạn */}
//                 <h3 className="text-xl font-extrabold text-emerald-600 mb-2">
//                     {index + 1}. {title} <span className="text-sm text-gray-500 font-medium">({durationText})</span>
//                 </h3>
//                 <p className="text-gray-700 mb-4">{focusText}</p>

//                 {/* A. Kế hoạch Hàng ngày (Daily Breakdown) */}
//                 <div className="mb-6 border-t pt-4">
//                     <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
//                         <span className='mr-2 text-yellow-600'>⏳</span> Phân bổ Hàng ngày:
//                     </h4>
//                     {dailyActivities.length > 0 ? (
//                         dailyActivities.map((item: DailyActivity, i: number) => (
//                             <div key={i} className="pl-3 py-1 text-sm border-l-2 border-dashed border-gray-300">
//                                 <p className="font-semibold text-gray-800">
//                                     {/* Truy cập các trường an toàn */}
//                                     {item.time_allocation || item.time_estimate || 'N/A'}: <span className="font-normal">{item.activity || 'N/A'}</span>
//                                 </p>
//                                 {/* Hiển thị chi tiết (details/purpose) */}
//                                 {item.details || item.purpose ? (
//                                     <p className="text-xs text-gray-600 italic mt-0.5">Mục đích: {item.details || item.purpose}</p>
//                                 ) : null}
//                             </div>
//                         ))
//                     ) : (
//                          <p className="text-sm text-gray-500">Không có phân bổ hoạt động chi tiết.</p>
//                     )}
//                 </div>
                
//                 {/* B. Ngữ pháp Trọng tâm */}
//                 <div className="mb-6">
//                     <h4 className="text-lg font-bold text-gray-800 mb-2">
//                         <span className='mr-2 text-blue-500'>📚</span> Ngữ pháp/Từ vựng Trọng tâm:
//                     </h4>
//                     <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 text-sm">
//                         {grammarPoints.length > 0 ? (
//                             grammarPoints.map((point: string, i: number) => (<li key={i}>{point}</li>))
//                         ) : (
//                             <li>Củng cố ngữ pháp/từ vựng cơ bản.</li>
//                         )}
//                     </ul>
//                 </div>

//                 {/* C. Luyện nói và Phản xạ */}
//                 <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
//                     <h4 className="text-lg font-bold text-blue-800 mb-2">
//                         🎙️ Luyện nói & Phản xạ:
//                     </h4>
//                     <ul className="list-none space-y-1 text-gray-700">
//                         {speakingPoints.length > 0 ? (
//                             speakingPoints.map((req: string, i: number) => (
//                                 <li key={i} className="flex items-start">
//                                     <span className="text-blue-500 mr-2 mt-1">✓</span>
//                                     <span className='flex-1'>{req}</span>
//                                 </li>
//                             ))
//                         ) : (
//                              <li>Chưa có bài luyện nói cụ thể.</li>
//                         )}
//                     </ul>
//                 </div>

//                 {/* Khối Milestone (Cột mốc) */}
//                 {milestone.milestone_name && (
//                     <div className="mt-4 p-4 bg-emerald-50 border-2 border-emerald-300 rounded-lg">
//                         <h4 className="text-xl font-bold text-emerald-800 mb-2">
//                             ✅ Cột Mốc: {milestone.milestone_name}
//                         </h4>
//                         <p className="text-sm font-bold text-gray-600 mb-3">
//                             Mục tiêu: {milestone.target_score_goal}
//                         </p>
                        
//                         <h5 className="text-md font-bold text-emerald-700 mb-1">Yêu cầu:</h5>
//                         <ul className="list-none space-y-1 text-gray-700 ml-4">
//                             {milestone.milestone_requirements?.map((req: string, i: number) => (
//                                 <li key={i} className="flex items-start">
//                                     <span className="text-emerald-500 mr-2 mt-1">✓</span>
//                                     <span className='flex-1'>{req}</span>
//                                 </li>
//                             ))}
//                         </ul>
//                     </div>
//                 )}


//                 {/* Kết quả mong đợi */}
//                 <p className="mt-4 text-gray-700 text-sm">
//                     <strong>Phản xạ:</strong> {phase.reflex_building || "Không có dữ liệu"}
//                 </p>
//                 <p className="mt-2 text-gray-700 text-sm">
//                     <strong>Kết quả kỳ vọng:</strong> {phase.expected_outcomes || "Không có dữ liệu"}
//                 </p>
//             </div>
//         </div>
//     );
// }