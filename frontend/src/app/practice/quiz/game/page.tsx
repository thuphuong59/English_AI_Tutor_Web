// File: RoadmapSection.tsx

"use client";
import React, { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { SmartQuestion } from "@/app/practice/types";
import { fetchSmartQuiz, saveQuizScore } from "@/services/vocabService"; 

import GameMode1_McV2D from "./components/GameMode1";
import GameMode2_McC2V from "./components/GameMode2";
import GameMode3_TypeD2V from "./components/GameMode3";
import QuizHeader from "./components/quizHeader";
import QuizResult from "./components/quizResult";

const FEEDBACK_DELAY = 2000; // 2 giây

export default function QuizGamePageWrapper() {
  return (
    <Suspense fallback={<div className="text-center p-10">Loading Quiz...</div>}>
      <QuizGamePage />
    </Suspense>
  );
}

function QuizGamePage() {
  const searchParams = useSearchParams();
  const deckType = searchParams.get("type");
  const deckIdString = searchParams.get("id"); 
  
  // 🚨 THÊM BIẾN LẤY lessonId TỪ URL PARAMS
  const lessonId = searchParams.get("lesson_id"); 

  const [questions, setQuestions] = useState<SmartQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); 
  
  const [score, setScore] = useState(0);
  const [missedWords, setMissedWords] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);

  // Ref để đảm bảo chỉ lưu điểm 1 lần khi kết thúc
  const scoreSaved = useRef(false);

  useEffect(() => {
    if (!deckType || !deckIdString) {
      setError("Không tìm thấy thông tin bộ từ.");
      setLoading(false);
      return;
    }
    const deckIdAsNumber = parseInt(deckIdString, 10);
    if (isNaN(deckIdAsNumber)) {
      setError("ID bộ từ không hợp lệ.");
      setLoading(false);
      return;
    }

    const fetchGameData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchSmartQuiz(deckType, deckIdAsNumber); 
        if (!data || data.length === 0) {
          setError("Bộ từ này không có từ vựng hoặc có lỗi xảy ra.");
          setQuestions([]);
        } else {
          setQuestions(data);
        }
      } catch (err) {
        setError((err as Error).message || "Lỗi khi tải câu hỏi.");
      } finally {
        setLoading(false);
      }
    };
    fetchGameData();
  }, [deckType, deckIdString]);

  // Effect để lưu điểm khi showResult = true
  useEffect(() => {
    if (showResult && !scoreSaved.current) {
        scoreSaved.current = true;
        const deckId = deckIdString ? parseInt(deckIdString, 10) : null;
        const totalQuestions = questions.length;

        // Chỉ lưu nếu có điểm và số câu > 0 (tránh lưu rác)
        if (totalQuestions > 0) {
            console.log("Saving score...", { deckId, score, totalQuestions, lessonId });
            
            // 🚨 SỬA ĐỔI CHÍNH: TRUYỀN lessonId LÊN SERVICE
            saveQuizScore(deckId, score, totalQuestions, lessonId) 
                .then(() => console.log("Score saved successfully"))
                .catch((err) => console.error("Failed to save score:", err));
        }
    }
  }, [showResult, deckIdString, score, questions.length, lessonId]); // 🚨 Thêm lessonId vào dependencies


  // Hàm xử lý logic chuyển câu
  const handleNextQuestion = () => {  
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowResult(true); 
    }
  };

  //  Hàm này được gọi TỪ component con
  const handleAnswerSubmit = (isCorrect: boolean) => {
    // Cập nhật điểm
    if (isCorrect) {
      setScore(prev => prev + 1);
    } else {
      const word = questions[currentIndex].word;
      setMissedWords(prev => [...prev, word]);
    }
    
    // Bắt đầu "đếm ngược" để chuyển câu
    setTimeout(() => {
      handleNextQuestion();
    }, FEEDBACK_DELAY); // Chờ 2 giây
  };
  
  // Logic khởi động lại game
  const handleRestart = () => {
    setCurrentIndex(0);
    setScore(0);
    setMissedWords([]);
    setShowResult(false);
    scoreSaved.current = false; // Reset trạng thái lưu điểm
  };

  if (loading) {
    return <div className="text-center p-20">Building your quiz...</div>;
  }
  if (error) {
    return <div className="text-center p-20 text-red-600">Lỗi: {error}</div>;
  }
  if (showResult) {
    return (
      <QuizResult
        score={score}
        total={questions.length}
        missedWords={missedWords}
        onRestart={handleRestart}
      />
    );
  }
  if (questions.length === 0) {
    return <div className="text-center p-20">Không tìm thấy câu hỏi nào.</div>;
  }

  const currentQuestion = questions[currentIndex];

  // Render chế độ game
  const renderGameMode = () => {
    // Chỉ truyền 2 props
    const commonProps = {
      question: currentQuestion,
      onSubmit: handleAnswerSubmit, 
    };
    
    switch (currentQuestion.type) {
      case "MC_V2D":
        return <GameMode1_McV2D {...commonProps} />;
      case "MC_C2V":
        return <GameMode2_McC2V {...commonProps} />;
      case "TYPE_D2V":
        return <GameMode3_TypeD2V {...commonProps} />;
      default:
        return <div>Lỗi: Loại câu hỏi không xác định: {currentQuestion.type}</div>;
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex justify-center items-center p-8">
      <div className="w-full max-w-2xl">
        <QuizHeader current={currentIndex + 1} total={questions.length} />
        <div className="bg-white p-8 rounded-lg shadow-lg">
          {renderGameMode()}
        </div>
      </div>
    </main>
  );
}