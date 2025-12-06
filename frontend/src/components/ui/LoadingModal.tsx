// frontend/src/components/LoadingModal.tsx

import React from "react";

interface LoadingModalProps {
  title?: string;
  message?: string;
}

export default function LoadingModal({
  title = "ĐANG XỬ LÝ",
  message = "Vui lòng chờ trong giây lát...",
}: LoadingModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-80 backdrop-blur-md">
      <div className="bg-white p-10 rounded-xl shadow-2xl max-w-sm w-full text-center transform scale-100 transition-all duration-300 border-2 border-emerald-400">
        
        {/* Spinner */}
        <div className="mx-auto w-12 h-12 border-4 border-gray-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>

        {/* Dynamic Title */}
        <h2 className="text-xl font-extrabold text-emerald-700 mb-2">
          {title}
        </h2>

        {/* Dynamic Message */}
        <p className="text-gray-600 font-medium">
          {message}
        </p>
      </div>
    </div>
  );
}
