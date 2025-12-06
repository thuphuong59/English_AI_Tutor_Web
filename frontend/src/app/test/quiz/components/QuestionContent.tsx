
import React, { useState, useRef, useEffect } from "react"; 
import toast from "react-hot-toast";

interface AudioData {
    audioBlob: Blob;
    latency: number; // milliseconds
    duration: number; // seconds
}
type AnswerValue = string | AudioData | null;

interface QuestionContentProps {
    currentQ: any;
    currentAnswer: AnswerValue; // Chấp nhận string hoặc AudioData
    setSelectedOptions: React.Dispatch<React.SetStateAction<Record<number, AnswerValue>>>;
    currentQuestion: number;
}

export default function QuestionContent({
    currentQ,
    currentAnswer,
    setSelectedOptions,
    currentQuestion,
}: QuestionContentProps) {
    
    // --- STATES VÀ REFS CHO THU ÂM ---
    const [recordingState, setRecordingState] = useState('idle'); 
    const [audioUrl, setAudioUrl] = useState<string | null>(null); 
    const [latencyTime, setLatencyTime] = useState<number | null>(null); 
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<BlobPart[]>([]);
    const clickTimeRef = useRef<number>(0); 

    const optionKeys = ['A', 'B', 'C', 'D']; 
    const questionType = currentQ?.question_type || 'grammar';
    const isMultipleChoice = questionType !== 'speaking_prompt';
    
    // --- FIX 1: RESET STATE VÀ HIỂN THỊ DỮ LIỆU ĐÃ LƯU KHI CHUYỂN CÂU HỎI ---
    // Khắc phục lỗi trùng lặp câu trả lời
    useEffect(() => {
        // Reset các trạng thái cục bộ
        setRecordingState('idle');
        setAudioUrl(null);
        setLatencyTime(null);
        
        // 🚨 PHÂN TÍCH currentAnswer 🚨
        if (currentAnswer && typeof currentAnswer === 'object' && 'audioBlob' in currentAnswer) {
            // Nếu đã có dữ liệu AudioData cho câu hỏi này
            setLatencyTime(currentAnswer.latency);
            setRecordingState('finished');
            
            // Tái tạo Blob URL từ Blob đã lưu (cần thiết vì URL.createObjectURL là tạm thời)
            setAudioUrl(URL.createObjectURL(currentAnswer.audioBlob));
        }
        
        // Dọn dẹp URL Blob cũ khi component unmount hoặc khi ID thay đổi
        return () => {
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
        };
    }, [currentQ?.id, currentAnswer]); // ✅ Đã sửa lỗi: Dùng optional chaining cho currentQ.id
    
    // Nếu không có câu hỏi hiện tại (ví dụ: đang tải)
    if (!currentQ) {
        return (
            <div className="w-full max-w-2xl bg-white rounded-xl p-8 shadow">
                <p className="text-gray-500">Đang tải câu hỏi...</p>
            </div>
        );
    }
    
    // --- LOGIC THU ÂM ---
    
    const startRecording = async () => {
        if (!navigator.mediaDevices || !window.MediaRecorder) {
            toast.error("Trình duyệt của bạn không hỗ trợ thu âm.");
            return;
        }

        // 1. Ghi lại thời điểm BẮT ĐẦU PHẢN XẠ (Click)
        clickTimeRef.current = Date.now(); 

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // 2. Tính Latency (Thời điểm Micro được cấp quyền - Thời điểm Click)
            const actualLatencyMs = Date.now() - clickTimeRef.current;
            
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];
            
            const recordingStartTime = Date.now(); 
            
            recorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            recorder.onstop = () => {
                const finalDuration = (Date.now() - recordingStartTime) / 1000;
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3'});
                const blobUrl = URL.createObjectURL(audioBlob);
                
                // Cập nhật local state
                setAudioUrl(blobUrl);
                setRecordingState('finished');
                setLatencyTime(actualLatencyMs); // Lưu latency đã tính

                // Dừng stream để tắt đèn micro
                stream.getTracks().forEach(track => track.stop());

                // 3. LƯU OBJECT AudioData VÀO STATE CHA
                setSelectedOptions((prev) => ({
                    ...prev,
                    [currentQ.id]: {
                        audioBlob: audioBlob,
                        latency: actualLatencyMs, 
                        duration: finalDuration
                    } as AudioData, // Ép kiểu
                }));
            };
            
            // Bắt đầu Ghi âm
            recorder.start();
            setRecordingState('recording');
            
            // Tự động dừng sau 30 giây
            setTimeout(() => {
                if (recorder.state === 'recording') {
                    stopRecording();
                    toast('Đã hết thời gian. Tự động dừng ghi âm.', { icon: '⏱️' });
                }
            }, 30000); 

        } catch (err) {
            console.error("Lỗi truy cập Micro:", err);
            toast.error("Vui lòng cho phép truy cập micro để làm bài test.");
            setRecordingState('idle');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    };
    
    // --- RENDER COMPONENT ---

    return (
        <div className="w-full max-w-2xl bg-white rounded-xl p-8 shadow">
            
            {/* PHẦN TIÊU ĐỀ */}
            <h2 className="text-xl font-bold mb-6 text-gray-800">
                <span className="text-teal-600 mr-2">{currentQuestion}.</span>
                {currentQ?.question_text}
            </h2>
            
            {isMultipleChoice ? (
                // --- TRẮC NGHIỆM ---
                <div className="space-y-4">
                    {currentQ?.options.map((opt: string, i: number) => {
                        const optionKey = optionKeys[i]; 
                        // Kiểm tra nếu currentAnswer là string (trắc nghiệm)
                        const isChecked = typeof currentAnswer === 'string' && currentAnswer === optionKey; 
                        
                        return (
                            <label 
                                key={optionKey} 
                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border-2
                                    ${isChecked ? 'border-teal-600 bg-teal-50 shadow-md' : 'border-gray-300 hover:border-teal-400'}
                                `}
                                onClick={() =>
                                    setSelectedOptions((prev) => ({
                                        ...prev,
                                        [currentQ.id]: optionKey, // Lưu string key
                                    }))
                                }
                            >
                                <input
                                    type="radio"
                                    name={`question-${currentQ.id}`}
                                    value={optionKey}
                                    checked={isChecked}
                                    onChange={() => {}}
                                    className="appearance-none w-5 h-5 rounded-full border-2 border-teal-500 checked:bg-teal-600 checked:border-teal-600 focus:ring-2 focus:ring-teal-500 shrink-0"
                                />
                                <span className="text-gray-800 font-medium">
                                    {optionKey}. {opt}
                                </span>
                            </label>
                        );
                    })}
                </div>
            ) : (
                // --- PHẦN GIAO TIẾP/PHÁT ÂM (Speaking Prompt) ---
                <div className="p-6 bg-yellow-50 border-l-4 border-yellow-500 rounded-md">
                    <p className="font-bold text-lg text-yellow-700 mb-3">
                        💬 Hướng dẫn Luyện Nói:
                    </p>
                    <p className="text-gray-700 mb-4">
                        Hãy trả lời câu hỏi/tình huống trên bằng giọng nói. (Giới hạn 30 giây).
                    </p>
                    
                    <div className="h-20 flex flex-col items-center justify-center rounded-md">
                        
                        {/* 1. IDLE / SẴN SÀNG */}
                        {recordingState === 'idle' && (
                            <button
                                onClick={startRecording}
                                className="bg-teal-600 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-teal-700 transition disabled:bg-gray-400"
                            >
                                🎙️ BẮT ĐẦU THU ÂM
                            </button>
                        )}

                        {/* 2. ĐANG GHI ÂM */}
                        {recordingState === 'recording' && (
                            <div className="flex flex-col items-center">
                                <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 bg-red-600 rounded-full animate-pulse"></div>
                                    <p className="text-red-600 font-semibold">ĐANG GHI ÂM...</p>
                                </div>
                                <button
                                    onClick={stopRecording}
                                    className="mt-2 bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600 transition font-semibold"
                                >
                                    Dừng Lại
                                </button>
                            </div>
                        )}

                        {/* 3. ĐÃ HOÀN THÀNH */}
                        {recordingState === 'finished' && audioUrl && (
                            <div className="text-center">
                                <p className="text-teal-600 font-bold mb-2">✅ Đã Ghi Âm Thành Công!</p>
                                <audio controls src={audioUrl} className="w-full h-8"></audio> 
                                <p className="text-sm text-gray-500 mt-2">
                                    Phản xạ: {latencyTime ? (latencyTime / 1000).toFixed(2) + 's' : 'N/A'}
                                </p>
                            </div>
                        )}
                        
                    </div>
                </div>
            )}
        </div>
    );
}