"use client";

import { useState, useEffect } from "react"; 
import { useRouter } from 'next/navigation';
import { useCountdown } from "../../hooks/useCountdown";
import Sidebar from "./components/Sidebar";
import QuestionContent from "./components/QuestionContent";
import LoadingModal from "../../../components/ui/LoadingModal"; 
import toast from "react-hot-toast"; 

const ANALYSIS_API_URL = 'http://127.0.0.1:8000/assessment/submit_and_analyze'; 

interface AudioData {
    audioBlob: Blob;
    latency: number;
    duration: number;
}

interface SpeakingDataPayload {
    question_id: number;
    latency_ms: number;
    duration_s: number;
    file_key: string;
}

type AnswerValue = string | AudioData | null;

interface Question {
    id: number;
    question_text: string;
    options: string[];
    correct_answer_key: string; 
}

export default function QuizPage() {
    const router = useRouter();
    const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]); 
    const [isLoading, setIsLoading] = useState(true); 
    const [showLoading, setShowLoading] = useState(false);

    const [currentQuestion, setCurrentQuestion] = useState(1);
    
    const [selectedOptions, setSelectedOptions] = useState<Record<number, AnswerValue>>({}); 
    
    const [currentUserId, setCurrentUserId] = useState<string | null>(null); 
    
    const { minutes, seconds } = useCountdown(10 * 60);

    useEffect(() => {
        const userId = localStorage.getItem('authenticatedUserId');
        
        if (!userId) {
            toast.error("Vui lòng đăng nhập lại để làm bài kiểm tra.");
            router.push('/auth');
            return;
        }
        setCurrentUserId(userId);

        const data = localStorage.getItem('userQuizData');
        if (data) {
            try {
                const parsedData = JSON.parse(data);
                if (parsedData.questions && parsedData.questions.length > 0) {
                    setShuffledQuestions(parsedData.questions);
                } else {
                    toast.error("No questions found in the quiz data.");
                }
            } catch (e) {
                toast.error("Error loading quiz data from storage.");
                console.error("Parsing error:", e);
            }
        } else {
            toast.error("Quiz data not found. Please go back to preferences.");
            router.push('/test');
        }
        setIsLoading(false);
    }, [router]);


    const handleSubmit = async () => {
        if (!currentUserId) {
            toast.error("Lỗi xác thực. Vui lòng thử đăng nhập lại.");
            return;
        }
        
        setShowLoading(true);
        const quizData = JSON.parse(localStorage.getItem('userQuizData') || '{}');
        
        const formData = new FormData();
        const mcqAnswers: Record<string, string> = {}; 
        
        const speakingData: SpeakingDataPayload[] = []; 

        Object.entries(selectedOptions).forEach(([qId, answer]) => {
            const questionId = parseInt(qId);
            
            if (typeof answer === 'string' && answer !== null) {
                mcqAnswers[qId] = answer;
            } else if (answer && typeof answer === 'object' && 'audioBlob' in answer) {
                const audioData = answer as AudioData;
                
                formData.append(`audio_file_${questionId}`, audioData.audioBlob, `audio_${questionId}.mp3`);
                
                speakingData.push({
                    question_id: questionId,
                    latency_ms: audioData.latency,
                    duration_s: audioData.duration,
                    file_key: `${questionId}`,
                });
            }
        });

        const payload = {
            user_id: currentUserId,
            preferences: quizData.user_preferences,
            mcq_answers: mcqAnswers,
            speaking_data: speakingData,
            quiz_questions: shuffledQuestions,
            
        };
        
        formData.append('payload', JSON.stringify(payload)); 

        try {
            toast.loading("Đang phân tích bài làm và tạo lộ trình...", { id: 'analysis-loading' });

            const response = await fetch(ANALYSIS_API_URL, {
                method: 'POST',
                body: formData,
            });
            
            toast.dismiss('analysis-loading');

            if (!response.ok) {
                const errorData = await response.json(); 
                throw new Error(errorData.detail || `Lỗi Server ${response.status}.`);
            }

            const roadmapData = await response.json();
            
            localStorage.setItem("userRoadmap", JSON.stringify(roadmapData));
            toast.success("Phân tích hoàn tất! Lộ trình đã được tạo.");
            
            setTimeout(() => {
                window.location.href = "/roadmap";
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
    
    if (isLoading || !currentUserId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-lg text-gray-600">Loading quiz content...</p>
            </div>
        );
    }
    
    const currentQ = shuffledQuestions[currentQuestion - 1];
    const currentAnswer = selectedOptions[currentQ?.id] || null; 

    return (
        <main className="min-h-screen flex flex-col">
            {showLoading && (
                <LoadingModal
                title="Đang phân tích bài làm..."
                message="AI đang đánh giá kết quả và tạo lộ trình cá nhân hóa. Vui lòng chờ."
                />
            )}
            <div className="flex mt-6 px-6">
                <Sidebar
                    shuffledQuestions={shuffledQuestions}
                    currentQuestion={currentQuestion}
                    selectedOptions={selectedOptions}
                    setCurrentQuestion={setCurrentQuestion}
                    minutes={minutes}
                    seconds={seconds}
                    onSubmit={handleSubmit}
                />

                <main className="flex-1 ml-6 flex justify-center">
                    <QuestionContent
                        currentQ={currentQ}
                        currentAnswer={currentAnswer}
                        setSelectedOptions={setSelectedOptions as any} 
                        currentQuestion={currentQuestion}
                    />
                </main>
            </div>
        </main>
    );
}