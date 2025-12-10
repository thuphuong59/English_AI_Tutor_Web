"use client";
import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import { RoadmapSection } from "./components/RoadmapSection";

export default function ProfilePage() {
  const [userData, setUserData] = useState({
    name: "Loading...",
    level: "Calculating...",
    learnerType: "Student",
    avatar: null,
    currentGoal: "",
    currentDuration: "",
  });

  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const userId = localStorage.getItem("authenticatedUserId");
        const token = localStorage.getItem("access_token");
        if (!userId || !token) return;

        const res = await fetch(`http://localhost:8000/user/profile`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });

        if (res.status === 401) return;

        const data = await res.json();
        setUserData({
          name: data.username,
          level: data.level,
          learnerType: data.learner_type,
          avatar: data.avatar_url || null,
          currentGoal: data.current_goal,
          currentDuration: data.current_duration,
        });
      } catch (err) {
        console.error("Lỗi:", err);
      }
    }
    fetchUserInfo();
  }, []);

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-20">

      <section className="max-w-6xl mx-auto px-6 mt-10">
        {/* Container Grid chia 2 cột */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ✅ CỘT TRÁI ĐƯỢC CỐ ĐỊNH (STIKCY) */}
          <aside className="lg:col-span-4 lg:sticky lg:top-10 space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4">
                  {userData.avatar ? (
                    <img
                      src={userData.avatar}
                      alt="User Avatar"
                      className="w-24 h-24 rounded-full object-cover border shadow-md"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-[#EAF3FB] flex items-center justify-center text-3xl">
                      👩‍🎓
                    </div>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-slate-800">{userData.name}</h3>
                <p className="text-[#0067C5] font-medium text-sm">{userData.level}</p>
              </div>
              
              <div className="mt-8 space-y-4">
                <StatRow value={userData.currentGoal} label="Mục tiêu chính" icon="🎯" />
                <StatRow value={userData.currentDuration} label="Thời gian dự kiến" icon="⏱️" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#0067C5] to-[#004a8d] p-6 rounded-3xl text-white shadow-lg">
              <h4 className="font-bold mb-2 text-sm">💡 Tips hôm nay</h4>
              <p className="text-[13px] text-blue-100 leading-relaxed italic">
                "Hãy dành ít nhất 15 phút luyện nghe mỗi ngày để duy trì phản xạ nhé!"
              </p>
            </div>
          </aside>

          {/* CỘT PHẢI (Cuộn tự do) */}
          <div className="lg:col-span-8">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                   Lộ trinh học tập của bạn
                </h2>
                <span className="text-[10px] font-black text-[#0067C5] bg-[#EAF3FB] px-3 py-1 rounded-full uppercase">
                  Dữ liệu AI mới nhất
                </span>
              </div>
              
              <RoadmapSection />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function StatRow({ value, label, icon }: { value: string, label: string, icon: string }) {
  return (
    <div className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-colors">
      <div className="w-10 h-10 bg-white shadow-sm border border-slate-100 rounded-xl flex items-center justify-center text-lg">{icon}</div>
      <div>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">{label}</p>
        <p className="text-slate-800 font-bold text-base leading-tight">{value || "Chưa cập nhật"}</p>
      </div>
    </div>
  );
}