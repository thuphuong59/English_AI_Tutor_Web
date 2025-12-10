"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useUser } from "./UserContext";
import { Loader2 } from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000";

export default function SettingPage() {
  const router = useRouter();
  const { user, refreshUser } = useUser();

  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);



  useEffect(() => {
    if (user) {
      setUsername(user.username || user.user_metadata?.username || "");
      setAvatarUrl(user.avatar_url || user.user_metadata?.avatar_url || null);
    }
  }, [user]);



  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarUrl(URL.createObjectURL(file));
    }
  };


  const handleSaveChanges = async () => {
    setIsSavingProfile(true);

    try {
      let updatedAvatarUrl = avatarUrl;
      const token = localStorage.getItem("access_token");

      if (avatarFile) {
        const formData = new FormData();
        formData.append("file", avatarFile);

        const res = await fetch(`${API_BASE_URL}/user/upload-avatar`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Upload failed");

        updatedAvatarUrl = data.avatar_url;
      }

      const body: any = {};
      if (username) body.username = username;
      if (updatedAvatarUrl) body.avatar_url = updatedAvatarUrl;

      const res = await fetch(`${API_BASE_URL}/user/update-profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Update failed");

      toast.success("Profile updated!");
      await refreshUser();

      router.push("/profile");   // <== chuyển trang

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };



  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword)
      return toast.error("Fill both fields");

    setIsChangingPassword(true);

    try {
      const token = localStorage.getItem("access_token");

      const res = await fetch(`${API_BASE_URL}/user/change-password`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);

      toast.success("Password changed!");
      setOldPassword("");
      setNewPassword("");

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsChangingPassword(false);
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center px-3 bg-gradient-to-br from-gray-100 via-white to-gray-100">

      <div className="bg-white rounded-2xl shadow-xl px-8 py-10 max-w-xl w-full">
        
        <h2 className="text-3xl font-bold text-center mb-8 text-blue-600">
          User Settings
        </h2>


        {/* Avatar */}
        <div className="flex justify-center mb-8">
          <div className="relative">

            {avatarUrl && (
              <img
                src={avatarUrl ?? undefined}
                alt="avatar"
                className="w-36 h-36 rounded-full object-cover shadow border-4 border-blue-400"
              />
            )}

            <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 cursor-pointer shadow-md">
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              ✏️
            </label>
          </div>
        </div>



        <div className="mb-6">
          <label className="block font-semibold mb-1 text-gray-600">Username</label>

          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            placeholder="Enter username"
          />
        </div>



        <div className="pt-6 border-t">
          <h3 className="font-semibold text-lg text-gray-700 mb-4">Change Password</h3>

          <input type="password" placeholder="Old password"
            value={oldPassword} onChange={(e)=>setOldPassword(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 mb-3 focus:ring-2 focus:ring-blue-500"
          />

          <input type="password" placeholder="New password"
            value={newPassword} onChange={(e)=>setNewPassword(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 mb-4 focus:ring-2 focus:ring-blue-500"
          />

          <button
            disabled={isChangingPassword}
            onClick={handleChangePassword}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg py-2 transition"
          >
            {isChangingPassword ? "Changing…" : "Change Password"}
          </button>
        </div>



        <button
          disabled={isSavingProfile}
          onClick={handleSaveChanges}
          className="mt-6 w-full py-3 font-semibold rounded-xl shadow bg-green-600 hover:bg-green-700 text-white"
        >
          {isSavingProfile ? <Loader2 className="animate-spin inline"/> : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
