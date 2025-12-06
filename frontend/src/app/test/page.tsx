"use client";
import Link from "next/link";
import { useAuthStatus } from "../hooks/useAuthStatus";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useState, useEffect } from "react"; 

export default function TestPage() {
  const { userId: currentUserId, isLoading: isAuthLoading } = useAuthStatus();
  const router = useRouter();
  
  // Thêm trạng thái để kiểm soát điều hướng
  const [canProceed, setCanProceed] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Checking session..."); // Sửa default message

  useEffect(() => {
    // Logic này chỉ cập nhật nút, KHÔNG điều hướng
    if (!isAuthLoading) {
        if (currentUserId) {
            // Đã đăng nhập: cho phép nhấn nút
            setCanProceed(true);
            setStatusMessage("Start Testing");
        } else {
            // Chưa đăng nhập: khóa nút, hiển thị thông báo
            setCanProceed(false);
            setStatusMessage("Log in to start");
        }
    } else {
        // Vẫn đang tải
        setStatusMessage("Checking session...");
    }
  }, [isAuthLoading, currentUserId]); // Loại bỏ router để tránh chạy lại không cần thiết

  const handleStartTesting = (e: { preventDefault: () => void; }) => {
    if (isAuthLoading) {
        toast.error("Vui lòng đợi kiểm tra trạng thái đăng nhập.");
        e.preventDefault();
        return;
    }
      
    if (!currentUserId) {
      toast.error("You must be logged in to start the test.");
      router.push('/auth'); // Chỉ điều hướng khi click VÀ không có ID
      e.preventDefault();
      return;
    }
    // Nếu có ID, Link sẽ tự động điều hướng đến /preferences
  };

  // Nút bị vô hiệu hóa khi đang tải hoặc khi chưa có user ID
  const buttonDisabled = isAuthLoading || !currentUserId;
  const buttonStyle = buttonDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-brand-DEFAULT hover:bg-brand-dark';
  
  // Hiển thị trạng thái loading riêng biệt để tránh lỗi
  if (isAuthLoading) {
      return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
          <p className="text-lg text-gray-600">{statusMessage}</p>
        </main>
      );
  }

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-white">
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-4xl font-extrabold text-brand-DEFAULT mb-6 drop-shadow">
          Test Your English Level
        </h2>
        <p className="text-gray-700 mb-8">
          The following test will assess your current English proficiency and help us
          design a personalized learning roadmap.
        </p>
        <div className="bg-white shadow-lg p-8 rounded-2xl">
          <p className="text-gray-500 mb-4">[ The test will take approximately 30 minutes. ]</p>
          <Link href="/preferences" onClick={handleStartTesting} passHref>
            <button 
                disabled={buttonDisabled}
                className={`px-8 py-4 text-white rounded-xl shadow-2xl shadow-brand-DEFAULT/50 transition transform duration-300 font-semibold text-lg ${buttonStyle}`}
            >
              {statusMessage}
            </button>
          </Link>
          
          {!currentUserId && (
              <p className="mt-4 text-sm text-red-500 font-medium">Vui lòng đăng nhập để bắt đầu.</p>
          )}

        </div>
      </section>
    </main>
  );
}