"use client";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { ArrowRight, ArrowLeft, Loader2, Target, CheckCircle } from "lucide-react";

// 🚨 ĐÃ SỬA LẠI URL API VỀ ĐỊA CHỈ BACKEND CỤ THỂ 🚨
// Nếu bạn chạy backend ở port khác, hãy đổi lại số 8000
const BACKEND_API_URL = 'http://127.0.0.1:8000/quiz/test'; 

// Dữ liệu lựa chọn
const stepOptions = {
    goals: [
        "Work, Interviews",
        "Travel, Culture",
        "Daily Conversation",
        "Other",
    ],
    duration: [
        "1 Month",
        "2–3 Months",
        "6 Months",
        "Long-term / Undefined",
        "Other",
    ],
    barrier: [
        "Slow Reflexes",
        "Pronunciation Issues",
        "Lack of Vocabulary",
        "Basic Grammar Errors",
        "Other",
    ],
    dailyTime: [
        "15 Minutes",
        "30 Minutes",
        "1 Hour",
        "Over 1 Hour",
        "Other",
    ],
};

interface PreferenceData {
    communication_goal: string;
    target_duration: string;
    confidence_barrier: string;
    daily_commitment: string;
}

export default function PreferencesPage() {
    const [step, setStep] = useState(1);
    
    const [goal, setGoal] = useState(""); 
    const [customGoal, setCustomGoal] = useState("");
    
    const [duration, setDuration] = useState("");
    const [customDuration, setCustomDuration] = useState("");

    const [barrier, setBarrier] = useState("");
    const [customBarrier, setCustomBarrier] = useState("");

    const [dailyTime, setDailyTime] = useState("");
    const [customDailyTime, setCustomDailyTime] = useState("");
    
    const [fade, setFade] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false); 

    const handleSubmit = async () => {
        const finalGoal = goal === "Other" ? customGoal : goal;
        const finalDuration = duration === "Other" ? customDuration : duration;
        const finalBarrier = barrier === "Other" ? customBarrier : barrier;
        const finalDailyTime = dailyTime === "Other" ? customDailyTime : dailyTime;

        if (!finalGoal) { toast.error("Please select a communication goal."); return; }
        if (!finalDuration) { toast.error("Please select a target duration."); return; }
        if (!finalBarrier) { toast.error("Please identify your biggest barrier."); return; }
        if (!finalDailyTime) { toast.error("Please specify your daily study commitment."); return; }

        const userData: PreferenceData = {
            communication_goal: finalGoal,
            target_duration: finalDuration,
            confidence_barrier: finalBarrier,
            daily_commitment: finalDailyTime,
        };

        setIsSubmitting(true);
        
        try {
            toast.loading("Generating diagnostic quiz...", { id: 'loading-quiz', duration: 10000 }); 

            const response = await fetch(BACKEND_API_URL, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });

            toast.dismiss('loading-quiz');

            // --- XỬ LÝ LỖI "Unexpected token <" (HTML Response) ---
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") === -1) {
                // Nếu phản hồi KHÔNG phải là JSON (thường là HTML lỗi 404/500)
                const text = await response.text();
                console.error("Non-JSON Response from Server:", text);
                throw new Error(`Server returned HTML instead of JSON. Check API URL (${response.status})`);
            }

            if (!response.ok) {
                const errorData = await response.json(); 
                throw new Error(errorData.detail || `Server Error: ${response.status}`);
            }

            const quizData = await response.json();
            localStorage.setItem("userQuizData", JSON.stringify(quizData)); 
            
            toast.success("Diagnostic quiz generated successfully!");

            setTimeout(() => {
                window.location.href = "/test/quiz"; 
            }, 800);

        } catch (error) {
            console.error("API error:", error);
            let errorMessage = 'Failed to connect to backend.';
            if (error instanceof Error) { errorMessage = error.message; }
            
            toast.dismiss('loading-quiz');
            toast.error(`Error: ${errorMessage}`);
        } finally {
            setIsSubmitting(false); 
        }
    };
    
    // --- RENDER HELPERS ---
    const renderOptions = (
        options: string[], 
        selected: string, 
        setSelected: (val: string) => void, 
        setCustom: (val: string) => void, 
        customValue: string, 
        customPlaceholder: string
    ) => (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {options.map((item) => (
                <div
                    key={item}
                    className={`cursor-pointer p-5 rounded-xl border-2 transition-all duration-200 shadow-sm flex items-center justify-center text-center h-20
                        ${selected === item 
                            ? "bg-blue-600 border-blue-600 text-white shadow-blue-300/50 transform scale-[1.02]" 
                            : "bg-white border-gray-200 text-gray-700 hover:border-blue-400 hover:bg-blue-50"}
                    `}
                    onClick={() => { setSelected(item); setCustom(""); }}
                >
                    <span className="font-bold text-lg">{item}</span>
                    {selected === item && <CheckCircle className="w-5 h-5 ml-2 text-white absolute right-4 md:static md:ml-2" />}
                </div>
            ))}
            
            {selected === "Other" && (
                <div className="col-span-1 md:col-span-2 mt-2 animate-fade-in-up">
                    <input
                        type="text"
                        placeholder={customPlaceholder}
                        className="p-4 border-2 border-blue-200 rounded-xl shadow-sm w-full focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition duration-150 text-lg outline-none"
                        value={customValue}
                        onChange={(e) => setCustom(e.target.value)}
                        autoFocus
                    />
                </div>
            )}
        </div>
    );

    const stepsContent = [
        {
            title: "1. What is your main communication goal?",
            content: renderOptions(stepOptions.goals, goal, setGoal, setCustomGoal, customGoal, "Enter your specific goal..."),
        },
        {
            title: "2. What is your target time frame?", 
            content: renderOptions(stepOptions.duration, duration, setDuration, setCustomDuration, customDuration, "Enter duration (e.g., 4 months)"),
        },
        {
            title: "3. What is your biggest barrier?", 
            content: renderOptions(stepOptions.barrier, barrier, setBarrier, setCustomBarrier, customBarrier, "Enter specific barrier..."),
        },
        {
            title: "4. Daily focused study time?",
            content: renderOptions(stepOptions.dailyTime, dailyTime, setDailyTime, setCustomDailyTime, customDailyTime, "Enter time (e.g., 90 mins)"),
        },
    ];

    const nextStep = () => {
        const validateStep = () => {
            if (step === 1) return goal && (goal !== "Other" || customGoal.trim() !== "");
            if (step === 2) return duration && (duration !== "Other" || customDuration.trim() !== "");
            if (step === 3) return barrier && (barrier !== "Other" || customBarrier.trim() !== "");
            if (step === 4) return dailyTime && (dailyTime !== "Other" || customDailyTime.trim() !== "");
            return false;
        };

        if (!validateStep()) {
            toast.error("Please complete the selection.");
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
    
    const isNextDisabled = () => {
        if (isSubmitting) return true; 
        if (step === 1) return !(goal && (goal !== "Other" || customGoal.trim() !== ""));
        if (step === 2) return !(duration && (duration !== "Other" || customDuration.trim() !== ""));
        if (step === 3) return !(barrier && (barrier !== "Other" || customBarrier.trim() !== ""));
        if (step === 4) return !(dailyTime && (dailyTime !== "Other" || customDailyTime.trim() !== ""));
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
    
    const LoadingModal = () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm transition-all">
            <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm text-center border border-gray-100">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-6" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Personalizing Your Path...</h3>
                <p className="text-gray-500">Our AI is analyzing your preferences to build the perfect diagnostic test.</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen relative bg-gradient-to-br from-[#F9F4EF] via-[#F4FFFB] to-[#E6ECFF] flex flex-col"> 
            {isSubmitting && <LoadingModal />}

            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl animate-pulse -z-10"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-400/10 rounded-full blur-3xl animate-pulse delay-1000 -z-10"></div>

            <div className={`flex-1 flex flex-col justify-center items-center py-10 px-4 sm:px-6 transition-opacity duration-300 ${isSubmitting ? "opacity-50 pointer-events-none" : ""}`}>
                
                <div className="bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl p-8 md:p-12 w-full max-w-3xl border border-white/60">
                    
                    <div className="text-center mb-10">
                        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3 tracking-tight">Setup Your Profile</h1>
                        <p className="text-gray-500 text-lg">Let us customize your learning experience.</p>
                    </div>
                    
                    <div className="mb-12 relative">
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${(step / stepsContent.length) * 100}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between mt-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            <span>Start</span>
                            <span>Finish</span>
                        </div>
                    </div>

                    <div className={`min-h-[300px] flex flex-col justify-between transition-opacity duration-300 ${fade ? "opacity-100" : "opacity-0"}`}>
                        <div>
                            <h2 className="font-extrabold mb-8 text-2xl md:text-3xl text-gray-900 leading-tight">
                                {contentToRender.title}
                            </h2>
                            {contentToRender.content}
                        </div>

                        <div className="mt-12 flex justify-between items-center pt-6 border-t border-gray-100">
                            <div>
                                {step > 1 ? (
                                    <button 
                                        onClick={prevStep} 
                                        disabled={isSubmitting} 
                                        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 px-4 py-2 rounded-lg font-bold transition-colors"
                                    >
                                        <ArrowLeft className="w-5 h-5"/> Back
                                    </button>
                                ) : <div />}
                            </div>
                            
                            <button
                                onClick={handleNext}
                                disabled={isNextDisabled()}
                                className={`flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold shadow-lg transition-all duration-300 transform active:scale-[0.98]
                                    ${isNextDisabled() 
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                                        : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-600/30'}
                                `}
                            >
                                {isSubmitting 
                                    ? <>Processing...</>
                                    : (step < stepsContent.length ? <>Next <ArrowRight className="w-5 h-5"/></> : <>Finish <Target className="w-5 h-5"/></>)
                                }
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}