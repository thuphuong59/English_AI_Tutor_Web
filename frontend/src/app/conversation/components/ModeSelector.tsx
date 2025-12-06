"use client";

import { Radio, MessageSquare } from "lucide-react";

interface ModeSelectorProps {
  mode: "scenario" | "free";
  onModeChange: (mode: "scenario" | "free") => void;
}

export default function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  const modes = [
    {
      key: "scenario",
      icon: <Radio size={22} />,
      title: "Scenario",
      desc: "Guided practice",
    },
    {
      key: "free",
      icon: <MessageSquare size={22} />,
      title: "Free Talk",
      desc: "Natural chat",
    },
  ] as const;

  const activeColor = "#0067C5";
  const activeBg = "bg-[#D9E7FF]"; 
  const hoverBg = "group-hover:bg-[#CCE0FF]"; 

  return (
    <div className="animate-fadeIn">

      {/* Mode buttons */}
      <div className="grid grid-cols-2 gap-3">
        {modes.map((m) => {
          const isActive = mode === m.key;
          return (
            <button
              key={m.key}
              onClick={() => onModeChange(m.key)}
              className={`group p-4 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center
                ${
                  isActive
                    ? `${activeBg} border-[${activeColor}] shadow-sm`
                    : `bg-white border-slate-200 hover:border-[${activeColor}] hover:shadow-sm`
                }`}
            >
              <div
                className={`mb-2 p-2 rounded-full transition-colors ${
                  isActive
                    ? `bg-[${activeColor}] text-white`
                    : `bg-slate-100 text-slate-500 ${hoverBg}`
                }`}
              >
                {m.icon}
              </div>

              <p
                className={`text-sm font-semibold ${
                  isActive ? `text-[${activeColor}]` : "text-slate-800"
                }`}
              >
                {m.title}
              </p>
              <p
                className={`text-xs ${
                  isActive ? `text-[${activeColor}]` : "text-slate-500"
                }`}
              >
                {m.desc}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
