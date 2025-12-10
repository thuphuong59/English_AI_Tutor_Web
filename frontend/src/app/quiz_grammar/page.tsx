// frontend/src/app/quiz_grammar/page.tsx

"use client";

import React, { useState, useEffect, useCallback } from "react"; 
import { useRouter, useSearchParams } from 'next/navigation'; 
import { useCountdown } from "../hooks/useCountdown"; // ĐÃ SỬA ĐƯỜNG DẪN TƯƠNG ĐỐI
import Sidebar from "../test/quiz/components/Sidebar"; 
import QuestionContent from "../test/quiz/components/QuestionContent";
import LoadingModal from "../../components/ui/LoadingModal"; 
import toast from "react-hot-toast"; 

const SUBMIT_API_BASE_URL = 'http://127.0.0.1:8000/api/quiz-grammar'; 

interface Question {
    id: number;
    question_text: string;
    options: string[];
    correct_answer: string; 
}

export default function QuizPage() {
    const router = useRouter();
    const searchParams = useSearchParams(); 
    const sessionId = searchParams.get('sessionId'); 

    const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]); 
    const [isLoading, setIsLoading] = useState(true); 
    const [showLoading, setShowLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string>("Đang tải dữ liệu phiên làm bài..."); 
    
    const [currentQuestion, setCurrentQuestion] = useState(1);
    // Chỉ cần Record<number, string> cho MCQ
    const [selectedOptions, setSelectedOptions] = useState<Record<number, string>>({}); 
    const [currentUserId, setCurrentUserId] = useState<string | null>(null); 
    
    // Giả định useCountdown nằm ở /hooks
    const { minutes, seconds } = useCountdown(10 * 60); 


    // --- LOGIC TẢI CÂU HỎI VÀ KIỂM TRA TRẠNG THÁI (POLLING LOGIC) ---
    const fetchQuestions = useCallback(async (token: string) => {
        if (!sessionId) return false;
        
        let success = false;
        try {
            const response = await fetch(`${SUBMIT_API_BASE_URL}/${sessionId}/questions`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorData = await response.json(); 
                const status = response.status;

                if (status === 404 || status === 403) {
                    setStatusMessage("Phiên làm bài không tồn tại hoặc đã lỗi.");
                    throw new Error("SESSION_ERROR"); 
                }
                setStatusMessage("Lỗi kết nối. Đang thử lại...");
                return false; 
            }
            
            const data = await response.json(); 
            const questions = data || [];

            if (questions.length > 0) {
                setShuffledQuestions(questions);
                setStatusMessage("Bài kiểm tra đã sẵn sàng!");
                success = true; 
            } else {
                setStatusMessage("Bài kiểm tra đang được AI tạo. Vui lòng chờ...");
            }

        } catch (e) {
            if (e instanceof Error && e.message === "SESSION_ERROR") {
                toast.error(statusMessage);
                router.push('/roadmap'); 
                return true; 
            }
            setStatusMessage(`Lỗi tải: ${e instanceof Error ? e.message : 'Không xác định'}`);
        } finally {
            setIsLoading(false);
        }
        return success;
    }, [sessionId, router, statusMessage]);


    // --- EFFECT CHÍNH: POLLING VÀ XÁC THỰC ---
    useEffect(() => {
        const userId = localStorage.getItem('authenticatedUserId');
        const token = localStorage.getItem('access_token');
        
        // 1. XÁC THỰC
        if (!userId || !token) {
            toast.error("Vui lòng đăng nhập lại để làm bài kiểm tra.");
            router.push('/auth');
            return;
        }
        setCurrentUserId(userId);

        // 2. POLLING LOGIC
        let interval: NodeJS.Timeout | null = null;
        
        if (sessionId) {
            fetchQuestions(token); 
            interval = setInterval(async () => {
                const finished = await fetchQuestions(token);
                if (finished) {
                    clearInterval(interval!); 
                }
            }, 5000); 
            
        } else {
            toast.error("Thiếu ID bài kiểm tra.");
            router.push('/roadmap'); 
            setIsLoading(false);
        }
        
        return () => {
            if (interval) clearInterval(interval);
        };
        
    }, [router, sessionId]); 


    const handleSubmit = async () => {
        if (!currentUserId || !sessionId || shuffledQuestions.length === 0) {
            toast.error("Bài làm không hợp lệ hoặc lỗi xác thực.");
            return;
        }
        
        setShowLoading(true);
        const token = localStorage.getItem('access_token');
        
        const mcqAnswers: Record<number, string> = {}; 

        Object.entries(selectedOptions).forEach(([qId, answer]) => {
            if (typeof answer === 'string' && answer !== null) {
                mcqAnswers[parseInt(qId)] = answer; 
            } 
        });

        const payload = {
            session_id: parseInt(sessionId), 
            user_id: currentUserId,
            answers: mcqAnswers, 
        };
        
        // --- Gửi Submission ---
        try {
            toast.loading("Đang chấm điểm và cập nhật tiến độ...", { id: 'analysis-loading' });

            const response = await fetch(`${SUBMIT_API_BASE_URL}/${sessionId}/submit`, { 
                method: 'POST',
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            
            toast.dismiss('analysis-loading');

            if (!response.ok) {
                const errorData = await response.json(); 
                throw new Error(errorData.detail || `Lỗi Server ${response.status}.`);
            }

            const results = await response.json(); 
            
            toast.success(`Nộp bài hoàn tất! Điểm của bạn: ${(results.score_percent * 100).toFixed(0)}%.`);
            
            setTimeout(() => {
                router.push("/roadmap"); 
            }, 800);

        } catch (error) {
            let errorMessage = 'Gửi bài làm thất bại.';
            if (error instanceof Error) { errorMessage = error.message; }
            
            toast.dismiss('analysis-loading');
            toast.error(`Lỗi: ${errorMessage}`);
        } finally {
            setShowLoading(false);
        }
    };
    
    // Logic Loading / Status Message
    if (isLoading || shuffledQuestions.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-lg text-gray-600">
                    {isLoading ? "Đang tải câu hỏi..." : statusMessage} 
                </p>
            </div>
        );
    }
    
    const currentQ = shuffledQuestions[currentQuestion - 1];
    const currentAnswer = selectedOptions[currentQ?.id] || null; 

    return (
        <main className="min-h-screen bg-gray-50 py-8 px-6">
            {showLoading && (
                <LoadingModal
                    title="Đang chấm điểm và phân tích..."
                    message="Đang đánh giá kết quả và cập nhật tiến độ. Vui lòng chờ."
                />
            )}

            <div className="flex max-w-7xl mx-auto gap-6">
                
                {/* Sidebar */}
                <Sidebar
                    shuffledQuestions={shuffledQuestions}
                    currentQuestion={currentQuestion}
                    selectedOptions={selectedOptions}
                    setCurrentQuestion={setCurrentQuestion}
                    minutes={minutes}
                    seconds={seconds}
                    onSubmit={handleSubmit}
                />

                {/* Question Area */}
                <div className="flex-1 flex justify-center">
                    <QuestionContent
                        currentQ={currentQ}
                        currentAnswer={currentAnswer}
                        setSelectedOptions={setSelectedOptions as any}
                        currentQuestion={currentQuestion}
                    />
                </div>

            </div>
        </main>
    );
}