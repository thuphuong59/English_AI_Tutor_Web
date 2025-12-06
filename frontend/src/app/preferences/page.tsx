"use client";
import { useState } from "react";
import toast from "react-hot-toast";

import LoadingModal from "../../components/ui/LoadingModal"; 

// 🚨 ĐÃ CẬP NHẬT URL CHÍNH XÁC DỰA TRÊN KẾT QUẢ TEST TRƯỚC ĐÓ 🚨
const BACKEND_API_URL = 'http://127.0.0.1:8000/quiz/test'; 

// Dữ liệu lựa chọn
const communicationGoalOptions = [
    "Công việc, Phỏng vấn",
    "Du lịch, Văn hóa",
    "Xã giao hàng ngày",
    "Khác",
];

const durationOptions = [
    { item: "1 tháng", icon: "⚡" },
    { item: "2–3 tháng", icon: "📅" },
    { item: "6 tháng", icon: "🗓️" },
    { item: "Lâu dài / Không xác định", icon: "♾️" },
    { item: "Khác", icon: "✍️" }, 
];

const confidenceBarrierOptions = [
    { item: "Phản xạ chậm", icon: "🐢" },
    { item: "Phát âm không chuẩn", icon: "🗣️" },
    { item: "Thiếu từ vựng", icon: "📚" },
    { item: "Sai ngữ pháp cơ bản", icon: "📐" },
    { item: "Khác", icon: "✏️" },
];

const dailyTimeOptions = [
    { item: "15 phút", icon: "🏃" },
    { item: "30 phút", icon: "📖" },
    { item: "1 giờ", icon: "🧠" },
    { item: "Hơn 1 giờ", icon: "🔥" },
    { item: "Khác", icon: "✍️" }, 
];

export default function PreferencesPage() {
    // --- STATES ---
    const [step, setStep] = useState(1);
    
    // B1: Goal
    const [goal, setGoal] = useState(""); 
    const [customGoal, setCustomGoal] = useState("");
    
    // B2: Duration
    const [duration, setDuration] = useState("");
    const [customDuration, setCustomDuration] = useState("");

    // B3: Barrier
    const [barrier, setBarrier] = useState("");
    const [customBarrier, setCustomBarrier] = useState("");

    // B4: Daily Time
    const [dailyTime, setDailyTime] = useState("");
    const [customDailyTime, setCustomDailyTime] = useState("");
    
    const [fade, setFade] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false); 

    // --- LOGIC FUNCTIONS ---
    
    const handleSubmit = async () => {
        
        // 1. Xử lý DỮ LIỆU CUỐI CÙNG
        const finalGoal = goal === "Khác" ? customGoal : goal;
        const finalDuration = duration === "Khác" ? customDuration : duration;
        const finalBarrier = barrier === "Khác" ? customBarrier : barrier;
        const finalDailyTime = dailyTime === "Khác" ? customDailyTime : dailyTime;

        // --- VALIDATION CUỐI CÙNG ---
        if (!finalGoal) { toast.error("Vui lòng chọn mục tiêu giao tiếp!"); return; }
        if (!finalDuration) { toast.error("Vui lòng chọn thời gian mục tiêu!"); return; }
        if (!finalBarrier) { toast.error("Vui lòng chọn yếu tố thiếu tự tin!"); return; }
        if (!finalDailyTime) { toast.error("Vui lòng chọn thời gian học mỗi ngày!"); return; }

        // --- DỮ LIỆU GỬI ĐI (Khớp với PreferenceData Schema 4 trường) ---
        const userData = {
            communication_goal: finalGoal,
            target_duration: finalDuration,
            confidence_barrier: finalBarrier,
            daily_commitment: finalDailyTime,
        };

        // Bắt đầu gửi API và Loading
        setIsSubmitting(true);
        
        try {
            toast.loading("Đang tạo câu hỏi chẩn đoán...", { id: 'loading-quiz', duration: 10000 }); 

            const response = await fetch(BACKEND_API_URL, { // 🚨 SỬ DỤNG URL MỚI ĐÃ SỬA
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });

            toast.dismiss('loading-quiz');

            if (!response.ok) {
                const errorData = await response.json(); 
                throw new Error(errorData.detail || 'Lỗi không xác định từ Server.');
            }

            const quizData = await response.json();
            localStorage.setItem("userQuizData", JSON.stringify(quizData)); 
            
            toast.success("Đã tạo bài test chẩn đoán thành công!");

            setTimeout(() => {
                window.location.href = "/test/quiz";
            }, 800);

        } catch (error) {
            console.error("Lỗi gửi dữ liệu hoặc xử lý API:", error);

            let errorMessage = 'Không thể kết nối Backend.';
            if (error instanceof Error) { errorMessage = error.message; } else if (typeof error === 'string') { errorMessage = error; }
            
            toast.dismiss('loading-quiz');
            toast.error(`Lỗi: ${errorMessage}`);

        } finally {
            setIsSubmitting(false); // Kết thúc quá trình submit
        }
    };
    
    // --- STEP CONTENT DEFINITION (4 BƯỚC) ---
    const stepsContent = [
        // BƯỚC 1: MỤC TIÊU GIAO TIẾP
        {
            title: "1. Bạn muốn tự tin giao tiếp trong hoàn cảnh nào nhất?",
            content: (
                <div className="flex flex-col gap-3">
                    {communicationGoalOptions.map((item) => (
                        <div
                            key={item}
                            className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 shadow-sm flex items-center space-x-4 
                                ${goal === item ? "bg-emerald-100 border-emerald-600 ring-4 ring-emerald-200" : "bg-white border-gray-300 hover:border-emerald-600"}
                            `}
                            onClick={() => setGoal(item)}
                        >
                            <span className="text-xl">🗣️</span>
                            <span className="font-medium text-lg text-gray-800">{item}</span>
                        </div>
                    ))}
                    
                    {goal === "Khác" && (
                        <div className="mt-2">
                            <input
                                type="text"
                                placeholder="Nhập mục tiêu cụ thể..."
                                className="p-3 border-2 border-dashed border-gray-400 rounded-lg shadow-sm w-full focus:ring-emerald-500 focus:border-emerald-500 transition duration-150 text-lg font-medium"
                                value={customGoal}
                                onChange={(e) => setCustomGoal(e.target.value)}
                                autoFocus
                            />
                        </div>
                    )}
                </div>
            ),
        },
        // BƯỚC 2: MỤC TIÊU THỜI GIAN
        {
            title: "2. Bạn muốn đạt mục tiêu đó trong bao lâu?", 
            content: (
                <div className="flex flex-col gap-3">
                    {durationOptions.map(({ item, icon }) => (
                        <div
                            key={item}
                            className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 shadow-sm flex items-center space-x-4 
                                ${duration === item ? "bg-emerald-100 border-emerald-600 ring-4 ring-emerald-200" : "bg-white border-gray-300 hover:border-emerald-600"}
                            `}
                            onClick={() => setDuration(item)}
                        >
                            <span className="text-xl">{icon}</span>
                            <span className="font-medium text-lg text-gray-800">{item}</span>
                        </div>
                    ))}
                    
                    {duration === "Khác" && (
                        <div className="mt-2">
                            <input
                                type="text"
                                placeholder="Nhập thời gian cụ thể (ví dụ: 4 tháng)"
                                className="p-3 border-2 border-dashed border-gray-400 rounded-lg shadow-sm w-full focus:ring-emerald-500 focus:border-emerald-500 transition duration-150 text-lg font-medium"
                                value={customDuration}
                                onChange={(e) => setCustomDuration(e.target.value)}
                                autoFocus
                            />
                        </div>
                    )}
                </div>
            ),
        },
        // BƯỚC 3: YẾU TỐ THIẾU TỰ TIN NHẤT
        {
            title: "3. Yếu tố nào làm bạn thiếu tự tin nhất khi nói?", 
            content: (
                <div className="grid grid-cols-2 gap-4">
                    {confidenceBarrierOptions.map(({ item, icon }) => (
                        <div
                            key={item}
                            className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 shadow-sm flex flex-col items-center justify-center text-center 
                                ${barrier === item ? "bg-emerald-100 border-emerald-600 ring-4 ring-emerald-200" : "bg-white border-gray-300 hover:border-emerald-600 hover:scale-[1.01]"}
                            `}
                            onClick={() => setBarrier(item)}
                        >
                            <span className="text-3xl mb-1">{icon}</span>
                            <p className="font-semibold text-lg text-gray-800">{item}</p>
                        </div>
                    ))}
                    
                    {barrier === "Khác" && (
                        <div className="col-span-2 mt-2">
                            <input
                                type="text"
                                placeholder="Nhập yếu tố cụ thể (ví dụ: Thiếu tự nhiên)"
                                className="p-3 border-2 border-dashed border-gray-400 rounded-lg shadow-sm w-full focus:ring-emerald-500 focus:border-emerald-500 transition duration-150 text-lg font-medium"
                                value={customBarrier}
                                onChange={(e) => setCustomBarrier(e.target.value)}
                                autoFocus
                            />
                        </div>
                    )}
                </div>
            ),
        },
        // BƯỚC 4: THỜI GIAN HỌC MỖI NGÀY
        {
            title: "4. Mỗi ngày bạn có thể dành bao nhiêu thời gian học tập tập trung?",
            content: (
                <div className="grid grid-cols-2 gap-4">
                    {dailyTimeOptions.map(({ item, icon }) => (
                        <div
                            key={item}
                            className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 shadow-sm flex flex-col items-center justify-center text-center 
                                ${dailyTime === item ? "bg-emerald-100 border-emerald-600 ring-4 ring-emerald-200" : "bg-white border-gray-300 hover:border-emerald-600 hover:scale-[1.01]"}
                            `}
                            onClick={() => setDailyTime(item)}
                        >
                            <span className="text-3xl mb-1">{icon}</span>
                            <p className="font-semibold text-lg text-gray-800">{item}</p>
                        </div>
                    ))}
                    
                    {dailyTime === "Khác" && (
                        <div className="col-span-2 mt-2">
                            <input
                                type="text"
                                placeholder="Nhập thời gian cụ thể (ví dụ: 90 phút)"
                                className="p-3 border-2 border-dashed border-gray-400 rounded-lg shadow-sm w-full focus:ring-emerald-500 focus:border-emerald-500 transition duration-150 text-lg font-medium"
                                value={customDailyTime}
                                onChange={(e) => setCustomDailyTime(e.target.value)}
                                autoFocus
                            />
                        </div>
                    )}
                </div>
            ),
        },
    ];

    // --- STEP NAVIGATION LOGIC ---

    const nextStep = () => {
        // Validation cho BƯỚC 1 (Goal)
        if (step === 1) {
            if (!goal || (goal === "Khác" && customGoal.trim() === "")) {
                toast.error("Vui lòng chọn hoặc nhập mục tiêu giao tiếp.");
                return;
            }
        }
        // Validation cho BƯỚC 2 (Duration)
        if (step === 2) {
            if (!duration || (duration === "Khác" && customDuration.trim() === "")) {
                toast.error("Vui lòng chọn thời gian mục tiêu.");
                return;
            }
        }
        // Validation cho Bước 3 (Barrier)
        if (step === 3) { 
            if (!barrier || (barrier === "Khác" && customBarrier.trim() === "")) {
                toast.error("Vui lòng chọn yếu tố thiếu tự tin.");
                return;
            }
        }
        // Validation cho Bước 4 (Daily Time)
        if (step === 4 && dailyTime === "Khác" && customDailyTime.trim() === "") {
            toast.error("Vui lòng nhập thời gian học mỗi ngày cụ thể.");
            return;
        }
        
        setFade(false);
        setTimeout(() => {
            setStep(step + 1);
            setFade(true);
        }, 200);
    };

    const prevStep = () => {
        setFade(false);
        setTimeout(() => {
            setStep(step - 1);
            setFade(true);
        }, 200);
    };
    
    // Logic để vô hiệu hóa nút "Tiếp theo" và nút "Hoàn tất" khi đang submit
    const isNextDisabled = () => {
        if (isSubmitting) return true; 
        
        if (step === 1) { // Goal
            if (!goal) return true;
            if (goal === "Khác" && customGoal.trim() === "") return true;
            return false;
        }
        if (step === 2) { // Duration
            if (!duration) return true;
            if (duration === "Khác" && customDuration.trim() === "") return true;
            return false;
        }
        if (step === 3) { // Barrier
            if (!barrier) return true;
            if (barrier === "Khác" && customBarrier.trim() === "") return true;
            return false;
        }
        if (step === 4) { // Daily Time
            if (!dailyTime) return true;
            if (dailyTime === "Khác" && customDailyTime.trim() === "") return true;
            return false;
        }
        return false;
    };
    
    const handleNext = () => {
        if (step === stepsContent.length) {
            handleSubmit();
        } else {
            nextStep();
        }
    };

    const contentToRender = stepsContent[step - 1]; 

    return (
        <div className="min-h-screen bg-gray-100 relative"> 
            {isSubmitting && (
                <LoadingModal 
                    title="Đang tạo bài test..."
                    message="Hệ thống AI đang phân tích dữ liệu của bạn."
                />
                )}

            <div className={`transition-opacity duration-300 ${isSubmitting ? "opacity-70 pointer-events-none" : ""}`}>
                
                <div className="flex justify-center items-center p-6 mt-10">
                    <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-2xl">
                        
                        <h1 className="text-3xl font-bold text-center text-emerald-700 mb-6">Cá nhân hóa mục tiêu học tập</h1>
                        
                        {/* Thanh Tiến Trình BƯỚC */}
                        <div className="mb-8">
                            <div className="h-2 bg-gray-200 rounded-full">
                                <div 
                                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                    style={{ width: `${(step / stepsContent.length) * 100}%` }}
                                ></div>
                            </div>
                            <p className="text-center text-sm text-gray-500 mt-2 font-medium">Bước {step} trên {stepsContent.length}</p>
                        </div>


                        <div className={`transition-opacity duration-300 ${fade ? "opacity-100" : "opacity-0"}`}>
                            <h2 className="font-bold mb-6 text-2xl text-gray-800 border-b pb-3">{contentToRender.title}</h2>
                            {contentToRender.content}

                            <div className="mt-8 flex justify-between">
                                {step > 1 && (
                                    <button 
                                        onClick={prevStep} 
                                        disabled={isSubmitting} // Khóa nút quay lại khi đang gửi
                                        className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                                    >
                                        ◀️ Quay lại
                                    </button>
                                )}
                                {step === 1 && <div />}
                                
                                <button
                                    onClick={handleNext}
                                    disabled={isNextDisabled()}
                                    className={`px-6 py-2 rounded-lg font-semibold shadow-md transition-colors 
                                        ${isNextDisabled() ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                                >
                                    {isSubmitting 
                                        ? 'Đang tạo...' 
                                        : (step < stepsContent.length ? 'Tiếp theo ▶️' : 'Hoàn tất ✅')
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}