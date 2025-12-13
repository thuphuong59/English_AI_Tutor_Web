
"use client";

import { useState, useRef, useEffect, FC, KeyboardEvent } from "react";
import { Mic, Send, StopCircle, X, Loader2 } from "lucide-react";


interface ChatInputProps {
    input: string;
    onInputChange: (value: string) => void;
    onSend: () => Promise<void>;
    loading: boolean;
    onVoiceMessage: (audioBlob: Blob, audioUrl: string) => Promise<void>;
    mode: "scenario" | "free";
    disabled: boolean;
}


type Status = "idle" | "recording" | "reviewing";


const ChatInput: FC<ChatInputProps> = ({
    input,
    onInputChange,
    onSend,
    loading,
    onVoiceMessage,
    mode,
    disabled,
}) => {
    const [status, setStatus] = useState<Status>("idle");
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioPreview, setAudioPreview] = useState<{ blob: Blob; url: string } | null>(null);


    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);


    // ================= CLEANUP =================
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (audioPreview?.url) URL.revokeObjectURL(audioPreview.url);
        };
    }, [audioPreview]);


    // ================= RECORDING =================
    const startRecording = async () => {
        if (loading || disabled || status !== "idle") return;


        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);


            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];


            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };


            recorder.onstop = () => {
                stream.getTracks().forEach((t) => t.stop());
                if (timerRef.current) clearInterval(timerRef.current);


                if (audioChunksRef.current.length === 0) {
                    setStatus("idle");
                    return;
                }


                const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType });
                const url = URL.createObjectURL(blob);


                setAudioPreview({ blob, url });
                setRecordingTime(0);
                setStatus("reviewing");
            };


            recorder.start();
            setStatus("recording");
            setRecordingTime(0);


            timerRef.current = setInterval(() => {
                setRecordingTime((t) => t + 1);
            }, 1000);
        } catch (err) {
            console.error("Microphone error:", err);
            alert("Cannot access microphone. Please allow microphone permission.");
            setStatus("idle");
        }
    };


    const stopRecording = () => {
        if (mediaRecorderRef.current && status === "recording") {
            mediaRecorderRef.current.stop();
        }
    };


    const handleSendAudio = async () => {
        if (!audioPreview || loading || disabled) return;


        audioPlayerRef.current?.pause();
        await onVoiceMessage(audioPreview.blob, audioPreview.url);


        URL.revokeObjectURL(audioPreview.url);
        setAudioPreview(null);
        setStatus("idle");
    };


    const handleCancelAudio = () => {
        audioPlayerRef.current?.pause();
        if (audioPreview?.url) URL.revokeObjectURL(audioPreview.url);


        setAudioPreview(null);
        setStatus("idle");
    };


    // ================= INPUT =================
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();


            if (
                input.trim() &&
                !loading &&
                !disabled &&
                status === "idle" &&
                mode === "free"
            ) {
                onSend();
            }
        }
    };


    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };


    const isInputDisabled = loading || disabled || status !== "idle";
    const isSendDisabled =
        isInputDisabled || !input.trim() || mode !== "free";


    // ================= UI =================


    //  RECORDING
    if (status === "recording") {
        return (
            <div className="flex items-center justify-between bg-red-50 border border-red-100 rounded-full px-4 py-2">
                <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <span className="text-red-600 font-medium text-sm tabular-nums">
                        {formatTime(recordingTime)}
                    </span>
                    <span className="text-red-400 text-xs">Recording...</span>
                </div>


                <button
                    onClick={stopRecording}
                    className="bg-white text-red-500 p-2 rounded-full hover:bg-red-100"
                >
                    <StopCircle size={20} />
                </button>
            </div>
        );
    }


    //  REVIEW
    if (status === "reviewing" && audioPreview) {
        return (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full p-1 pr-2">
                <button
                    onClick={handleCancelAudio}
                    className="p-2 rounded-full text-slate-400 hover:text-red-500"
                >
                    <X size={18} />
                </button>


                <audio
                    ref={audioPlayerRef}
                    src={audioPreview.url}
                    controls
                    className="h-8 max-w-[220px]"
                />


                <button
                    onClick={handleSendAudio}
                    disabled={loading}
                    className="bg-blue-600 text-white p-2 rounded-full disabled:bg-slate-400"
                >
                    {loading ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <Send size={18} />
                    )}
                </button>
            </div>
        );
    }


    //  NORMAL INPUT
    return (
        <div className="flex items-center gap-2">
            <div
                className={`flex-1 rounded-full flex items-center px-4 py-2.5 border transition ${
                    isInputDisabled
                        ? "bg-slate-100"
                        : "bg-slate-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100"
                }`}
            >
                <input
                    value={input}
                    onChange={(e) => onInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isInputDisabled}
                    placeholder={
                        disabled
                            ? "Input disabled"
                            : mode === "scenario"
                            ? "Type your answer..."
                            : "Type a message..."
                    }
                    className="flex-1 bg-transparent outline-none text-sm"
                />


                {input.trim() && mode === "free" && (
                    <button
                        onClick={onSend}
                        disabled={isSendDisabled}
                        className={`ml-2 ${
                            isSendDisabled
                                ? "text-slate-400"
                                : "text-blue-600 hover:scale-110"
                        }`}
                    >
                        {loading ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <Send size={18} />
                        )}
                    </button>
                )}
            </div>


            {!input.trim() && (
                <button
                    onClick={mode === "free" ? startRecording : onSend}
                    disabled={loading || disabled}
                    className={`w-11 h-11 rounded-full flex items-center justify-center shadow-sm ${
                        loading || disabled
                            ? "bg-slate-100 text-slate-300"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                >
                    {loading ? (
                        <Loader2 size={20} className="animate-spin" />
                    ) : mode === "free" ? (
                        <Mic size={20} />
                    ) : (
                        <Send size={20} />
                    )}
                </button>
            )}
        </div>
    );
};


export default ChatInput;
