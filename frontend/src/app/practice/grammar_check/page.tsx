"use client";
import React, { useState } from "react";
import { Copy, Trash2, ArrowLeft } from "lucide-react"; // Sử dụng lucide-react thay vì react-icons

type GrammarError = {
  message: string;
  suggestions: string[];
  offset: number;
  length: number;
};

export default function GrammarCheckPage() {
  const [answer, setAnswer] = useState("");
  const [errors, setErrors] = useState<GrammarError[]>([]);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  const primaryColor = "#0067C5";
  const primaryHover = "#0052A3";

  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;

  const checkGrammar = async () => {
    if (!answer.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/grammar_check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: answer }),
      });

      const data = await res.json();
      setErrors(
        (data.errors || []).map((e: any) => ({
          ...e,
          offset: e.offset,
          length: e.length,
        }))
      );
      setChecked(true);
    } catch (err) {
      console.error("Error checking grammar:", err);
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = (index: number, suggestion: string) => {
    const error = errors[index];
    const before = answer.slice(0, error.offset);
    const after = answer.slice(error.offset + error.length);
    const newText = before + suggestion + after;
    setAnswer(newText);
    setErrors([]);
    setChecked(false);
  };

  const applyAllSuggestions = () => {
    if (errors.length === 0) return;

    let newText = answer;
    const sortedErrors = [...errors].sort((a, b) => b.offset - a.offset);

    for (const err of sortedErrors) {
      if (err.suggestions.length > 0) {
        const before = newText.slice(0, err.offset);
        const after = newText.slice(err.offset + err.length);
        newText = before + err.suggestions[0] + after;
      }
    }

    setAnswer(newText);
    setErrors([]);
    setChecked(false);
  };

  const dismissError = (index: number) => {
    setErrors((prev) => prev.filter((_, i) => i !== index));
  };

  const renderTextWithErrors = () => {
    if (!checked || errors.length === 0) return <span>{answer}</span>;

    const sortedErrors = [...errors].sort((a, b) => a.offset - b.offset);
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    sortedErrors.forEach((err, idx) => {
      const before = answer.slice(lastIndex, err.offset);
      const errorText = answer.slice(err.offset, err.offset + err.length);

      if (before) elements.push(<span key={`before-${idx}`}>{before}</span>);

      elements.push(
        <span
          key={`error-${idx}`}
          className="bg-red-100 text-red-700 font-semibold px-1 rounded"
        >
          {errorText}
        </span>
      );

      lastIndex = err.offset + err.length;
    });

    if (lastIndex < answer.length) {
      elements.push(<span key="after-all">{answer.slice(lastIndex)}</span>);
    }

    return elements;
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col items-center p-6">
      
      {/* Nút Back to Practice - Sử dụng thẻ a thay vì Link của Next.js */}
      <div className="w-full max-w-7xl mb-6">
        <a 
          href="/practice" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-[#0067C5] transition-colors font-medium group cursor-pointer"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Back to Practice
        </a>
      </div>

      <div className="flex flex-col lg:flex-row w-full max-w-7xl gap-6">
        {/* Left Panel */}
        <div className="flex-1 bg-white rounded-2xl shadow-lg p-6 flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-500">Your Text</span>
            {answer.trim() && (
              <div className="flex gap-2 text-gray-600">
                <button
                  onClick={() => navigator.clipboard.writeText(answer)}
                  className={`hover:text-[${primaryColor}] transition flex items-center gap-1`}
                  title="Copy text"
                >
                  <Copy size={18} />
                </button>
                <button
                  onClick={() => {
                    setAnswer("");
                    setErrors([]);
                    setChecked(false);
                  }}
                  className="hover:text-red-600 transition flex items-center gap-1"
                  title="Clear text"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            )}
          </div>

          <textarea
            placeholder="Type your text here..."
            className={`w-full resize-none border border-gray-300 rounded-xl p-4 text-lg focus:outline-none focus:ring-2 focus:ring-[${primaryColor}] transition mb-4`}
            value={answer}
            onChange={(e) => {
              setAnswer(e.target.value);
              setChecked(false);
            }}
            rows={12}
          />

          <button
            onClick={checkGrammar}
            className={`text-white py-3 rounded-xl font-semibold shadow-md transition mb-4 bg-[${primaryColor}] hover:bg-[${primaryHover}]`}
          >
            {loading ? "Checking..." : "Check Grammar"}
          </button>

          <div className="bg-gray-50 p-4 rounded-xl text-sm leading-6 whitespace-pre-wrap border border-gray-100 shadow-inner min-h-[120px]">
            {renderTextWithErrors()}
          </div>

          <div className="text-sm text-gray-400 mt-2 flex justify-between">
            <span>
              {answer.length}/2000 <strong className="text-gray-600 font-semibold">characters</strong>
            </span>
            <span>
              {wordCount} <strong className="text-gray-600 font-semibold">words</strong>
            </span>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 bg-white rounded-2xl shadow-lg p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-semibold text-gray-700">Corrections</span>
            {errors.length > 0 && (
              <button
                onClick={applyAllSuggestions}
                className={`text-[${primaryColor}] font-medium hover:underline`}
              >
                Accept All
              </button>
            )}
          </div>

          <div className="flex-1 overflow-auto max-h-[600px] space-y-4">
            {checked && errors.length === 0 && answer && !loading && (
              <div className="text-green-600 text-sm font-medium">
                🎉 No grammar issues found!
              </div>
            )}

            {checked && errors.length > 0 && !loading && (
              <ul className="space-y-4">
                {errors.map((err, idx) => (
                  <li
                    key={idx}
                    className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition"
                  >
                    <p className="text-gray-700 mb-2">
                      <span className="bg-red-100 text-red-700 font-semibold px-1 rounded">
                        {answer.slice(err.offset, err.offset + err.length)}
                      </span>{" "}
                      – {err.message}
                    </p>

                    <div className="flex items-center gap-3 flex-wrap">
                      {err.suggestions.length > 0 ? (
                        err.suggestions.map((sug, i) => (
                          <button
                            key={i}
                            onClick={() => applySuggestion(idx, sug)}
                            className={`bg-[${primaryColor}] text-white px-3 py-1 rounded-full text-sm hover:bg-[${primaryHover}] transition shadow-sm`}
                          >
                            {sug}
                          </button>
                        ))
                      ) : (
                        <span className="text-gray-400 text-sm">No suggestions</span>
                      )}

                      <button
                        onClick={() => dismissError(idx)}
                        className="ml-auto text-red-500 text-sm hover:underline"
                      >
                        Dismiss
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {loading && <div className={`text-[${primaryColor}] text-sm`}>Checking grammar...</div>}
          </div>
        </div>
      </div>
    </main>
  );
}