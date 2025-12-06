import { Lightbulb } from "lucide-react";

interface SuggestionsPanelProps {
  suggestions: string[];
  onSelectSuggestion: (suggestion: string) => void;
}

export default function SuggestionsPanel({ suggestions, onSelectSuggestion }: SuggestionsPanelProps) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="mb-3 pt-2">
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <Lightbulb className="text-[#0067C5]" size={14} />
        <p className="text-xs font-medium text-gray-600">
          Suggestions:
        </p>
      </div>

      {/* Suggestion chips */}
      <div className="flex flex-wrap gap-2">
        {suggestions.map((sug, idx) => (
          <button
            key={idx}
            onClick={() => onSelectSuggestion(sug)}
            className="px-3 py-1 rounded-full text-xs font-medium
              bg-[#D9E7FF] text-[#0067C5] border border-[#0067C5]"
          >
            {sug}
          </button>
        ))}
      </div>
    </div>
  );
}
