"use client";
import { useState, useEffect } from "react";
import { MessageCircle, Mic, Brain, Sparkles, TrendingUp, Clock, ShieldCheck, Zap, Star, Activity, ArrowRight, Layers, Target, BarChart3 } from "lucide-react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";

export default function HomePage() {
  // Animation state for the chat demo
  // 0: AI asks, 1: User answers, 2: AI Corrects + Scores
  const [activeMessage, setActiveMessage] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [notifMessage, setNotifMessage] = useState<string | null>(null);
  const [notifType, setNotifType] = useState<string | null>(null);
  useEffect(() => {
    console.log("🔥 HomePage mounted");
    let confettiInterval: any = null;
    const timer = setTimeout(() => {
      const msg = localStorage.getItem("loginMessage");
      const type = localStorage.getItem("loginMessageType");
      if (msg) {
        setNotifMessage(msg);
        setNotifType(type);
        setShowNotification(true);

        if (type === "success") {
          const duration = 3000;
          const animationEnd = Date.now() + duration;
          const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

          const randomInRange = (min: number, max: number) =>
            Math.random() * (max - min) + min;

          confettiInterval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) {
              clearInterval(confettiInterval);
              return;
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({
              ...defaults,
              particleCount,
              origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            });
            confetti({
              ...defaults,
              particleCount,
              origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            });
          }, 250);
        }

        localStorage.removeItem("loginMessage");
        localStorage.removeItem("loginMessageType");
      }
    }, 500);

    const chatInterval = setInterval(() => {
      setActiveMessage((prev) => (prev + 1) % 3);
    }, 4000);

    return () => {
      if (confettiInterval) clearInterval(confettiInterval);
      clearInterval(chatInterval);
    };
  }, []);

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-[#F9F4EF] via-[#F4FFFB] to-[#E6ECFF] overflow-x-hidden">
      <AnimatePresence>
        {showNotification && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 50, rotate: -2 }} 
              animate={{ scale: 1, y: 0, rotate: 0 }}
              className="relative bg-white/90 backdrop-blur-xl rounded-[3rem] shadow-[0_32px_64px_-15px_rgba(0,0,0,0.3)] overflow-hidden max-w-sm w-full border border-white"
            >
              {/* Họa tiết trang trí nền */}
              <div className={`absolute -top-24 -left-24 w-64 h-64 rounded-full opacity-20 blur-3xl ${notifType === 'success' ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
              <div className={`absolute -bottom-24 -right-24 w-64 h-64 rounded-full opacity-20 blur-3xl ${notifType === 'success' ? 'bg-blue-400' : 'bg-amber-400'}`}></div>
              
              <div className="p-10 text-center relative z-10">
                {/* Badge Icon Container */}
                <div className="relative mb-8 flex justify-center">
                  <div className={`w-28 h-28 rounded-[2.5rem] rotate-12 flex items-center justify-center shadow-2xl transition-transform hover:rotate-0 duration-500 ${notifType === 'success' ? 'bg-gradient-to-tr from-emerald-500 to-teal-400' : 'bg-gradient-to-tr from-rose-500 to-orange-400'}`}>
                      <div className="-rotate-12 transition-transform group-hover:rotate-0">
                        {notifType === 'success' ? (
                          <Sparkles className="w-12 h-12 text-white drop-shadow-lg animate-pulse" />
                        ) : (
                          <Activity className="w-12 h-12 text-white drop-shadow-lg" />
                        )}
                      </div>
                  </div>
                  {/* Hiệu ứng tia sáng phía sau icon */}
                  <div className={`absolute inset-0 blur-2xl opacity-40 -z-10 ${notifType === 'success' ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                </div>
                
                <h3 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter italic">
                  {notifType === 'success' ? "AMAZING!" : "OH NO..."}
                </h3>
                
                <p className="text-slate-600 font-semibold leading-relaxed mb-10 px-2 text-lg">
                  {notifMessage}
                </p>
                
                <button 
                  onClick={() => setShowNotification(false)}
                  className={`w-full py-5 rounded-[2rem] font-black text-lg uppercase tracking-widest text-white shadow-2xl transition-all hover:scale-105 active:scale-95 transform ${
                    notifType === 'success' 
                      ? 'bg-emerald-500 shadow-emerald-500/40 hover:bg-emerald-600' 
                      : 'bg-rose-500 shadow-rose-500/40 hover:bg-rose-600'
                  }`}
                >
                  {notifType === 'success' ? "Let's GO!" : "Continue Learning"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* --- HERO SECTION --- */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 py-20 lg:py-32 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-40 right-1/4 w-64 h-64 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-emerald-200 mb-8 shadow-lg animate-fade-in-up">
            <Sparkles className="w-5 h-5 text-emerald-500 mr-2" />
            <span className="text-emerald-700 font-medium">Next-Gen AI Personalization</span>
          </div>

          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-[#98F5E1] via-[#6B63FF] to-[#B9B4FF] bg-clip-text text-transparent">
              Master English 
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-500 bg-clip-text text-transparent leading-tight block pb-2">
              Like Never Before
            </span>
          </h1>

          <p className="mt-8 text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto font-light leading-relaxed">
            Stop memorizing blindly. Experience <span className="font-semibold text-emerald-600">Spaced Repetition</span>, 
            engage in <span className="font-semibold text-[#0067c5]">Smart AI Conversations</span>, and follow a path 
            <span className="font-semibold text-blue-600"> Personalized</span> just for you.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row gap-6 justify-center items-center">
            {/* NÚT START LEARNING NOW - Chuyển đến trang Test */}
            <button 
              onClick={() => window.location.href = '/test'}
              className="group px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl shadow-2xl hover:shadow-emerald-500/25 hover:scale-105 transition-all duration-300 transform"
            >
              <span className="flex items-center gap-3">
                 Start Learning Now
                <TrendingUp className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            
            {/* NÚT TRY VOICE DEMO - Chuyển đến trang Conversation */}
            <button 
              onClick={() => window.location.href = '/conversation'}
              className="group px-10 py-4 bg-white/80 backdrop-blur-md text-gray-700 font-bold border-2 border-white/50 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              <span className="flex items-center gap-3">
                🎧 Try Voice Demo
                <Mic className="w-5 h-5 group-hover:scale-110 transition-transform text-emerald-500" />
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* --- FEATURE 1: SMART AI CONVERSATION (CHAT UI + SCORING) - BLUE THEME --- */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Text Content */}
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0067c5]/10 text-[#0067c5] rounded-full text-sm font-semibold mb-6">
                <MessageCircle className="w-4 h-4" /> Smart Grading & Chat
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Talk Freely. <br/>
                <span className="text-[#0067c5]">Get Scored Instantly.</span>
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Our AI doesn't just listen; it evaluates. Speak naturally and get immediate scores on your pronunciation and grammar, along with helpful corrections.
              </p>
              
              <ul className="space-y-4">
                {[
                  "Real-time Pronunciation Score (0-100)",
                  "Grammar Accuracy Rating",
                  "Context-aware corrections"
                ].map((item, i) => (
                  <li key={i} className="flex items-center text-gray-700 bg-white/50 p-3 rounded-xl border border-[#0067c5]/20">
                    <ShieldCheck className="w-6 h-6 text-[#0067c5] mr-3 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Interactive Demo UI - CHAT BUBBLES WITH SCORES */}
            <div className="order-1 lg:order-2 relative">
              <div className="absolute inset-0 bg-[#0067c5]/10 blur-3xl rounded-full"></div>
              <div className="relative bg-white border border-[#0067c5]/20 rounded-3xl shadow-2xl p-6 md:p-8 max-w-md mx-auto">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-tr from-[#0067c5] to-cyan-500 rounded-full flex items-center justify-center text-white">
                      <Brain className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">AI Tutor</h4>
                      <p className="text-xs text-green-500 flex items-center gap-1">● Online</p>
                    </div>
                  </div>
                  <div className="bg-[#0067c5]/10 px-3 py-1 rounded-full text-xs font-bold text-[#0067c5]">
                    Voice Mode
                  </div>
                </div>

                <div className="space-y-4 mb-6 h-[320px] overflow-hidden relative flex flex-col justify-end">
                  {/* Message 1: AI Question */}
                  <div className={`transition-all duration-500 transform ${activeMessage >= 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className="bg-gray-100 text-gray-800 p-4 rounded-2xl rounded-tl-none inline-block max-w-[85%] text-sm">
                      Hello! How was your weekend?
                    </div>
                  </div>

                  {/* Message 2: User Answer */}
                  <div className={`flex justify-end transition-all duration-500 delay-100 transform ${activeMessage >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className="bg-[#0067c5] text-white p-4 rounded-2xl rounded-tr-none inline-block max-w-[85%] text-sm">
                      I go to the beach with friends.
                    </div>
                  </div>

                  {/* Message 3: AI Analysis & Score */}
                  <div className={`transition-all duration-500 delay-300 transform ${activeMessage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className="bg-white border-2 border-[#0067c5]/20 p-0 rounded-2xl rounded-tl-none inline-block max-w-[95%] text-sm shadow-lg overflow-hidden">
                      {/* Score Header */}
                      <div className="bg-[#0067c5]/5 p-3 flex gap-3 border-b border-[#0067c5]/10">
                        <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-gray-200 shadow-sm">
                            <Activity className="w-3 h-3 text-emerald-500" />
                            <span className="text-xs font-bold text-gray-700">Pronun: <span className="text-emerald-600">92%</span></span>
                        </div>
                        <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-gray-200 shadow-sm">
                            <Star className="w-3 h-3 text-orange-500" />
                            <span className="text-xs font-bold text-gray-700">Grammar: <span className="text-orange-600">7/10</span></span>
                        </div>
                      </div>
                      
                      {/* Correction Content */}
                      <div className="p-3 text-gray-700">
                        <div className="font-bold text-xs mb-1 text-[#0067c5] uppercase flex items-center gap-1">
                          <Zap className="w-3 h-3" /> Correction
                        </div>
                        "I <span className="line-through opacity-50 text-red-500">go</span> <strong className="text-emerald-600">went</strong> to the beach..."
                        <br/>
                        <span className="text-xs opacity-80 mt-2 block italic">Tip: Use past tense for finished actions.</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="h-12 bg-gray-50 rounded-full border border-gray-200 flex items-center px-4 justify-between text-gray-400">
                    <span>Listening...</span>
                    <div className="w-8 h-8 bg-[#0067c5] rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer hover:bg-[#005bb5] transition animate-pulse">
                      <Mic className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURE 2: SPACED REPETITION (Học ngắt quãng) --- */}
      <section className="py-24 bg-white/60 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Graphic/Visual */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-100 to-teal-50 rounded-[40px] transform rotate-3 opacity-50"></div>
              <div className="bg-white border border-emerald-100 rounded-[30px] p-8 shadow-xl relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-bold text-lg text-gray-800">Memory Retention Curve</h3>
                  <div className="flex gap-2">
                    <span className="w-3 h-3 rounded-full bg-gray-300"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  </div>
                </div>
                
                {/* Simplified Chart CSS Representation */}
                <div className="relative h-48 border-l border-b border-gray-200 w-full flex items-end">
                  {/* Dashed line (Forget curve) */}
                  <svg className="absolute inset-0 h-full w-full pointer-events-none" preserveAspectRatio="none">
                     <path d="M0,20 Q100,180 300,190" fill="none" stroke="#e5e7eb" strokeWidth="3" strokeDasharray="5,5" />
                     {/* Spaced Repetition Curve (The jagged line going up) */}
                     <path d="M0,20 Q40,100 50,120 L50,30 Q90,100 100,110 L100,25 Q180,90 200,100 L200,20 Q350,40 400,50" 
                           fill="none" stroke="#10b981" strokeWidth="4" className="drop-shadow-lg" />
                  </svg>
                  
                  {/* Points */}
                  <div className="absolute left-[12%] bottom-[35%] bg-white border-2 border-emerald-500 w-8 h-8 rounded-full flex items-center justify-center shadow-lg text-[10px] font-bold text-emerald-600 z-10">1d</div>
                  <div className="absolute left-[25%] bottom-[45%] bg-white border-2 border-emerald-500 w-8 h-8 rounded-full flex items-center justify-center shadow-lg text-[10px] font-bold text-emerald-600 z-10">3d</div>
                  <div className="absolute left-[50%] bottom-[65%] bg-white border-2 border-emerald-500 w-8 h-8 rounded-full flex items-center justify-center shadow-lg text-[10px] font-bold text-emerald-600 z-10">1w</div>
                </div>
                
                <div className="mt-4 flex justify-between text-xs text-gray-500 font-medium">
                  <span>First Learning</span>
                  <span>Long-term Memory</span>
                </div>
              </div>
            </div>

            {/* Text Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold mb-6">
                <Clock className="w-4 h-4" /> Spaced Repetition System
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Never Forget <br/>
                <span className="text-emerald-500">What You Learn.</span>
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Why study hard when you can study smart? Our algorithm tracks every word you learn and calculates the exact moment you're about to forget it.
              </p>
              <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                <h4 className="font-bold text-emerald-800 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" /> Efficiency Boost
                </h4>
                <p className="text-emerald-700 text-sm">
                  Students using Spaced Repetition learn vocabulary <span className="font-bold">3x faster</span> than traditional rote memorization methods.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURE 3: PERSONALIZATION (Cá nhân hóa) - BLUE THEME #0067c5 --- */}
      <section className="py-24 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#0067c5]/5 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-100/50 rounded-full blur-3xl -z-10"></div>

        <div className="max-w-7xl mx-auto px-6 text-center mb-16">
           <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
              Your Journey, <span className="bg-gradient-to-r from-[#0067c5] to-cyan-500 bg-clip-text text-transparent">Uniquely Yours</span>
           </h2>
           <p className="text-xl text-gray-600 max-w-2xl mx-auto">
             No two learners are alike. We build a dynamic curriculum based on your goals, interests, and real-time performance.
           </p>
        </div>

        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-8">
          {/* Personalization Card 1 */}
          <div className="group bg-white backdrop-blur rounded-3xl p-8 border border-white shadow-xl hover:-translate-y-2 transition-transform duration-300 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-[#0067c5]/5 rounded-bl-full -mr-4 -mt-4 transition-all group-hover:scale-110"></div>
             <div className="w-14 h-14 bg-[#0067c5]/10 rounded-2xl flex items-center justify-center text-[#0067c5] mb-6">
                <Target className="w-7 h-7" />
             </div>
             <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#0067c5] transition-colors">Goal-Driven Content</h3>
             <p className="text-gray-600">
               Whether it's for <span className="text-[#0067c5] font-semibold">Travel</span>, <span className="text-[#0067c5] font-semibold">Business</span>, or <span className="text-[#0067c5] font-semibold">IELTS</span>, lessons adapt to your specific target.
             </p>
          </div>

          {/* Personalization Card 2 */}
          <div className="bg-gradient-to-br from-[#0067c5] to-cyan-600 text-white rounded-3xl p-8 shadow-2xl transform md:-translate-y-6 relative overflow-hidden">
             <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
             <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white mb-6 backdrop-blur-sm">
               <Brain className="w-8 h-8" />
             </div>
             <h3 className="text-xl font-bold mb-3">Adaptive Difficulty</h3>
             <p className="text-blue-50">
               Too easy? We speed up. Too hard? We slow down. The AI constantly calibrates to keep you in the "Flow State".
             </p>
          </div>

          {/* Personalization Card 3 */}
          <div className="group bg-white backdrop-blur rounded-3xl p-8 border border-white shadow-xl hover:-translate-y-2 transition-transform duration-300 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-[#0067c5]/5 rounded-bl-full -mr-4 -mt-4 transition-all group-hover:scale-110"></div>
             <div className="w-14 h-14 bg-[#0067c5]/10 rounded-2xl flex items-center justify-center text-[#0067c5] mb-6">
                <BarChart3 className="w-7 h-7" />
             </div>
             <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#0067c5] transition-colors">Weakness Targeting</h3>
             <p className="text-gray-600">
               We identify struggling areas and subtly weave them into future lessons until you master them completely.
             </p>
          </div>
        </div>
      </section>

      {/* --- CORE MODULES (UPDATED DESIGN) --- */}
      <section className="py-20 bg-gradient-to-b from-white/50 to-white/80 backdrop-blur-sm border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
             <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-semibold mb-4">
                <Layers className="w-4 h-4" /> Comprehensive Learning
              </div>
            <h2 className="text-4xl font-bold text-gray-900">Core Modules</h2>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Module 1 */}
            <a href="/pronunciation" className="group relative bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150"></div>
              <div className="relative z-10">
                 <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-3xl mb-6 text-emerald-600 shadow-sm group-hover:scale-110 transition-transform">
                    <Mic className="w-7 h-7" />
                 </div>
                 <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors">Perfect Pronunciation</h3>
                 <p className="text-gray-500 mb-8 leading-relaxed">Visual feedback on your intonation and accent to sound like a native.</p>
                 <span className="flex items-center text-emerald-600 font-bold group-hover:gap-2 transition-all">
                    Start Practice <ArrowRight className="w-4 h-4 ml-2"/>
                 </span>
              </div>
            </a>

            {/* Module 2 */}
            <a href="/conversation" className="group relative bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#0067c5]/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150"></div>
              <div className="relative z-10">
                 <div className="w-14 h-14 bg-[#0067c5]/10 rounded-2xl flex items-center justify-center text-3xl mb-6 text-[#0067c5] shadow-sm group-hover:scale-110 transition-transform">
                    <MessageCircle className="w-7 h-7" />
                 </div>
                 <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-[#0067c5] transition-colors">Fluid Conversation</h3>
                 <p className="text-gray-500 mb-8 leading-relaxed">Practice speaking confidently without the fear of judgment anytime.</p>
                 <span className="flex items-center text-[#0067c5] font-bold group-hover:gap-2 transition-all">
                    Start Chatting <ArrowRight className="w-4 h-4 ml-2"/>
                 </span>
              </div>
            </a>

            {/* Module 3 */}
            <a href="/vocabulary" className="group relative bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150"></div>
              <div className="relative z-10">
                 <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center text-3xl mb-6 text-amber-600 shadow-sm group-hover:scale-110 transition-transform">
                    <Brain className="w-7 h-7" />
                 </div>
                 <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-amber-600 transition-colors">Dynamic Vocabulary</h3>
                 <p className="text-gray-500 mb-8 leading-relaxed">Master new words learned in context, not in isolation.</p>
                 <span className="flex items-center text-amber-600 font-bold group-hover:gap-2 transition-all">
                    Start Learning <ArrowRight className="w-4 h-4 ml-2"/>
                 </span>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="relative bg-gradient-to-b from-gray-900 via-slate-900 to-black overflow-hidden text-white">
        {/* Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
          <div className="grid lg:grid-cols-4 gap-12 mb-16">
            <div className="lg:col-span-2">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-white font-bold text-xl">E</span>
                </div>
                <h3 className="text-2xl font-bold">English AI Tutor</h3>
              </div>
              <p className="text-gray-400 text-lg leading-relaxed mb-8 max-w-lg">
                Transform your English learning journey with AI that understands your unique needs. 
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-6 text-emerald-400">Features</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Smart Chat</a></li>
                <li><a href="#" className="hover:text-white transition">Spaced Repetition</a></li>
                <li><a href="#" className="hover:text-white transition">Personalized Path</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-6 text-emerald-400">Support</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
             <p>© 2024 English AI Tutor. All rights reserved.</p>
             <div className="flex items-center gap-2 mt-4 md:mt-0">
               <span>Made with</span>
               <span className="text-red-500 animate-pulse">❤️</span>
               <span>by AI</span>
             </div>
          </div>
        </div>
      </footer>
    </main>
  );
}