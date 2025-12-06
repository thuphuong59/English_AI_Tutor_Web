"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useUser } from "./UserContext";

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

  // Load dữ liệu user hiện tại
  useEffect(() => {
    if (user) {
      setUsername(user.username || user.user_metadata?.username || "");
      setAvatarUrl(user.avatar_url || user.user_metadata?.avatar_url || "");
    }
  }, [user]);

  // Upload avatar tạm thời trước khi nhấn Save
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarUrl(URL.createObjectURL(file));
    }
  };

  // Lưu thay đổi
  const handleSaveChanges = async () => {
    setLoading(true);
    try {
      let newAvatarUrl = avatarUrl;

      if (avatarFile) {
        const token = localStorage.getItem("access_token");
        const formData = new FormData();
        formData.append("file", avatarFile);

        const res = await fetch(`${API_BASE_URL}/user/upload-avatar`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Avatar upload failed");
        newAvatarUrl = data.avatar_url;
      }

      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_BASE_URL}/user/update-profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ username, avatar_url: newAvatarUrl }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Profile update failed");

      toast.success("Profile updated successfully!");
      await refreshUser();

      setTimeout(() => router.push("/profile"), 1200);
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      return toast.error("Please fill both password fields!");
    }

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
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-[#0067C5] text-center mb-6">
          User Settings
        </h2>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <img
              src={avatarUrl || "/default-avatar.png"}
              alt="Avatar"
              className="w-32 h-32 rounded-full object-cover border-4 border-[#0067C5]"
            />
            <label className="absolute bottom-0 right-0 bg-[#0067C5] p-2 rounded-full cursor-pointer hover:bg-blue-700 text-white">
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
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#0067C5]"
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
            className="w-full border rounded-lg px-4 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-[#0067C5]"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#0067C5]"
          />
          <button
            onClick={handleChangePassword}
            className="mt-3 w-full bg-[#0067C5] text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Change Password
          </button>
        </div>

        {/* Save Changes */}
        <div className="text-center">
          <button
            onClick={handleSaveChanges}
            disabled={loading}
            className={`w-full px-6 py-2 font-semibold rounded-lg text-white ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#0067C5] hover:bg-blue-700 transition"
            }`}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
