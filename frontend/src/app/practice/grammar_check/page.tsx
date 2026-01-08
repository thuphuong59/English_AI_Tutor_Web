"use client";
import React, { useState } from "react";
import { FiCopy, FiTrash2 } from "react-icons/fi";
import { useEffect } from "react"; // Thêm useEffect
import { useRouter } from "next/navigation"; // Thêm useRouter
import { Loader2, LogIn } from "lucide-react"; // Import thêm icon
// import Navbar from "../../../components/Navbar";

type GrammarError = {
  message: string;
  suggestions: string[];
  offset: number;
  length: number;
};

export default function GrammarCheckPage() {
  const router = useRouter();
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const [checkingLogin, setCheckingLogin] = useState(true);

  useEffect(() => {
      // Kiểm tra token trong localStorage hoặc sessionStorage
      const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
      setHasToken(!!token);
      setCheckingLogin(false);
  }, []);
  const [answer, setAnswer] = useState("");
  const [errors, setErrors] = useState<GrammarError[]>([]);
  const [loading, setLoading] = useState(false);

  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;

  const checkGrammar = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/check_grammar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();
      setErrors(
        (data.errors || []).map((e: any) => ({
          ...e,
          offset: e.offset,
          length: e.length,
        }))
      );
    } catch (err) {
      console.error("Error checking grammar:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setAnswer(newText);
    checkGrammar(newText.trim());
  };

  const applySuggestion = (index: number, suggestion: string) => {
    const error = errors[index];
    const before = answer.slice(0, error.offset);
    const after = answer.slice(error.offset + error.length);
    const newText = before + suggestion + after;
    setAnswer(newText);
    setErrors([]);
    checkGrammar(newText);
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
    checkGrammar(newText);
  };

  // Hàm dismiss lỗi
  const dismissError = (index: number) => {
    setErrors((prev) => prev.filter((_, i) => i !== index));
  };

  const renderTextWithErrors = () => {
    if (errors.length === 0) return <span>{answer}</span>;

    const sortedErrors = [...errors].sort((a, b) => a.offset - b.offset);
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    sortedErrors.forEach((err, idx) => {
      const before = answer.slice(lastIndex, err.offset);
      const errorText = answer.slice(err.offset, err.offset + err.length);

      if (before) {
        elements.push(<span key={`before-${idx}`}>{before}</span>);
      }

      elements.push(
        <span key={`error-${idx}`} className="text-red-600">
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
  if (checkingLogin || hasToken === null) {
      return (
          <div className="h-screen flex items-center justify-center bg-slate-50">
              <Loader2 className="animate-spin text-blue-600" size={40} />
          </div>
      );
  }

  // 2. Chặn truy cập nếu chưa đăng nhập
  if (!hasToken) {
      return (
          <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-center px-4">
              <LogIn className="text-blue-600 mb-4" size={48} />
              <h1 className="text-xl font-bold mb-2">Login Required</h1>
              <p className="text-gray-500 mb-6">Please sign in to use the Grammar Checker.</p>
              <button 
                  onClick={() => router.push("/auth")} 
                  className="px-8 py-2 bg-blue-600 text-white rounded-xl font-semibold"
              >
                  Sign In Now
              </button>
          </div>
      );
  }
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* <Navbar /> */}
      <div className="flex flex-1 p-8 gap-6">
        {/* Left: Input */}
        <div className="w-1/2 bg-white rounded-xl shadow-md p-6 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">English</span>
            {answer.trim() && (
              <div className="flex gap-2 text-gray-600">
                <button
                  onClick={() => navigator.clipboard.writeText(answer)}
                  className="hover:text-blue-600 transition flex items-center gap-1"
                >
                  <FiCopy size={18} />
                  <span className="text-sm">Copy</span>
                </button>
                <button
                  onClick={() => {
                    setAnswer("");
                    setErrors([]);
                  }}
                  className="hover:text-red-600 transition flex items-center gap-1"
                >
                  <FiTrash2 size={18} />
                  <span className="text-sm">Delete</span>
                </button>
              </div>
            )}
          </div>

          <hr className="border-t border-gray-200 mb-4" />

          {/* Textarea & Rendered preview with red highlights */}
          <div className="flex-1 overflow-auto max-h-[500px]">
            <textarea
              placeholder="Type your text here..."
              className="w-full resize-none border-none outline-none text-lg mb-4"
              value={answer}
              onChange={handleChange}
              rows={10}
            />

            {/* Highlighted text below the textarea */}
            <div className="bg-gray-100 p-4 rounded text-sm leading-6 whitespace-pre-wrap">
              {renderTextWithErrors()}
            </div>
          </div>

          <div className="text-sm text-gray-400 mt-2 flex justify-between">
            <span>
              {answer.length}/2000{" "}
              <strong className="text-gray-600 font-semibold">characters</strong>
            </span>
            <span>
              {wordCount}{" "}
              <strong className="text-gray-600 font-semibold">words</strong>
            </span>
          </div>
        </div>

        {/* Right: Results */}
        <div className="w-1/2 bg-gradient-to-b from-blue-50 to-white rounded-xl shadow-md p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-4 font-medium text-gray-600 items-center">
              <span className="cursor-pointer border-b-2 border-black">Correct</span>
              {errors.length > 0 && (
                <button
                  onClick={applyAllSuggestions}
                  className="text-sm text-blue-600 hover:underline ml-4"
                >
                  Accept All
                </button>
              )}
            </div>
          </div>

          {loading && <div className="text-blue-500 text-sm">Checking grammar...</div>}

          <div className="flex-1 overflow-auto max-h-[500px] space-y-4">
            {!loading && errors.length === 0 && answer && (
              <div className="text-gray-400 text-sm">No grammar issues found.</div>
            )}

            {!loading && errors.length > 0 && (
              <ul className="space-y-4">
                {errors.map((err, idx) => (
                  <li
                    key={idx}
                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                  >
                    <p className="text-sm text-gray-800 mb-2">
                      <span className="font-semibold text-red-600">
                        {answer.slice(err.offset, err.offset + err.length)}
                      </span>{" "}
                      – {err.message}
                    </p>

                    <div className="flex items-center gap-4">
                      {err.suggestions.length > 0 ? (
                        <button
                          onClick={() => applySuggestion(idx, err.suggestions[0])}
                          className="text-blue-600 text-sm hover:underline"
                        >
                          {err.suggestions[0]}
                        </button>
                      ) : (
                        <p className="text-gray-400 text-sm">No suggestions</p>
                      )}

                      {/* Nút Dismiss */}
                      <button
                        onClick={() => dismissError(idx)}
                        className="text-red-500 text-sm hover:underline ml-auto"
                      >
                        Dismiss
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}