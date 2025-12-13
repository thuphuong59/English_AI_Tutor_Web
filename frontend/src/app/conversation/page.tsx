"use client";
import { useState, FC, useEffect, useRef, useCallback } from "react";
import { Award, PlayCircle, ArrowLeft, RefreshCw, Loader2, Menu, PanelLeftOpen, LogIn } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import ModeSelector from "./components/ModeSelector";
import LevelSelector from "./components/LevelSelector";
import TopicSelector from "./components/TopicSelector";
import ChatArea from "./components/ChatArea";
import { DialogueLine } from "./components/DialogueLine";
import ChatInput from "./components/ChatInput";
import HistorySidebar from "./components/HistorySideBar";
import * as api from "../../services/api";
import { analyzeConversationSession } from "../../services/vocabService";
import { DisplayMessage, Scenario, HistorySession } from "./types";




const ConversationPage: FC = () => {
    // ================= ROUTER =================
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialStartRef = useRef(false);


    // ================= LOGIN =================
    const [hasToken, setHasToken] = useState<boolean | null>(null);
    const [checkingLogin, setCheckingLogin] = useState(true);


    // ================= MAIN STATES =================
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [mode, setMode] = useState<"scenario" | "free">("scenario");
    const [level, setLevel] = useState("Beginner");
    const [view, setView] = useState<"topics" | "scenarios">("topics");
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
    const [messages, setMessages] = useState<DisplayMessage[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [input, setInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const [conversationStarted, setConversationStarted] = useState(false);
    const [currentTurn, setCurrentTurn] = useState(2);
    const [isScenarioComplete, setIsScenarioComplete] = useState(false);
    const [pendingStep, setPendingStep] = useState<any>(null);
    const [isViewingHistory, setIsViewingHistory] = useState(false);
    const [sessions, setSessions] = useState<HistorySession[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);


    // ================= SPEAK =================
    const speak = (text: string) => {
        if (!("speechSynthesis" in window)) return;
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "en-US";
        speechSynthesis.speak(u);
    };


    // ================= LOGIN CHECK =================
    useEffect(() => {
        const token =
            localStorage.getItem("access_token") ||
            sessionStorage.getItem("access_token");


        setHasToken(!!token);
        setCheckingLogin(false);
    }, []);


    // ================= HISTORY =================
    const fetchHistory = useCallback(async () => {
        setHistoryLoading(true);
        try {
            setSessions(await api.getHistoryList());
        } finally {
            setHistoryLoading(false);
        }
    }, []);


    // ================= START CONVERSATION =================
    const handleStart = async (
        scenario: Scenario | null,
        topicFromInput?: string,
        levelFromInput?: string,
        lessonIdFromUrl?: string | undefined
    ) => {
        setIsViewingHistory(false);
       
        const currentLevel = levelFromInput || level;
        const currentTopic = scenario?.title || topicFromInput || selectedTopic;
       
        if (!currentTopic) return;
        setChatLoading(true);


        const finalMode = topicFromInput ? "free" : mode;
        const scenarioIdRaw = finalMode === "free" ? null : scenario?.id;
        const finalScenarioId = scenarioIdRaw ?? undefined;
       
        try {
            const res = await api.startConversation(
                finalMode,
                currentLevel,
                finalScenarioId,
                currentTopic,
                lessonIdFromUrl
            );
           
            const sessionIdFromApi = res.session_id ?? null;
            setSessionId(sessionIdFromApi);
            if (scenario) setActiveScenario(scenario);
           
            // Cập nhật state
            setMode(finalMode as "scenario" | "free");
            setSelectedTopic(currentTopic);
            setLevel(currentLevel);
           
            const greeting = res.greeting ?? "";
            setMessages([{ role: "ai", text: greeting, type: "greeting" }]);
            if (greeting) speak(greeting);
           
            const firstSuggestion = Array.isArray(res.suggestions) && res.suggestions.length > 0 ? res.suggestions[0] : undefined;
            if (finalMode === "scenario" && firstSuggestion) setSuggestions([firstSuggestion]);
           
            setConversationStarted(true);
            setCurrentTurn(2);
            setIsScenarioComplete(false);
            setPendingStep(null);
            fetchHistory();
            setSessionId(res.session_id ?? null);
            if (window.innerWidth < 1024) setIsSidebarOpen(false);
           
        } catch (e: any) {
            // 🚨 FIX: Xử lý lỗi để hiển thị JSON chi tiết (thay vì [object Object])
            let errorMessage: string;
           
            if (e && e.message) {
                // Lấy thông báo lỗi chính (thường là lỗi từ handleResponse của api.ts)
                errorMessage = e.message;
            } else if (typeof e === 'object' && e !== null) {
                // Nếu lỗi là đối tượng JSON (chứa chi tiết lỗi validation)
                errorMessage = JSON.stringify(e, null, 2);
            } else {
                errorMessage = String(e);
            }


            console.error("API Error Detail:", errorMessage);
            alert(`Lỗi khởi tạo hội thoại: ${errorMessage}`);
        } finally {
            setChatLoading(false);
        }
    };
   
    // 🚨 Logic Tự động khởi động từ Query Params (Chặn chạy lại bằng Ref)
    useEffect(() => {
        fetchHistory();
        if (window.innerWidth < 1024) setIsSidebarOpen(false);


        const urlMode = searchParams.get('mode');
        const urlLevel = searchParams.get('level');
        const urlTopic = searchParams.get('topic');
        const urlLessonId = searchParams.get('lesson_id'); // string | null


       
        // Chặn nếu Ref đã đánh dấu là đã khởi tạo, bất kể state nào
        if (initialStartRef.current) return;


        // Kiểm tra đủ 3 tham số
        if (urlMode === 'free' && urlTopic && urlLevel) {
           
            // 🚨 ĐÁNH DẤU REF: Đã cố gắng khởi tạo
            initialStartRef.current = true;
           
            const decodedTopic = decodeURIComponent(urlTopic);
            const decodedLevel = urlLevel;
           
            setChatLoading(true);


            // Xóa Query Params NGAY LẬP TỨC để ngăn chặn re-render kép từ Router
            router.replace('/conversation');
           
            // 🚨 FIX LỖI TYPESCRIPT: Chuyển đổi null từ searchParams thành undefined
            const lessonIdToPass = urlLessonId ?? undefined;


            // Gọi handleStart với tham số trực tiếp
            handleStart(null, decodedTopic, decodedLevel, lessonIdToPass);
        }
    }, [searchParams]);


    // ================= AUTO START FROM URL =================
    useEffect(() => {
        if (!hasToken || initialStartRef.current) return;


        const m = searchParams.get("mode");
        const l = searchParams.get("level");
        const t = searchParams.get("topic");


        if (m === "free" && l && t) {
            initialStartRef.current = true;
            handleStart(null, decodeURIComponent(t), l);
            router.replace("/conversation");
        }
    }, [hasToken, searchParams, handleStart, router]);


    // ================= LOGIN GUARD (ONLY ONE) =================
    if (checkingLogin || hasToken === null) {
        return (
            <div className="h-screen flex items-center justify-center text-slate-600">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
                Checking authentication...
            </div>
        );
    }


    if (!hasToken) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white text-center">
                <LogIn size={48} className="text-blue-600 mb-4" />
                <h1 className="text-2xl font-bold mb-2">
                    Login required
                </h1>
                <button
                    onClick={() => router.push("/auth")}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold"
                >
                    Login to start
                </button>
            </div>
        );
    }


    const resetConversation = () => {
        setIsViewingHistory(false);
        setMessages([]);
        setSuggestions([]);
        setConversationStarted(false);
        setCurrentTurn(2);
        setIsScenarioComplete(false);
        setPendingStep(null);
        setView("topics");
        setSelectedTopic(null);
        setActiveScenario(null);
        setScenarios([]);
        setInput("");
        setSessionId(null);
       
        initialStartRef.current = false;
    };


    // --- Hàm Send/Voice Messages (đã chuyển lên) ---


    const handleSend = async () => {
        if (isViewingHistory || chatLoading || isInputDisabled || mode === "scenario") return;
       
        const topic = selectedTopic || activeScenario?.title;
        if (!input.trim() || !topic || !sessionId) return;


        const userMessage: DisplayMessage = { role: "user", text: input.trim() };
        const newHistory = [...messages, userMessage];
        setMessages(newHistory);
        setInput("");
        setChatLoading(true);


        try {
            const res = await api.sendFreeTalkMessage(userMessage.text, newHistory, topic, level, sessionId);
            const feedbackText = res.feedback ?? "";
            const replyText = res.reply ?? "";
            const metadata = res.metadata ?? undefined;


            const newMsgs: DisplayMessage[] = [
                ...(feedbackText ? [{ role: "ai" as const, text: feedbackText, type: "feedback" as const, metadata }] : []),
                ...(replyText ? [{ role: "ai" as const, text: replyText, type: "reply" as const }] : []),
            ];


            setMessages((p) => [...p, ...newMsgs]);
            if (replyText) speak(replyText);
        } catch (e) {
            setMessages((p) => [...p, { role: "ai", text: `Error: ${String(e)}` }]);
        } finally {
            setChatLoading(false);
        }
    };


    const handleVoiceMessage = async (audioBlob: Blob, audioUrl: string) => {
        if (isViewingHistory || chatLoading || isInputDisabled) return;
        const topic = selectedTopic || activeScenario?.title;
        if (!topic || !sessionId) return;


        setChatLoading(true);
        setSuggestions([]);


        const userAudioMsg: DisplayMessage = {
            role: "user",
            text: "",
            type: "audio_input",
            audioUrl: audioUrl,
        };
        setMessages((prev) => [...prev, userAudioMsg]);


        try {
            let transcribedText = "";
            let newAiMessages: DisplayMessage[] = [];


            if (mode === "scenario" && activeScenario) {
                const res = await api.sendAndEvaluateVoice(audioBlob, activeScenario.id, level, currentTurn, sessionId);
                transcribedText = res.transcribed_text ?? "(Audio)";
                const feedback = res.immediate_feedback ?? "";
                const nextReply = res.next_ai_reply ?? "";
                const metadata = res.metadata ?? undefined;
                const nextSuggestion = res.next_user_suggestion ?? null;


                newAiMessages.push({ role: "ai", text: feedback, type: "feedback", metadata });


                if (res.is_complete) {
                    setIsScenarioComplete(true);
                    newAiMessages.push({ role: "ai", text: nextReply, type: "reply" });
                } else {
                    setPendingStep({
                        aiReply: { role: "ai", text: nextReply, type: "reply" },
                        nextSuggestion,
                    });
                }


            } else if (mode === "free" && topic) {
                const contextHistory = messages;
                const res = await api.sendFreeTalkVoice(audioBlob, contextHistory, topic, level, sessionId);
                transcribedText = res.transcribed_text ?? "(Audio)";
                const feedback = res.feedback ?? "";
                const reply = res.reply ?? "";
                const metadata = res.metadata ?? undefined;


                newAiMessages.push({ role: "ai", text: feedback, type: "feedback", metadata });
                newAiMessages.push({ role: "ai", text: reply, type: "reply" });
                if (reply) speak(reply);
            }


            setMessages((prevMessages) => {
                const updatedMessages = [...prevMessages];
                const lastUserIndex = updatedMessages.length - 1;
                if (updatedMessages[lastUserIndex].role === 'user' && updatedMessages[lastUserIndex].type === 'audio_input') {
                    updatedMessages[lastUserIndex] = { ...updatedMessages[lastUserIndex], text: transcribedText, type: 'user_input' };
                }
                return [...updatedMessages, ...newAiMessages];
            });


        } catch (e) {
            setMessages((p) => [...p, { role: "ai", text: `Error processing audio: ${String(e)}` }]);
        } finally {
            setChatLoading(false);
        }
    };
   
    // --- ACTIONS (đã chuyển lên) ---
    const handleLevelChange = (newLevel: string) => setLevel(newLevel);
   
    const handleModeChange = (newMode: "scenario" | "free") => {
        setMode(newMode);
        setView("topics");
        setSelectedTopic(null);
        setActiveScenario(null);
        setScenarios([]);
    };


    const handleTopicSelect = async (topic: string) => {
        if (!hasToken) {
            alert("Please log in to start.");
            return;
        }
       
        setSelectedTopic(topic);
        if (mode === "scenario") {
            setChatLoading(true);
            try {
                const fetchedScenarios = await api.getScenarios(topic, level);
                if (fetchedScenarios.length > 0) {
                    setScenarios(fetchedScenarios);
                    setView("scenarios");
                } else {
                    alert(`No scenarios found for "${topic}" at this level.`);
                    setSelectedTopic(null);
                }
            } catch (e) {
                alert(String(e));
            } finally {
                setChatLoading(false);
            }
        } else {
            handleStart(null, topic, level, "free");
        }
    };


    const handleBackToTopics = () => {
        setView("topics");
        setSelectedTopic(null);
        setScenarios([]);
    };


    const handleLoadSession = async (selectedSessionId: string) => {
        if (!hasToken) return;


        setIsViewingHistory(true);
        if (chatLoading || sessionId === selectedSessionId) return;
        setChatLoading(true);
        try {
            const details = await api.getConversationDetails(selectedSessionId);
            setSessionId(selectedSessionId);
            const normalized: DisplayMessage[] = (details.messages ?? []).map((m: any) => ({
                role: m.role as "user" | "ai",
                text: (m.text ?? "") as string,
                type: (m.type as any) === 'user_input' ? 'user_input' : (m.type as any) ?? undefined,
                audioUrl: (m.audioUrl as string) ?? undefined,
                metadata: (m.metadata as any) ?? undefined,
            }));
            setMessages(normalized);
            setMode(details.mode as "scenario" | "free");
            setLevel(details.level);
            setSelectedTopic(details.topic);
            setConversationStarted(true);
            setView("topics");
            setIsScenarioComplete(false);
            setPendingStep(null);
            setInput("");
            setSuggestions([]);
            setActiveScenario(details.scenario as Scenario || null);
            if (window.innerWidth < 1024) setIsSidebarOpen(false);
        } catch (e) {
            alert(String(e));
        } finally {
            setChatLoading(false);
        }
    };


    const handlePracticeAgain = () => {
        if (chatLoading) return;
        const topic = selectedTopic;
        const currentMode = mode;
        const currentScenario = activeScenario;
        const currentLevel = level;


        // Reset state
        setMessages([]);
        setSuggestions([]);
        setConversationStarted(false);
        setCurrentTurn(2);
        setIsScenarioComplete(false);
        setPendingStep(null);
        setSessionId(null);
        setIsViewingHistory(false);


        if (currentMode === "scenario") {
            if (currentScenario) {
                handleStart(currentScenario, currentScenario.title, currentLevel, "scenario");
            } else if (topic) {
                handleTopicSelect(topic);
            } else {
                 resetConversation();
            }
        } else {
            if (topic) {
                handleStart(null, topic, currentLevel, "free");
            } else {
                resetConversation();
            }
        }
    };


    const handleContinueScenario = () => {
        if (isViewingHistory || !pendingStep) return;
        const safeAiReply: DisplayMessage = {
            role: "ai",
            text: pendingStep.aiReply.text ?? "",
            type: pendingStep.aiReply.type,
            metadata: pendingStep.aiReply.metadata,
        };
        setMessages((p) => [...p, safeAiReply]);
        if (safeAiReply.text) speak(safeAiReply.text);
        if (pendingStep.nextSuggestion) setSuggestions([pendingStep.nextSuggestion]);
        setCurrentTurn((p) => p + 2);
        setPendingStep(null);
    };


    const handleGetFinalFeedback = async () => {
        if (isViewingHistory || messages.some(m => m.type === 'summary')) return;
        const topic = selectedTopic || activeScenario?.title;
        if (!topic || !sessionId) return;


        setChatLoading(true);
        setIsAnalyzing(true);


        try {
            const res = await api.getConversationSummary(messages, level, topic, sessionId);
            const summaryText = res.summary_text ?? "";
            setMessages((p) => [...p, { role: "ai", text: summaryText, type: "summary", metadata: res.summary_metadata }]);
            setIsScenarioComplete(false);


            if (mode === "free") {
                try {
                    await analyzeConversationSession(sessionId);
                } catch (analysisError) {
                    console.error("Error analyzing vocab:", analysisError);
                }
            }
        } catch (e) {
            alert(String(e));
        } finally {
            setChatLoading(false);
            setIsAnalyzing(false);
        }
    };


    const handleDeleteSession = async (sessionIdToDelete: string, sessionTopic: string) => {
        if (deletingId) return;
        const confirmed = window.confirm(`Delete conversation "${sessionTopic}"?`);
        if (confirmed) {
            setDeletingId(sessionIdToDelete);
            try {
                await api.deleteConversation(sessionIdToDelete);
                setSessions((prev) => prev.filter((s) => s.id !== sessionIdToDelete));
                if (sessionId === sessionIdToDelete) resetConversation();
            } catch (error) {
                alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
            } finally {
                setDeletingId(null);
            }
        }
    };
   
    // Tự động vô hiệu hóa input khi không phải trạng thái chat
    const isInputDisabled = isViewingHistory || !!pendingStep || isScenarioComplete || !!messages.find(m => m.type === 'summary');


    // ======================================================
    // 🥈 BƯỚC 2: RENDER CÓ ĐIỀU KIỆN (LOGIN GUARD)
    // ======================================================
   
    // Đã được xử lý ở đầu component sau khi khai báo tất cả Hooks (Khối 1)
    if (checkingLogin || hasToken === null) {
        return (
            <div className="h-screen flex items-center justify-center text-slate-600">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
                Checking authentication...
            </div>
        );
    }


    if (!hasToken) {
        return (
            <div className="h-screen flex flex-col items-center justify-center px-6 text-center bg-gray-50 dark:bg-gray-900">
                <div className="mb-6">
                    <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg">
                        <LogIn size={32} />
                    </div>
                </div>


                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                    Welcome to Smart Conversation
                </h1>


                <p className="text-gray-600 dark:text-gray-300 max-w-md mb-8">
                    You need to be logged in to start chatting.
                </p>


                <button
                    onClick={() => router.push("/auth")}
                    className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 flex items-center gap-2"
                >
                    <LogIn size={20} /> Login to Start
                </button>
            </div>
        );
    }


    // ======================================================
    // 🥉 BƯỚC 3: RENDER ỨNG DỤNG CHÍNH
    // ======================================================
    return (
        <div className="h-screen w-full flex bg-[#F0F4F8] text-slate-800 font-sans overflow-hidden">
           
            {/* 1. SIDEBAR with Toggle Logic */}
            <HistorySidebar
                sessions={sessions}
                loading={historyLoading}
                deletingId={deletingId}
                onSessionSelect={handleLoadSession}
                activeSessionId={sessionId}
                onNewConversation={resetConversation}
                onDelete={handleDeleteSession}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />


            {/* 2. MAIN CONTENT (Push content when sidebar open) */}
            <main className={`flex-1 flex flex-col relative h-full min-w-0 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'lg:ml-80' : 'ml-0'}`}>
               
                {/* Toggle Sidebar Button (Top Left) */}
                {!isSidebarOpen && (
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="absolute top-6 left-6 z-50 p-2.5 bg-white border border-slate-200 rounded-xl shadow-md text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-all group"
                        title="Open History"
                    >
                        <PanelLeftOpen size={20} className="group-hover:scale-110 transition-transform" />
                    </button>
                )}


                {/* 🚨 RENDER LOBBY / CHAT: Hiển thị Loading khi tự động khởi tạo */}
                {!conversationStarted ? (
                    chatLoading ? (
                        // LOADING: Hiển thị khi đang tự động khởi tạo
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                            <p className="mt-4 text-lg text-slate-600">Starting {mode === 'free' ? 'Free Talk' : 'Scenario'} session on **{selectedTopic || '...'}**...</p>
                        </div>
                    ) : (
                        // =========================
                        // LOBBY (Clean & Simple)
                        // =========================
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <div className="max-w-5xl mx-auto w-full px-6 py-12 md:px-12">
                               
                                <div className="mb-10 text-center lg:text-left">
                                    <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
                                        Start Conversation
                                    </h1>
                                    <p className="text-slate-500 text-lg">
                                        Customize your learning session.
                                    </p>
                                </div>


                                {/* Controls Panel */}
                                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 mb-8 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-4">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Mode</label>
                                            <ModeSelector mode={mode} onModeChange={handleModeChange} />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Level</label>
                                            <LevelSelector level={level} onLevelChange={handleLevelChange} />
                                        </div>
                                    </div>
                                </div>


                                {/* Selection Area */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-bold text-slate-800">
                                            {view === 'topics' ? "Select Topic" : "Select Scenario"}
                                        </h2>
                                       
                                        {view === 'scenarios' && (
                                            <button
                                                onClick={handleBackToTopics}
                                                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition-colors flex items-center gap-2"
                                            >
                                                <ArrowLeft size={16} /> Back
                                            </button>
                                        )}
                                    </div>


                                    {view === "topics" ? (
                                        <TopicSelector
                                            topic={selectedTopic}
                                            onTopicChange={handleTopicSelect}
                                            mode={mode}
                                        />
                                    ) : (
                                        // Scenario List - Simple Cards
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {chatLoading ? (
                                                <div className="col-span-full py-16 text-center text-slate-400">
                                                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
                                                    <p>Loading scenarios...</p>
                                                </div>
                                            ) : scenarios.length === 0 ? (
                                                <div className="col-span-full py-16 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                                    No scenarios found.
                                                </div>
                                            ) : (
                                                scenarios.map((s) => (
                                                    <button
                                                        key={s.id}
                                                        onClick={() => handleStart(s, s.title, level, "scenario")}
                                                        className="group text-left p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all duration-200"
                                                    >
                                                        <h3 className="font-bold text-lg text-slate-800 group-hover:text-blue-700 transition-colors mb-2">
                                                            {s.title}
                                                        </h3>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-1 rounded">
                                                                {level}
                                                            </span>
                                                            <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-2 py-1 rounded uppercase">
                                                                Scenario
                                                            </span>
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                ) : (
               
                    // =========================
                    // CHAT INTERFACE
                    // =========================
<div className="flex-1 flex flex-col h-full bg-[#FAFBFC] relative">
    {/* Header */}
    <header className="h-16 bg-white border-b border-slate-100 px-6 flex items-center justify-between z-20 flex-shrink-0">
        <div className="flex items-center gap-4">
            {!isSidebarOpen && (
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                >
                    <Menu size={20} />
                </button>
            )}


            <div>
                <h4 className="font-bold text-lg text-slate-800 leading-none">
                    {activeScenario?.title || selectedTopic || "Conversation"}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                        {mode}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                        {level}
                    </span>
                </div>
            </div>
        </div>


        <button
            onClick={resetConversation}
            className="px-4 py-2 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg text-sm font-medium transition-colors"
        >
            Exit
        </button>
    </header>


    {/* Chat Area */}
    <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth">
        <div className="max-w-3xl mx-auto w-full h-full pb-32">
            <ChatArea
                messages={messages}
                loading={chatLoading}
                onSpeak={speak}
            />
        </div>
    </div>


    {/* Input Area */}
    <div className="absolute bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 pb-6 pt-4 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
        <div className="max-w-3xl mx-auto w-full">


            {/* Suggestions / Actions */}
            {(isViewingHistory ||
                pendingStep ||
                isScenarioComplete ||
                (mode === "scenario" && suggestions.length > 0) ||
                (mode === "free" && !isScenarioComplete)) && (
                <div className="mb-4">


                    {/* Suggestion */}
                    {mode === "scenario" &&
                        !isScenarioComplete &&
                        !pendingStep &&
                        suggestions.length > 0 &&
                        !isViewingHistory && (
                            <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 pl-1">
                                    Suggestion
                                </p>
                                <div className="space-y-2">
                                    {suggestions.map((sug, idx) => (
                                        <DialogueLine
                                            key={idx}
                                            text={sug}
                                            speaker="user"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}


                    {/* Action Buttons */}
                    <div className="flex justify-center gap-3">
                        {isViewingHistory ? (
                            <button
                                onClick={handlePracticeAgain}
                                disabled={chatLoading}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-bold shadow-md transition"
                            >
                                <RefreshCw size={18} /> Practice Again
                            </button>
                        ) : (
                            <>
                                {pendingStep && (
                                    <button
                                        onClick={handleContinueScenario}
                                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-full font-bold shadow-md transition"
                                    >
                                        <PlayCircle size={18} /> Continue
                                    </button>
                                )}


                                {(isScenarioComplete ||
                                    (mode === "free" && !isScenarioComplete)) && (
                                    <button
                                        onClick={handleGetFinalFeedback}
                                        disabled={chatLoading || isAnalyzing}
                                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-full font-bold shadow-md transition disabled:opacity-50"
                                    >
                                        {isAnalyzing ? (
                                            <Loader2
                                                size={18}
                                                className="animate-spin"
                                            />
                                        ) : (
                                            <Award size={18} />
                                        )}
                                        {isAnalyzing
                                            ? "Analyzing..."
                                            : "Finish Session"}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}


            <ChatInput
                mode={mode}
                input={input}
                onInputChange={setInput}
                onSend={handleSend}
                loading={chatLoading || !!pendingStep}
                disabled={chatLoading || !!pendingStep || isAnalyzing}
                onVoiceMessage={handleVoiceMessage}
            />
        </div>
    </div>
</div>
                )}
            </main>
        </div>
    );
};


export default ConversationPage;
