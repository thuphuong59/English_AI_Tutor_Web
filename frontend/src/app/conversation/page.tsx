    "use client";
    import { useState, FC, useEffect, useRef, useCallback } from "react";
    import { Award, PlayCircle, ArrowLeft, RefreshCw, Loader2, Menu, PanelLeftOpen, LogIn, ChevronRight, Sparkles, MessageCircle } from "lucide-react";
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
        const router = useRouter();
        const searchParams = useSearchParams();
        const initialStartRef = useRef(false);

        const [hasToken, setHasToken] = useState<boolean | null>(null);
        const [checkingLogin, setCheckingLogin] = useState(true);

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

        const speak = (text: string) => {
            if (!("speechSynthesis" in window)) return;
            speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = "en-US";
            speechSynthesis.speak(u);
        };

        useEffect(() => {
            const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
            setHasToken(!!token);
            setCheckingLogin(false);
        }, []);

        const fetchHistory = useCallback(async () => {
            setHistoryLoading(true);
            try {
                setSessions(await api.getHistoryList());
            } finally {
                setHistoryLoading(false);
            }
        }, []);

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

            const finalMode = scenario ? "scenario" : "free";

            try {
                const res = await api.startConversation(
                    finalMode,
                    currentLevel,
                    scenario?.id || undefined,
                    currentTopic,
                    lessonIdFromUrl
                );
                
                setSessionId(res.session_id ?? null);
                if (scenario) setActiveScenario(scenario);
                
                setMode(finalMode);
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
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
            } catch (e: any) {
                alert(`Lỗi khởi tạo: ${e.message || String(e)}`);
            } finally {
                setChatLoading(false);
            }
        };

        const handleSend = async () => {
            if (isViewingHistory || chatLoading || isInputDisabled || mode === "scenario") return;
            const topic = selectedTopic || activeScenario?.title;
            if (!input.trim() || !topic || !sessionId) return;

            const userMsg: DisplayMessage = { role: "user", text: input.trim() };
            setMessages(prev => [...prev, userMsg]);
            setInput("");
            setChatLoading(true);

            try {
                const res = await api.sendFreeTalkMessage(userMsg.text, [...messages, userMsg], topic, level, sessionId);
                const newMsgs: DisplayMessage[] = [];
                if (res.feedback) newMsgs.push({ role: "ai", text: res.feedback, type: "feedback", metadata: res.metadata });
                if (res.reply) newMsgs.push({ role: "ai", text: res.reply, type: "reply" });
                
                setMessages(p => [...p, ...newMsgs]);
                if (res.reply) speak(res.reply);
            } catch (e) {
                setMessages(p => [...p, { role: "ai", text: `Error: ${String(e)}` }]);
            } finally {
                setChatLoading(false);
            }
        };

        const handleVoiceMessage = async (blob: Blob, audioUrl: string) => {
            if (isViewingHistory || chatLoading || isInputDisabled) return;
            const topic = selectedTopic || activeScenario?.title;
            if (!topic || !sessionId) return;

            setChatLoading(true);
            setSuggestions([]);
            setMessages(p => [...p, { role: "user", text: "", type: "audio_input", audioUrl: audioUrl }]);

            try {
                let transcribedText = "";
                let newAiMessages: DisplayMessage[] = [];

                if (mode === "scenario" && activeScenario) {
                    const res = await api.sendAndEvaluateVoice(blob, activeScenario.id, level, currentTurn, sessionId);
                    transcribedText = res.transcribed_text ?? "(Audio)";
                    newAiMessages.push({ role: "ai", text: res.immediate_feedback ?? "", type: "feedback", metadata: res.metadata });
                    if (res.is_complete) {
                        setIsScenarioComplete(true);
                        newAiMessages.push({ role: "ai", text: res.next_ai_reply ?? "", type: "reply" });
                    } else {
                        setPendingStep({ aiReply: { role: "ai", text: res.next_ai_reply, type: "reply" }, nextSuggestion: res.next_user_suggestion });
                    }
                } else if (mode === "free") {
                    const res = await api.sendFreeTalkVoice(blob, messages, topic, level, sessionId);
                    transcribedText = res.transcribed_text ?? "(Audio)";
                    newAiMessages.push({ role: "ai", text: res.feedback ?? "", type: "feedback", metadata: res.metadata });
                    newAiMessages.push({ role: "ai", text: res.reply ?? "", type: "reply" });
                    if (res.reply) speak(res.reply);
                }

                setMessages(prev => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last.role === 'user' && last.type === 'audio_input') last.text = transcribedText;
                    return [...updated, ...newAiMessages];
                });
            } catch (e) {
                setMessages(p => [...p, { role: "ai", text: `Error processing audio: ${String(e)}` }]);
            } finally {
                setChatLoading(false);
            }
        };

        useEffect(() => {
            fetchHistory();
            if (window.innerWidth < 1024) setIsSidebarOpen(false);
            const m = searchParams.get('mode');
            const l = searchParams.get('level');
            const t = searchParams.get('topic');
            const lid = searchParams.get('lesson_id'); 
            if (initialStartRef.current) return;
            if (m === 'free' && t && l) {
                initialStartRef.current = true;
                router.replace('/conversation');
                handleStart(null, decodeURIComponent(t), l, lid ?? undefined);
            }
        }, [searchParams]);

        if (checkingLogin || hasToken === null) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600"/></div>;
        
        if (!hasToken) return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-center px-4">
                <LogIn className="text-blue-600 mb-4" size={48} />
                <h1 className="text-xl font-bold mb-4">Login Required</h1>
                <button onClick={() => router.push("/auth")} className="px-6 py-2 bg-blue-600 text-white rounded-xl">Sign In</button>
            </div>
        );

        const resetConversation = () => {
            setIsViewingHistory(false); setMessages([]); setSuggestions([]); setConversationStarted(false);
            setCurrentTurn(2); setIsScenarioComplete(false); setPendingStep(null); setView("topics");
            setSelectedTopic(null); setActiveScenario(null); setScenarios([]); setInput(""); setSessionId(null);
            initialStartRef.current = false;
        };

        const handleLevelChange = (v: string) => setLevel(v);
        
        const handleModeChange = (newMode: "scenario" | "free") => {
            setMode(newMode);
            setView("topics");
            setSelectedTopic(null);
            setScenarios([]);
            setActiveScenario(null);
        };

        const handleTopicSelect = async (topic: string) => {
            setSelectedTopic(topic);
            if (mode === "scenario") {
                setChatLoading(true);
                try {
                    const res = await api.getScenarios(topic, level);
                    if (res.length > 0) {
                        setScenarios(res);
                        setView("scenarios");
                    } else {
                        alert(`Không tìm thấy kịch bản cho chủ đề "${topic}"`);
                        setSelectedTopic(null);
                    }
                } catch (e) {
                    alert("Lỗi tải kịch bản");
                } finally {
                    setChatLoading(false);
                }
            } else {
                handleStart(null, topic, level);
            }
        };

        const handleBackToTopics = () => { setView("topics"); setSelectedTopic(null); setScenarios([]); };

        const handleLoadSession = async (sid: string) => {
            if (!hasToken || chatLoading || sessionId === sid) return;
            setIsViewingHistory(true); setChatLoading(true);
            try {
                const d = await api.getConversationDetails(sid);
                setSessionId(sid);
                setMessages((d.messages ?? []).map((m: any) => ({
                    role: m.role, text: m.text ?? "", type: m.type, audioUrl: m.audioUrl, metadata: m.metadata
                })));
                setMode(d.mode as "scenario" | "free"); 
                setLevel(d.level); setSelectedTopic(d.topic);
                setConversationStarted(true); setView("topics"); setIsScenarioComplete(false);
                setPendingStep(null); setInput(""); setSuggestions([]); setActiveScenario(d.scenario || null);
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
            } catch (e) { alert(String(e)); } 
            finally { setChatLoading(false); }
        };

        const handlePracticeAgain = () => {
            if (chatLoading) return;
            const currentMode = mode;
            const currentScenario = activeScenario;
            const currentTopic = selectedTopic;
            const currentLevel = level;
            resetConversation();
            if (currentMode === "scenario" && currentScenario) {
                handleStart(currentScenario, currentScenario.title, currentLevel);
            } else if (currentTopic) {
                handleStart(null, currentTopic, currentLevel);
            }
        };

        const handleContinueScenario = () => {
            if (!pendingStep) return;
            setMessages(p => [...p, { ...pendingStep.aiReply }]);
            if (pendingStep.aiReply.text) speak(pendingStep.aiReply.text);
            if (pendingStep.nextSuggestion) setSuggestions([pendingStep.nextSuggestion]);
            setCurrentTurn(p => p + 2);
            setPendingStep(null);
        };

        const handleGetFinalFeedback = async () => {
            if (chatLoading || isAnalyzing || !selectedTopic || !sessionId) return;
            if (messages.some(m => m.type === 'summary')) return;

            setChatLoading(true); setIsAnalyzing(true);
            try {
                const res = await api.getConversationSummary(messages, level, selectedTopic, sessionId);
                setMessages(p => [...p, { role: "ai", text: res.summary_text, type: "summary", metadata: res.summary_metadata }]);
                setIsScenarioComplete(true);
                if (mode === "free") await analyzeConversationSession(sessionId);
            } catch (e) { alert("Lỗi tổng kết"); }
            finally { setChatLoading(false); setIsAnalyzing(false); }
        };

        const handleDeleteSession = async (sid: string) => {
            if (!confirm("Do you want to delete this conversation?")) return;
            setDeletingId(sid);
            try {
                await api.deleteConversation(sid);
                setSessions(p => p.filter(s => s.id !== sid));
                if (sessionId === sid) resetConversation();
            } finally { setDeletingId(null); }
        };

        const isInputDisabled = isViewingHistory || !!pendingStep || messages.some(m => m.type === 'summary');

        return (
            <div className="h-screen w-full flex bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden">
                <HistorySidebar 
                    sessions={sessions} loading={historyLoading} deletingId={deletingId} 
                    onSessionSelect={handleLoadSession} activeSessionId={sessionId} 
                    onNewConversation={resetConversation} onDelete={handleDeleteSession} 
                    isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} 
                />
                <main className={`flex-1 flex flex-col relative h-full min-w-0 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'lg:ml-80' : 'ml-0'}`}>
                    {!isSidebarOpen && <button onClick={() => setIsSidebarOpen(true)} className="absolute top-4 left-4 z-50 p-2 bg-white/90 border border-slate-200 rounded-xl shadow-sm"><PanelLeftOpen size={20}/></button>}
                    {!conversationStarted ? (
                        <div className="flex-1 overflow-y-auto bg-[#F8FAFC] px-6 py-10">
                            {chatLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                            <p className="mt-4 text-lg text-slate-600">Starting {mode === 'free' ? 'Free Talk' : 'Scenario'} session on **{selectedTopic || '...'}**...</p>
                        </div>
                            ) : (
                                <div className="max-w-6xl mx-auto space-y-10">
                                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight text-center lg:text-left">Start Conversation</h1>
                                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200/60 grid md:grid-cols-2 gap-10">
                                        <div className="space-y-4"><label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Learning Mode</label><ModeSelector mode={mode} onModeChange={handleModeChange} /></div>
                                        <div className="space-y-4"><label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Proficiency Level</label><LevelSelector level={level} onLevelChange={handleLevelChange} /></div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-xl font-bold flex items-center gap-2">{view === 'topics' ? <><MessageCircle className="text-blue-500" size={20}/> Select Topic</> : <><PlayCircle className="text-blue-500" size={20}/> Select Scenario</>}</h2>
                                            {view === 'scenarios' && <button onClick={handleBackToTopics} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:text-blue-600 transition-all"><ArrowLeft size={16}/> Back</button>}
                                        </div>
                                        {view === "topics" ? (
                                            <TopicSelector topic={selectedTopic} onTopicChange={handleTopicSelect} mode={mode} />
                                        ) : (
                                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                                                {scenarios.map(s => (
                                                    <button key={s.id} onClick={() => handleStart(s, s.title, level)} className="group text-left p-6 bg-white border border-slate-200 rounded-2xl hover:border-blue-400 hover:shadow-lg transition-all duration-300 flex flex-col h-full"><div className="mb-4 flex items-start justify-between"><div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform"><PlayCircle size={24}/></div><ChevronRight className="text-slate-300 group-hover:text-blue-500" size={20} /></div><h3 className="font-bold text-lg text-slate-800 group-hover:text-blue-700 transition-colors mb-auto">{s.title}</h3><div className="mt-4 pt-4 border-t border-slate-100 flex gap-2"><span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded">{level}</span><span className="text-xs font-semibold bg-blue-50 text-blue-600 px-2 py-1 rounded uppercase tracking-wide">Scenario</span></div></button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col h-full bg-[#FAFBFC] relative overflow-hidden">
                            <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 flex items-center justify-between z-20 sticky top-0 flex-shrink-0">
                                <div className="flex items-center gap-4">
                                    {!isSidebarOpen && <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><Menu size={20}/></button>}
                                    <div><h4 className="font-bold text-lg text-slate-800 leading-none truncate max-w-[200px] md:max-w-md">{activeScenario?.title || selectedTopic || "Conversation"}</h4><div className="flex items-center gap-2 mt-1.5"><span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{mode}</span><span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{level}</span></div></div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={resetConversation} className="px-4 py-2 bg-white border border-slate-200 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg text-sm font-medium transition-all shadow-sm">Exit</button>
                                </div>
                            </header>
                            <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth bg-gradient-to-b from-[#FAFBFC] to-white"><div className="max-w-4xl mx-auto w-full h-full pb-4"><ChatArea messages={messages} loading={chatLoading} onSpeak={speak} /></div></div>
                            <div className="flex-shrink-0 bg-white/95 backdrop-blur-md border-t border-slate-200 pt-3 pb-6 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-30">
                                <div className="max-w-3xl mx-auto w-full">
                                    {mode === "scenario" && !isScenarioComplete && !pendingStep && suggestions.length > 0 && !isViewingHistory && (
                                        <div className="mb-3 animate-in slide-in-from-bottom-2 fade-in duration-300"><div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 shadow-sm flex flex-col gap-1.5 max-w-2xl mx-auto"><p className="text-[10px] font-bold text-blue-400 uppercase tracking-wide flex items-center gap-1.5"><Sparkles size={12}/> Suggested Response</p><div className="space-y-1 text-sm text-slate-700 italic">{suggestions.map((sug, idx) => <DialogueLine key={idx} text={sug} speaker="user" />)}</div></div></div>
                                    )}
                                    {isViewingHistory ? (
                                        <div className="flex justify-center mb-4 animate-in slide-in-from-bottom-2">
                                            <button onClick={handlePracticeAgain} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-bold shadow-lg transition-all transform hover:-translate-y-0.5"><RefreshCw size={20}/> Practice Again</button>
                                        </div>
                                    ) : (
                                        <>
                                            {pendingStep && (
                                                <div className="flex justify-center mb-4 animate-in slide-in-from-bottom-2">
                                                    <button onClick={handleContinueScenario} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-full font-bold shadow-lg transition-all transform hover:-translate-y-0.5"><PlayCircle size={20}/> Continue</button>
                                                </div>
                                            )}
                                            {!(isInputDisabled) && (
                                                <ChatInput 
                                                    mode={mode} 
                                                    input={input} 
                                                    onInputChange={setInput} 
                                                    onSend={handleSend} 
                                                    onFinish={handleGetFinalFeedback} 
                                                    loading={chatLoading || isAnalyzing} 
                                                    disabled={chatLoading || isAnalyzing} 
                                                    onVoiceMessage={handleVoiceMessage} 
                                                />
                                            )}
                                            {messages.some(m => m.type === 'summary') && (
                                                <div className="text-center py-2 animate-in fade-in">
                                                    <p className="text-slate-400 text-sm font-medium flex items-center justify-center gap-2"><Award size={16} className="text-amber-500" /> Session completed. Feedback generated.</p>
                                                    <button onClick={resetConversation} className="mt-3 text-blue-600 text-sm font-bold hover:underline">Start a new practice</button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        );
    };

    export default ConversationPage;