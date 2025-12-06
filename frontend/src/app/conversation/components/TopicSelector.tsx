"use client";

import { useState } from "react";
import { 
  ArrowRight, Plane, Utensils, Briefcase, CloudSun, Smile,Coffee, ShoppingBag, HeartPulse, Users, Gamepad2,GraduationCap,Cpu,Leaf,Sparkles
} from "lucide-react";

interface TopicSelectorProps {
  topic: string | null;
  onTopicChange: (topic: string) => void;
  mode: "scenario" | "free"; 
}

const topicIcons: Record<string, React.ElementType> = {
  "Travel": Plane,
  "Food": Utensils,
  "Work": Briefcase,
  "Weather": CloudSun,
  "Feeling": Smile,
  "Daily Life": Coffee,
  "Shopping": ShoppingBag,
  "Health": HeartPulse,
  "Family": Users,
  "Hobbies": Gamepad2,
  "Education": GraduationCap,
  "Technology": Cpu,
  "Environment": Leaf
};

const topics = Object.keys(topicIcons);

export default function TopicSelector({ topic, onTopicChange, mode }: TopicSelectorProps) {
  const [customTopic, setCustomTopic] = useState("");

  const handleSetCustomTopic = () => {
    const trimmed = customTopic.trim();
    if (trimmed) {
      onTopicChange(trimmed);
      setCustomTopic("");
    }
  };

  return (
    <div className="animate-fadeIn bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
      {/* --- Title --- */}
      <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Sparkles size={18} className="text-blue-600" />
        <span>
          {mode === 'free' ? "Choose a topic to start talking" : "Filter Scenarios by Topic"}
        </span>
      </h3>

      {/* --- Topic buttons --- */}
      <div className="flex flex-wrap gap-2.5 mb-6">
        {topics.map((t) => {
          const isSelected = topic === t;
          const Icon = topicIcons[t] || Sparkles; // Fallback icon

          return (
            <button
              key={t}
              onClick={() => onTopicChange(t)}
              className={`
                group flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-xl border transition-all duration-200
                ${isSelected
                  ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm ring-1 ring-blue-200"
                  : "bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-slate-50"
                }
              `}
            >
              <Icon 
                size={16} 
                className={`transition-colors ${isSelected ? "text-blue-600" : "text-slate-400 group-hover:text-blue-500"}`} 
              />
              {t}
            </button>
          );
        })}
      </div>

      {mode === 'free' && (
        <div className="relative pt-4 border-t border-slate-100 animate-fadeIn">
          <label
            htmlFor="custom-topic"
            className="block text-xs font-semibold uppercase text-slate-400 mb-2 tracking-wider"
          >
            Or discuss anything else
          </label>
          
          <div className="relative group">
            <input
              id="custom-topic"
              type="text"
              placeholder="e.g., Space Travel, Ancient History, AI Ethics..."
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSetCustomTopic()}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-4 pr-12 text-sm text-slate-800 placeholder:text-slate-400
                focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
            />
            <button
              onClick={handleSetCustomTopic}
              disabled={!customTopic.trim()}
              className="absolute right-1.5 top-1.5 w-8 h-8 flex items-center justify-center 
                rounded-lg bg-blue-600 text-white shadow-md
                hover:bg-blue-700 hover:scale-105 active:scale-95
                disabled:bg-slate-300 disabled:shadow-none disabled:hover:scale-100 disabled:cursor-not-allowed
                transition-all duration-200"
              aria-label="Set custom topic"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}