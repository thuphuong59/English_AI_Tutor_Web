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
        
        // Analyze currentAnswer to restore state if it exists
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
            <div className="w-full max-w-2xl bg-white rounded-xl p-8 shadow">
                <p className="text-gray-500">Loading question...</p>
            </div>
        );
    }
    
    // --- RECORDING LOGIC ---
    
    const startRecording = async () => {
        if (!navigator.mediaDevices || !window.MediaRecorder) {
            toast.error("Your browser does not support audio recording.");
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
            
            // Auto stop after 30s
            setTimeout(() => {
                if (recorder.state === 'recording') {
                    stopRecording();
                    toast('Time limit reached. Recording stopped.');
                }
            }, 30000); 

        } catch (err) {
            console.error("Microphone access error:", err);
            toast.error("Please allow microphone access to proceed.");
            setRecordingState('idle');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    };
    
    // --- RENDER ---

    return (
        <div className="w-full max-w-2xl bg-white rounded-xl p-8 shadow-lg border border-gray-100">
            
            {/* QUESTION TEXT */}
            <h2 className="text-xl font-bold mb-6 text-gray-900">
                <span className="text-blue-600 mr-2">{currentQuestion}.</span>
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
                                className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border-2
                                    ${isChecked 
                                        ? 'border-blue-600 bg-blue-50 shadow-md' 
                                        : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'}
                                `}
                                onClick={() =>
                                    setSelectedOptions((prev) => ({
                                        ...prev,
                                        [currentQ.id]: optionKey,
                                    }))
                                }
                            >
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                                    ${isChecked ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}
                                `}>
                                    {isChecked && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                                </div>
                                
                                <input
                                    type="radio"
                                    name={`question-${currentQ.id}`}
                                    value={optionKey}
                                    checked={isChecked}
                                    onChange={() => {}}
                                    className="hidden" // Hide default radio
                                />
                                <span className={`font-medium text-lg ${isChecked ? 'text-blue-900' : 'text-gray-700'}`}>
                                    {optionKey}. {opt}
                                </span>
                            </label>
                        );
                    })}
                </div>
            ) : (
                // --- SPEAKING PROMPT ---
                <div className="p-6 bg-blue-50 border-l-4 border-blue-600 rounded-r-xl">
                    <p className="font-bold text-lg text-blue-900 mb-2">
                        Speaking Instructions
                    </p>
                    <p className="text-blue-800 mb-6 opacity-90">
                        Please answer the question or situation above using your voice. (Limit: 30 seconds).
                    </p>
                    
                    <div className="h-24 flex flex-col items-center justify-center rounded-lg bg-white/50 border border-blue-100 p-4">
                        
                        {/* 1. IDLE */}
                        {recordingState === 'idle' && (
                            <button
                                onClick={startRecording}
                                className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-blue-700 transition active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                Start Recording
                            </button>
                        )}

                        {/* 2. RECORDING */}
                        {recordingState === 'recording' && (
                            <div className="flex flex-col items-center w-full">
                                <div className="flex items-center space-x-3 mb-3">
                                    <span className="relative flex h-3 w-3">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                    </span>
                                    <p className="text-red-600 font-bold tracking-wider text-sm">RECORDING...</p>
                                </div>
                                <button
                                    onClick={stopRecording}
                                    className="text-gray-500 hover:text-red-600 text-sm font-semibold underline decoration-2 underline-offset-4 transition-colors"
                                >
                                    Stop Recording
                                </button>
                            </div>
                        )}

                        {/* 3. FINISHED */}
                        {recordingState === 'finished' && audioUrl && (
                            <div className="w-full flex flex-col items-center">
                                <p className="text-green-600 font-bold mb-2 text-sm">Recording Saved</p>
                                <audio controls src={audioUrl} className="w-full max-w-xs h-8 mb-1" /> 
                                <p className="text-xs text-gray-400 mt-1 font-mono">
                                    Latency: {latencyTime ? (latencyTime / 1000).toFixed(3) + 's' : 'N/A'}
                                </p>
                            </div>
                        )}
                        
                    </div>
                </div>
            )}
        </div>
    );
}