"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useUser } from "./UserContext"; // Giả định hook này tồn tại
import { Loader2 } from 'lucide-react'; // Import icon loading

const API_BASE_URL = "http://127.0.0.1:8000";

export default function SettingPage() {
  const router = useRouter();
  const { user, refreshUser } = useUser();

  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);


  // Load dữ liệu user hiện tại
  useEffect(() => {
    if (user) {
      setUsername(user.username || user.user_metadata?.username || "");
      setAvatarUrl(user.avatar_url || user.user_metadata?.avatar_url || "/default-avatar.png");
    }
  }, [user]);

  // Upload avatar tạm thời trước khi nhấn Save
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      // Hiển thị preview ảnh mới
      setAvatarUrl(URL.createObjectURL(file)); 
    }
  };

  // --- LƯU THAY ĐỔI USERNAME/AVATAR ---
  const handleSaveChanges = async () => {
    setIsSavingProfile(true);
    setLoading(true); // Chỉ dùng cho nút save chung

    try {
      let updatedAvatarUrl = avatarUrl;
      const token = localStorage.getItem("access_token");

      // 1. Xử lý Upload Avatar (Nếu có file mới)
      if (avatarFile) {
        const formData = new FormData();
        formData.append("file", avatarFile);

        const res = await fetch(`${API_BASE_URL}/user/upload-avatar`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        const uploadData = await res.json();
        if (!res.ok) throw new Error(uploadData.detail || "Avatar upload failed");
        updatedAvatarUrl = uploadData.avatar_url; // Lấy URL đã lưu trên server
      }

      // 2. Cập nhật Profile (Username và Avatar URL mới)
      const res = await fetch(`${API_BASE_URL}/user/update-profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json", // Dùng JSON thay vì form-urlencoded
        },
        body: JSON.stringify({ username, avatar_url: updatedAvatarUrl }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Profile update failed");

      toast.success("Profile updated successfully!");
      await refreshUser(); // BẮT BUỘC: Tải lại thông tin user trên toàn bộ ứng dụng

      setTimeout(() => router.push("/profile"), 800); // Điều hướng sau khi cập nhật
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setIsSavingProfile(false);
      setLoading(false);
    }
  };

  // --- THAY ĐỔI MẬT KHẨU ---
  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      return toast.error("Please fill both password fields!");
    }
    setIsChangingPassword(true);

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_BASE_URL}/user/change-password`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Password update failed");

      toast.success("Password changed successfully!");
      setOldPassword("");
      setNewPassword("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-brand-DEFAULT text-center mb-6">
          User Settings
        </h2>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <img
              src={avatarUrl || "/default-avatar.png"}
              alt="Avatar"
              className="w-32 h-32 rounded-full object-cover border-4 border-brand-DEFAULT"
            />
            <label className="absolute bottom-0 right-0 bg-brand-DEFAULT p-2 rounded-full cursor-pointer hover:bg-brand-dark text-white shadow-md">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              ✏️
            </label>
          </div>
        </div>

        {/* Username */}
        <div className="mb-6">
          <label className="block font-semibold mb-1 text-gray-700">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-DEFAULT"
          />
        </div>

        {/* Change Password */}
        <div className="mb-6 border-t pt-6">
          <h3 className="font-semibold text-lg mb-3 text-gray-700">
            Change Password
          </h3>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="Old password"
            className="w-full border rounded-lg px-4 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-brand-DEFAULT"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-DEFAULT"
          />
          <button
            onClick={handleChangePassword}
            disabled={isChangingPassword}
            className={`mt-3 w-full px-4 py-2 rounded-md transition ${
                isChangingPassword 
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-brand-DEFAULT text-white hover:bg-brand-dark"
            }`}
          >
            {isChangingPassword ? "Changing..." : "Change Password"}
          </button>
        </div>

        {/* Save Changes */}
        <div className="text-center">
          <button
            onClick={handleSaveChanges}
            disabled={isSavingProfile || isChangingPassword}
            className={`w-full px-6 py-2 font-semibold rounded-lg text-white shadow-lg shadow-brand-DEFAULT/30 ${
              isSavingProfile || isChangingPassword
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-brand-DEFAULT hover:bg-brand-dark transition"
            }`}
          >
            {isSavingProfile ? <Loader2 size={20} className="inline animate-spin mr-2" /> : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}