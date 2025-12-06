"use client";

interface LevelSelectorProps {
  level: string;
  onLevelChange: (level: string) => void;
}

const levels = [
  { name: "Beginner", icon: "🌱", desc: "Start with basics" },
  { name: "Intermediate", icon: "🌿", desc: "Build confidence" },
  { name: "Advanced", icon: "🌳", desc: "Challenge yourself" },
];

export default function LevelSelector({ level, onLevelChange }: LevelSelectorProps) {
  return (
    <div className="animate-fadeIn">
      <div className="grid grid-cols-3 gap-3">
        {levels.map((lvl) => {
          const isActive = level === lvl.name;

          return (
            <button
              key={lvl.name}
              onClick={() => onLevelChange(lvl.name)}
              className={`group p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all duration-200
                ${
                  isActive
                    ? "bg-[#E6F0FA] border-[#0067C5] shadow-sm"
                    : "bg-white border-slate-200 hover:border-[#0067C5] hover:shadow-sm"
                }`}
            >
              {/* Icon */}
              <div
                className={`mb-2 text-3xl transition-transform ${
                  isActive ? "scale-110" : "group-hover:scale-105"
                }`}
              >
                {lvl.icon}
              </div>

              {/* Name */}
              <p
                className={`text-sm font-semibold transition-colors ${
                  isActive ? "text-[#0067C5]" : "text-slate-800 group-hover:text-[#0067C5]"
                }`}
              >
                {lvl.name}
              </p>

              {/* Description */}
              <p
                className={`text-xs mt-0.5 transition-colors ${
                  isActive ? "text-[#0067C5]" : "text-slate-500 group-hover:text-[#0067C5]"
                }`}
              >
                {lvl.desc}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
