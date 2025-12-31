"use client";
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { 
  ArrowRight, 
  ArrowLeft, 
  Loader2, 
  Target, 
  Check, 
  Flag, 
  Clock, 
  ShieldAlert, 
  Zap 
} from "lucide-react";

const BACKEND_API_URL = "http://127.0.0.1:8000/quiz/test";

const stepOptions = {
  goals: ["Work, Interviews", "Travel, Culture", "Daily Conversation", "Other"],
  duration: ["1 Month", "2–3 Months", "6 Months", "Long-term / Undefined", "Other"],
  barrier: ["Slow Reflexes", "Pronunciation Issues", "Lack of Vocabulary", "Basic Grammar Errors", "Other"],
  dailyTime: ["15 Minutes", "30 Minutes", "1 Hour", "Over 1 Hour", "Other"],
};

export default function PreferencesPage() {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState("");
  const [customGoal, setCustomGoal] = useState("");
  const [duration, setDuration] = useState("");
  const [customDuration, setCustomDuration] = useState("");
  const [barrier, setBarrier] = useState("");
  const [customBarrier, setCustomBarrier] = useState("");
  const [dailyTime, setDailyTime] = useState("");
  const [customDailyTime, setCustomDailyTime] = useState("");
  const [fade, setFade] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Xử lý chuyển bước mượt mà
  const handleStepChange = (next: boolean) => {
    setFade(false);
    setTimeout(() => {
      setStep((prev) => (next ? prev + 1 : prev - 1));
      setFade(true);
    }, 200);
  };

  const handleSubmit = async () => {
    const finalGoal = goal === "Other" ? customGoal : goal;
    const finalDuration = duration === "Other" ? customDuration : duration;
    const finalBarrier = barrier === "Other" ? customBarrier : barrier;
    const finalDailyTime = dailyTime === "Other" ? customDailyTime : dailyTime;

    if (!finalGoal || !finalDuration || !finalBarrier || !finalDailyTime) {
      toast.error("Please complete all fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      toast.loading("Analyzing your profile...", { id: "loading-quiz" });
      const res = await fetch(BACKEND_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          communication_goal: finalGoal,
          target_duration: finalDuration,
          confidence_barrier: finalBarrier,
          daily_commitment: finalDailyTime,
        }),
      });

      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      localStorage.setItem("userQuizData", JSON.stringify(data));
      toast.success("Profile ready!", { id: "loading-quiz" });
      window.location.href = "/test/quiz";
    } catch (e) {
      toast.error("Failed to connect to server.", { id: "loading-quiz" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderOptions = (options: string[], selected: string, setSelected: (v: string) => void, setCustom: (v: string) => void, customValue: string, placeholder: string) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {options.map((item) => {
        const isSelected = selected === item;
        return (
          <button
            key={item}
            onClick={() => { setSelected(item); setCustom(""); }}
            className={`group relative flex items-center p-5 rounded-2xl border-2 transition-all duration-300 text-left
              ${isSelected 
                ? "border-blue-600 bg-blue-50/50 shadow-md shadow-blue-100" 
                : "border-slate-100 bg-white hover:border-blue-200 hover:bg-slate-50"}`}
          >
            <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center transition-colors
              ${isSelected ? "bg-blue-600 border-blue-600 shadow-inner" : "border-slate-200 bg-white"}`}>
              {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={4} />}
            </div>
            <span className={`text-base font-bold transition-colors ${isSelected ? "text-blue-900" : "text-slate-600"}`}>
              {item}
            </span>
          </button>
        );
      })}

      {selected === "Other" && (
        <div className="col-span-full mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <input
            value={customValue}
            onChange={(e) => setCustom(e.target.value)}
            placeholder={placeholder}
            className="w-full px-5 py-4 bg-white border-2 border-blue-100 rounded-2xl text-base font-medium focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all placeholder:text-slate-400"
          />
        </div>
      )}
    </div>
  );

  const stepsData = [
    { icon: Flag, title: "Main Goal", desc: "What brings you to our platform?", options: stepOptions.goals, selected: goal, setSelected: setGoal, setCustom: setCustomGoal, custom: customGoal, ph: "Enter your goal..." },
    { icon: Clock, title: "Time Frame", desc: "How long is your learning journey?", options: stepOptions.duration, selected: duration, setSelected: setDuration, setCustom: setCustomDuration, custom: customDuration, ph: "e.g. 4 months" },
    { icon: ShieldAlert, title: "Core Barrier", desc: "What's holding you back most?", options: stepOptions.barrier, selected: barrier, setSelected: setBarrier, setCustom: setCustomBarrier, custom: customBarrier, ph: "Describe your barrier..." },
    { icon: Zap, title: "Daily Effort", desc: "Your daily study commitment?", options: stepOptions.dailyTime, selected: dailyTime, setSelected: setDailyTime, setCustom: setCustomDailyTime, custom: customDailyTime, ph: "e.g. 90 minutes" },
  ];

  const currentStep = stepsData[step - 1];
  const StepIcon = currentStep.icon;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-white flex items-center justify-center p-6 antialiased">
      {/* Decorative Circles */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-400/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-400/5 rounded-full blur-3xl -z-10" />

      {isSubmitting && (
        <div className="fixed inset-0 bg-white/40 backdrop-blur-md flex flex-col items-center justify-center z-50">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center border border-slate-100">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" strokeWidth={1.5} />
            <p className="font-bold text-slate-800 text-lg">Personalizing your path...</p>
          </div>
        </div>
      )}

      <div className="w-full max-w-2xl">
        {/* Header Badge */}
        <div className="flex justify-center mb-6">
          <span className="bg-blue-100/50 text-blue-700 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-blue-200/50">
            Step {step} of 4
          </span>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] p-8 md:p-12 relative overflow-hidden">
          {/* Progress Line */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-700 ease-out"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>

          <div className={`transition-all duration-300 transform ${fade ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            {/* Title Section */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                <StepIcon className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none">
                  {currentStep.title}
                </h2>
                <p className="text-slate-500 font-medium mt-1">
                  {currentStep.desc}
                </p>
              </div>
            </div>

            {/* Options */}
            {renderOptions(currentStep.options, currentStep.selected, currentStep.setSelected, currentStep.setCustom, currentStep.custom, currentStep.ph)}
          </div>

          {/* Navigation */}
          <div className="mt-12 flex justify-between items-center pt-8 border-t border-slate-50">
            {step > 1 ? (
              <button
                onClick={() => handleStepChange(false)}
                className="group flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                </div>
                Back
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={() => (step === 4 ? handleSubmit() : handleStepChange(true))}
              disabled={!currentStep.selected || (currentStep.selected === "Other" && !currentStep.custom)}
              className="relative group flex items-center gap-3 px-8 py-4 rounded-2xl bg-slate-900 text-white text-sm font-bold hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none shadow-xl shadow-slate-200 hover:shadow-blue-200"
            >
              {step === 4 ? "Launch Quiz" : "Continue"}
              {step === 4 ? (
                <Target className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              ) : (
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </div>
        </div>

        {/* Footer Support Text */}
        <p className="text-center mt-8 text-slate-400 text-xs font-semibold tracking-wide">
          Our AI uses these settings to tailor the diagnostic content to your level.
        </p>
      </div>
    </div>
  );
}