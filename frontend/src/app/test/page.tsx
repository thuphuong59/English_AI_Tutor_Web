"use client";
import { useState, useEffect } from "react"; 
import { Brain, Clock, Target, ArrowRight, Lock, CheckCircle, Sparkles, Loader2, Zap, AlertCircle } from "lucide-react";

// --- CUSTOM HOOK: useAuthStatus ---
const useAuthStatus = () => {
  // FIX: Khởi tạo là chuỗi rỗng "" để tránh lỗi type inference của TypeScript
  const [userId, setUserId] = useState(""); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
        try {
            const storedUserId = localStorage.getItem('authenticatedUserId');
            // FIX: Đảm bảo luôn set là string (nếu null thì convert sang "")
            setUserId(storedUserId || ""); 
        } catch (error) {
            console.error("Error accessing localStorage:", error);
            setUserId(""); 
        } finally {
            setIsLoading(false);
        }
    };
    
    checkAuth();
  }, []);

  return { userId, isLoading };  
};

export default function TestPage() {
  const { userId: currentUserId, isLoading: isAuthLoading } = useAuthStatus();
  
  // --- MOCK ROUTER ---
  const router = {
    push: (path: string) => {
        console.log(`Navigating to: ${path}`);
        window.location.href = path; 
    }
  };
  
  const [statusMessage, setStatusMessage] = useState("Checking session...");
  const [notification, setNotification] = useState({ type: '', text: '' }); 

  // Tự động ẩn thông báo sau 3s
  useEffect(() => {
    if (notification.text) { 
      const timer = setTimeout(() => setNotification({ type: '', text: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Cập nhật text nút dựa trên trạng thái auth
  useEffect(() => {
    if (!isAuthLoading) {
        if (currentUserId) {
            setStatusMessage("Start Assessment");
        } else {
            setStatusMessage("Login to Start");
        }
    } else {
        setStatusMessage("Checking access...");
    }
  }, [isAuthLoading, currentUserId]);

  // --- LOGIC XỬ LÝ CLICK ---
  const handleStartTesting = () => {
    if (isAuthLoading) {
        setNotification({ type: 'error', text: "Please wait, checking login status..." });
        return;
    }
      
    // Kiểm tra login (chuỗi rỗng là falsy trong JS)
    if (!currentUserId) {
      setNotification({ type: 'error', text: "Redirecting to Login Page..." });
      
      setTimeout(() => {
          router.push('/auth'); 
      }, 1000);
      
      return;
    }

    setNotification({ type: 'success', text: "Access granted! Starting test..." });
    
    setTimeout(() => {
        router.push('/preferences');
    }, 1000);
  };

  const buttonDisabled = isAuthLoading; 

  if (isAuthLoading) {
      return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#F9F4EF] via-[#F4FFFB] to-[#E6ECFF]">
          <div className="flex flex-col items-center animate-pulse">
            <Loader2 className="w-10 h-10 text-[#0067c5] animate-spin mb-4" />
            <p className="text-lg font-medium text-gray-600">{statusMessage}</p>
          </div>
        </main>
      );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#F9F4EF] via-[#F4FFFB] to-[#E6ECFF] overflow-hidden p-6 relative">
      
      {/* Toast Notification */}
      {notification.text && (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-fade-in-down ${
          notification.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
        }`}>
          {notification.type === 'error' ? <AlertCircle className="w-5 h-5"/> : <CheckCircle className="w-5 h-5"/>}
          <span className="font-medium">{notification.text}</span>
        </div>
      )}

      {/* --- Animated Background Elements --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <section className="relative z-10 w-full max-w-4xl">
        <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/50 overflow-hidden">
          
          <div className="grid md:grid-cols-5 h-full">
            {/* Left Side: Visual & Intro */}
            <div className="md:col-span-3 p-8 md:p-12 flex flex-col justify-center">
              
              <div className="inline-flex items-center self-start px-4 py-2 bg-blue-50 rounded-full border border-blue-100 mb-6">
                <Sparkles className="w-4 h-4 text-[#0067c5] mr-2" />
                <span className="text-[#0067c5] font-bold text-xs uppercase tracking-wider">Placement Test</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
                Discover Your <br/>
                <span className="bg-gradient-to-r from-[#0067c5] to-cyan-500 bg-clip-text text-transparent">
                  True English Level
                </span>
              </h2>

              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                This isn't just a test. It's the first step to your personalized roadmap. 
                We analyze your grammar, vocabulary, and comprehension to tailor the AI just for you.
              </p>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-3 bg-white/60 p-3 rounded-xl border border-white">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase">Duration</p>
                    <p className="font-semibold text-gray-800">~15-30 Mins</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 bg-white/60 p-3 rounded-xl border border-white">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase">Type</p>
                    <p className="font-semibold text-gray-800">Adaptive</p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex flex-col gap-4">
                <button 
                  onClick={handleStartTesting}
                  disabled={buttonDisabled}
                  className={`group w-full py-4 px-6 rounded-xl font-bold text-white shadow-xl flex items-center justify-center gap-3 transition-all duration-300
                    ${buttonDisabled 
                      ? 'bg-gray-300 cursor-not-allowed shadow-none' 
                      : !currentUserId 
                        ? 'bg-gradient-to-r from-[#0067c5] to-[#005bb5] hover:shadow-[#0067c5]/30 hover:scale-[1.02]' 
                        : 'bg-gradient-to-r from-[#0067c5] to-[#005bb5] hover:shadow-[#0067c5]/30 hover:scale-[1.02]'
                    }`}
                >
                  {buttonDisabled ? <Loader2 className="w-5 h-5 animate-spin"/> : 
                   !currentUserId ? <Lock className="w-5 h-5"/> : <Brain className="w-5 h-5"/>}
                  
                  {statusMessage}
                  
                  {!buttonDisabled && currentUserId && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                </button>

                {!currentUserId && (
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500 bg-gray-50 py-2 rounded-lg border border-gray-100 animate-fade-in">
                      <Lock className="w-3 h-3" />
                      <span>Authentication required to save progress.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Decorative/Stats */}
            <div className="hidden md:flex md:col-span-2 bg-gradient-to-br from-[#0067c5]/5 to-cyan-100/30 p-12 flex-col justify-center items-center relative border-l border-white/50">
               <div className="absolute top-10 right-10 w-20 h-20 bg-yellow-400/20 rounded-full blur-xl"></div>
               
               <div className="relative w-full max-w-[240px] aspect-[3/4]">
                  <div className="absolute top-0 right-0 left-0 bg-white p-4 rounded-2xl shadow-lg border border-gray-100 transform translate-x-4 translate-y-4 opacity-60 scale-95 z-0">
                    <div className="h-2 w-1/3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-2 w-full bg-gray-100 rounded"></div>
                  </div>
                  
                  <div className="absolute inset-0 bg-white p-6 rounded-2xl shadow-xl border border-gray-100 z-10 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                       <Target className="w-10 h-10 text-[#0067c5]" />
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg mb-1">Precision</h3>
                    <p className="text-gray-500 text-sm">Our AI pinpoints your exact level from A1 to C2.</p>
                  </div>
               </div>

               <div className="mt-12 space-y-3 w-full">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>Grammar Analysis</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>Vocabulary Range</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>Listening Skills</span>
                  </div>
               </div>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}