"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const level = searchParams.get("level");
  const [roadmap, setRoadmap] = useState("");

  useEffect(() => {
    if (!level) return;

    const roadmapMap: Record<string, string> = {
      A1: "Bắt đầu với các cấu trúc câu cơ bản, từ vựng thông dụng và kỹ năng nghe - nói cơ bản.",
      A2: "Mở rộng vốn từ vựng, luyện tập mô tả bản thân, sở thích và các chủ đề hàng ngày.",
      B1: "Tập trung vào ngữ pháp trung cấp, viết đoạn văn ngắn, luyện nghe các đoạn hội thoại thực tế.",
      B2: "Phát triển kỹ năng viết luận ngắn, nghe hiểu bài nói học thuật, đọc các bài báo đơn giản.",
      C1: "Luyện nói và viết nâng cao, thực hành thuyết trình và viết báo cáo học thuật.",
      C2: "Hoàn thiện kỹ năng sử dụng tiếng Anh tự nhiên, nâng cao khả năng phân tích và phản biện.",
    };

    setRoadmap(roadmapMap[level] || "Không xác định level.");
  }, [level]);

  if (!level)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <p className="text-xl text-gray-700 mb-4">
          Không tìm thấy kết quả bài test.
        </p>
        <button
          onClick={() => router.push("/quiz")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Quay lại làm bài
        </button>
      </div>
    );

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="flex flex-col items-center justify-center flex-grow p-6">
        <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-lg text-center">
          <h1 className="text-3xl font-bold text-blue-600 mb-4">
            🎯 Your English Level
          </h1>

          <div className="text-6xl font-extrabold text-blue-700 mb-6">
            {level}
          </div>

          <p className="text-gray-700 text-lg mb-6">{roadmap}</p>

          <button
            onClick={() => router.push("/quiz")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Take Another Test
          </button>
        </div>
      </div>
    </main>
  ); 
}
