"use client";

import { useState, useRef } from "react";

export default function PracticePage() {
  const [target, setTarget] = useState("I want to learn English");
  const [result, setResult] = useState<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);

    mediaRecorderRef.current = mediaRecorder;
    chunks.current = [];

    mediaRecorder.ondataavailable = (e) => chunks.current.push(e.data);

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks.current, { type: "audio/wav" });

      const formData = new FormData();
      formData.append("audio", blob);
      formData.append("text", target);

      const res = await fetch("http://localhost:8000/speech/evaluate", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setResult(data);
    };

    mediaRecorder.start();
    console.log("Recording...");
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    console.log("Stopped");
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-emerald-600">
        Luyện phát âm
      </h1>

      <label className="font-semibold">Nhập câu bạn muốn đọc:</label>
      <input
        className="border p-2 w-full rounded-md mb-4"
        value={target}
        onChange={(e) => setTarget(e.target.value)}
      />

      <div className="flex gap-4">
        <button
          onClick={startRecording}
          className="bg-green-600 text-white px-4 py-2 rounded-lg"
        >
          🎤 Bắt đầu
        </button>

        <button
          onClick={stopRecording}
          className="bg-red-600 text-white px-4 py-2 rounded-lg"
        >
          ⛔ Dừng
        </button>
      </div>

      {result && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold">Kết quả phân tích</h3>
          <p className="text-gray-600 mt-2">
            Bạn đọc: <i>{result.transcript}</i>
          </p>

          <div className="mt-4 flex gap-2 flex-wrap">
            {result.compare.map((item: any, index: number) => (
              <span
                key={index}
                className={`px-2 py-1 rounded-lg ${
                  item.correct ? "bg-green-200" : "bg-red-300"
                }`}
              >
                {item.word}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}