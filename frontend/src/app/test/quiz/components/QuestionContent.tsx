import React, { useState, useRef, useEffect } from "react"; 
import toast from "react-hot-toast";

// --- ĐỊNH NGHĨA KIỂU DỮ LIỆU (TYPESCRIPT) ---
interface AudioData {
    audioBlob: Blob;
    latency: number; // milliseconds
    duration: number; // seconds
}

type AnswerValue = string | AudioData | null;

interface Question {
    id: number;
    question_type?: string;
    question_text: string;
    options: string[];
}

interface QuestionContentProps {
    currentQ: Question;
    currentAnswer: AnswerValue;
    setSelectedOptions: React.Dispatch<React.SetStateAction<Record<number, AnswerValue>>>;
    currentQuestion: number;
}

export default function QuestionContent({
    currentQ,
    currentAnswer,
    setSelectedOptions,
    currentQuestion,
}: QuestionContentProps) {
    
    // --- STATES & REFS ---
    const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'finished'>('idle'); 
    const [audioUrl, setAudioUrl] = useState<string | null>(null); 
    const [latencyTime, setLatencyTime] = useState<number | null>(null); 
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<BlobPart[]>([]);
    const clickTimeRef = useRef<number>(0); 

    const optionKeys = ['A', 'B', 'C', 'D']; 
    const questionType = currentQ?.question_type || 'grammar';
    const isMultipleChoice = questionType !== 'speaking_prompt';
    
    // --- RESET STATE WHEN QUESTION CHANGES ---
    useEffect(() => {
        setRecordingState('idle');
        setAudioUrl(null);
        setLatencyTime(null);
        
        if (currentAnswer && typeof currentAnswer === 'object' && 'audioBlob' in currentAnswer) {
            setLatencyTime(currentAnswer.latency);
            setRecordingState('finished');
            setAudioUrl(URL.createObjectURL(currentAnswer.audioBlob));
        }
        
        return () => {
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
        };
    }, [currentQ?.id, currentAnswer]); 
    
    if (!currentQ) {
        return (
            <div className="w-full max-w-2xl bg-white rounded-2xl p-8 shadow-sm border border-blue-100 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="ml-3 text-blue-600 font-medium">Loading question...</p>
            </div>
        );
    }
    
    // --- RECORDING LOGIC ---
    const startRecording = async () => {
        if (!navigator.mediaDevices || !window.MediaRecorder) {
            toast.error("Trình duyệt không hỗ trợ ghi âm.");
            return;
        }

        clickTimeRef.current = Date.now(); 

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
                
                setAudioUrl(blobUrl);
                setRecordingState('finished');
                setLatencyTime(actualLatencyMs);
                stream.getTracks().forEach(track => track.stop());

                setSelectedOptions((prev) => ({
                    ...prev,
                    [currentQ.id]: {
                        audioBlob: audioBlob,
                        latency: actualLatencyMs, 
                        duration: finalDuration
                    },
                }));
            };
            
            recorder.start();
            setRecordingState('recording');
            
            setTimeout(() => {
                if (recorder.state === 'recording') {
                    stopRecording();
                    toast('Đã hết thời gian ghi âm (30s).');
                }
            }, 30000); 

        } catch (err) {
            toast.error("Vui lòng cấp quyền truy cập micro.");
            setRecordingState('idle');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    };
    
    return (
        <div className="w-full max-w-2xl bg-white rounded-2xl p-8 shadow-xl border border-blue-50">
            
            {/* QUESTION TEXT */}
            <h2 className="text-xl font-bold mb-8 text-slate-800 leading-relaxed">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white text-sm mr-3 shadow-md">
                    {currentQuestion}
                </span>
                {currentQ?.question_text}
            </h2>
            
            {isMultipleChoice ? (
                // --- MULTIPLE CHOICE ---
                <div className="space-y-4">
                    {currentQ?.options.map((opt, i) => {
                        const optionKey = optionKeys[i]; 
                        const isChecked = typeof currentAnswer === 'string' && currentAnswer === optionKey; 
                        
                        return (
                            <label 
                                key={optionKey} 
                                className={`group flex items-center gap-4 p-5 rounded-2xl cursor-pointer transition-all border-2
                                    ${isChecked 
                                        ? 'border-blue-600 bg-blue-50/50 shadow-sm' 
                                        : 'border-slate-100 hover:border-blue-300 hover:bg-blue-50/30'}
                                `}
                                onClick={() =>
                                    setSelectedOptions((prev) => ({
                                        ...prev,
                                        [currentQ.id]: optionKey,
                                    }))
                                }
                            >
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                                    ${isChecked ? 'border-blue-600 bg-blue-600' : 'border-slate-300 group-hover:border-blue-400'}
                                `}>
                                    {isChecked && <div className="w-2 h-2 bg-white rounded-full shadow-sm" />}
                                </div>
                                
                                <input
                                    type="radio"
                                    name={`question-${currentQ.id}`}
                                    value={optionKey}
                                    checked={isChecked}
                                    onChange={() => {}}
                                    className="hidden"
                                />
                                <span className={`font-semibold text-lg ${isChecked ? 'text-blue-700' : 'text-slate-600'}`}>
                                    <span className="opacity-50 mr-2">{optionKey}.</span> {opt}
                                </span>
                            </label>
                        );
                    })}
                </div>
            ) : (
                // --- SPEAKING PROMPT ---
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-8 overflow-hidden relative">
                    {/* Decorative element */}
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-200/20 rounded-full blur-2xl"></div>

                    <p className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                        Speaking Instructions
                    </p>
                    <p className="text-blue-700/80 mb-8 text-sm leading-relaxed">
                            Please answer the question using your voice. The system will record for up to 30 seconds.
                    </p>
                    
                    <div className="min-h-[120px] flex flex-col items-center justify-center rounded-2xl bg-white/60 backdrop-blur-sm border border-blue-200/50 p-6 shadow-inner">
                        
                        {/* 1. IDLE */}
                        {recordingState === 'idle' && (
                            <button
                                onClick={startRecording}
                                className="group flex items-center gap-3 bg-blue-600 text-white px-10 py-4 rounded-full font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:scale-95"
                            >
                                <div className="w-3 h-3 bg-white rounded-full group-hover:animate-pulse"></div>
                                Start Recording
                            </button>
                        )}

                        {/* 2. RECORDING */}
                        {recordingState === 'recording' && (
                            <div className="flex flex-col items-center w-full">
                                <div className="flex items-center space-x-3 mb-4">
                                    <span className="relative flex h-4 w-4">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                                    </span>
                                    <p className="text-red-600 font-black tracking-widest text-sm">LIVE RECORDING</p>
                                </div>
                                <button
                                    onClick={stopRecording}
                                    className="flex items-center gap-2 bg-white text-blue-600 border-2 border-blue-600 px-8 py-2 rounded-full font-bold hover:bg-blue-50 transition-colors"
                                >
                                    <div className="w-2 h-2 bg-blue-600"></div>
                                    Stop Now
                                </button>
                            </div>
                        )}

                        {/* 3. FINISHED */}
                        {recordingState === 'finished' && audioUrl && (
                            <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-300">
                                <p className="text-blue-600 font-bold mb-4 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                                    </svg>
                                    Recording Captured
                                </p>
                                <div className="bg-blue-100/50 p-2 rounded-full w-full max-w-xs mb-3">
                                    <audio controls src={audioUrl} className="w-full h-8" /> 
                                </div>
                                <div className="flex gap-4">
                                    <button 
                                        onClick={startRecording}
                                        className="text-xs font-bold text-blue-500 hover:text-blue-700 underline"
                                    >
                                        Re-record
                                    </button>
                                    <span className="text-xs text-slate-400 font-mono">
                                        Latency: {latencyTime ? (latencyTime / 1000).toFixed(3) + 's' : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}