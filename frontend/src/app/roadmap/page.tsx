"use client";
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface DailyBreakdownItem {
  time_allocation: string;
  activity: string;
}

interface Milestone {
  milestone_name: string;
  target_score_goal: string;
  milestone_requirements: string[];
}

interface Stage {
  stage_number?: string;
  duration?: string;
  focus?: string;
  daily_breakdown?: DailyBreakdownItem[];
  grammar_focus?: string[];
  speaking_practice?: string[];
  reflex_building?: string;
  expected_outcomes?: string;
  milestone?: Milestone;
}

interface DiagnosticSummary {
  estimated_level?: string;
  weak_topics?: string[];
  score_percent?: number;
  correct_count?: number;
  total_questions?: number;
}

interface UserProgress {
  [activityId: string]: {
    completed: boolean;
    score?: number;
  };
}

interface RoadmapDetails {
  roadmap?: Stage[];
  diagnostic_summary?: DiagnosticSummary;
  summary?: string;
  current_status?: string;
  userProgress?: UserProgress;
}

export default function RoadmapPage() {
  const [roadmap, setRoadmap] = useState<RoadmapDetails | null>(null);
  const [rawJson, setRawJson] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showJson, setShowJson] = useState(false);

  useEffect(() => {
    async function loadRoadmap() {
      setIsLoading(true);

      try {
        const userId = localStorage.getItem("authenticatedUserId");
        if (!userId) {
          toast.error("Không tìm thấy userId. Vui lòng đăng nhập lại.");
          setIsLoading(false);
          return;
        }

        const res = await fetch(`http://localhost:8000/assessment/${userId}`);
        if (!res.ok) throw new Error("Không thể kết nối server");

        const data = await res.json();

        if (data.status !== "success" || !data.roadmap) {
          toast.error("Không tìm thấy lộ trình học tập.");
          setRawJson(data);
          setIsLoading(false);
          return;
        }

        setRawJson(data);

        const rawRoadmap = data.roadmap || {};
        const phases = rawRoadmap.learning_phases || [];

        const roadmapArray: Stage[] = phases.map((s: any, index: number): Stage => {
          const focusPoints: string[] = s.focus_points || [];
          const dailyActivities: DailyBreakdownItem[] = (s.daily_activities || []).map((d: any) => ({
            time_allocation: d.time_estimate || "30 phút",
            activity: d.activity || "Hoạt động chưa xác định",
          }));

          const grammarFocus = focusPoints.filter((f: string) =>
            f.toLowerCase().includes("grammar") || f.toLowerCase().includes("ngữ pháp")
          );

          const speakingActivities = dailyActivities
            .filter((d) => /luyện nói|role.?play|tự nói|nghe nhắc lại|shadowing/i.test(d.activity))
            .map((d) => d.activity);

          const reflexActivities = dailyActivities
            .filter((d) => /role.?play|trả lời nhanh|phản xạ|reflex/i.test(d.activity))
            .map((d) => d.activity)
            .join("; ") || undefined;

          return {
            stage_number: s.phase_name || `Giai đoạn ${index + 1}`,
            duration: s.duration || "1 tuần",
            focus: focusPoints.join(", ") || "Cải thiện toàn diện",
            daily_breakdown: dailyActivities.length > 0 ? dailyActivities : undefined,
            grammar_focus: grammarFocus.length > 0 ? grammarFocus : undefined,
            speaking_practice: speakingActivities.length > 0 ? speakingActivities : undefined,
            reflex_building: reflexActivities,
            expected_outcomes: s.expected_outcomes || "Cải thiện kỹ năng cơ bản",
            milestone: s.milestone || undefined,
          };
        });

        setRoadmap({
          roadmap: roadmapArray,
          diagnostic_summary: rawRoadmap.diagnostic_summary || {},
          summary: rawRoadmap.summary || "Lộ trình đang được xây dựng...",
          current_status: rawRoadmap.current_status || "Chưa bắt đầu",
          userProgress: rawRoadmap.userProgress || {},
        });
      } catch (err) {
        console.error("Lỗi tải roadmap:", err);
        toast.error("Lỗi kết nối server. Vui lòng thử lại sau.");
      } finally {
        setIsLoading(false);
      }
    }

    loadRoadmap();
  }, []);

  const handleStartActivity = (activityId: string, activityName: string) => {
    toast.success(`Bắt đầu: ${activityName}`);
    // TODO: Mở modal hoặc chuyển hướng đến bài tập
    console.log("Start activity:", activityId, activityName);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl">Đang tải lộ trình học tập của bạn...</div>
      </main>
    );
  }

  if (!roadmap || !roadmap.roadmap || roadmap.roadmap.length === 0) {
    return (
      <main className="min-h-screen p-6 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center mt-10">
          <h2 className="text-3xl font-bold text-red-600 mb-4">
            Không tìm thấy lộ trình học tập
          </h2>
          <p className="text-gray-600 mb-6">
            Có thể bạn chưa làm bài kiểm tra đầu vào hoặc dữ liệu bị lỗi.
          </p>
          <button
            onClick={() => setShowJson(true)}
            className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
          >
            Xem dữ liệu thô (Raw JSON)
          </button>
        </div>

        {showJson && rawJson && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-auto p-6">
              <h3 className="text-xl font-bold mb-4">Raw JSON từ Server</h3>
              <pre className="text-xs bg-gray-100 p-4 rounded overflow-x-auto">
                {JSON.stringify(rawJson, null, 2)}
              </pre>
              <button
                onClick={() => setShowJson(false)}
                className="mt-4 px-5 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </main>
    );
  }

  const { roadmap: stages, diagnostic_summary, userProgress = {} } = roadmap;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Debug Modal */}
      {showJson && rawJson && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-auto p-6">
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-x-auto">
              {JSON.stringify(rawJson, null, 2)}
            </pre>
            <button
              onClick={() => setShowJson(false)}
              className="mt-4 px-5 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      <div className="container mx-auto p-6 mt-8 max-w-5xl">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-emerald-700">
            Lộ Trình Học Tập Cá Nhân Hóa
          </h1>
          <p className="text-xl text-gray-700 mt-3">
            Trình độ hiện tại:{" "}
            <span className="font-bold text-emerald-600 text-2xl">
              {diagnostic_summary?.estimated_level || "Chưa xác định"}
            </span>
          </p>
        </header>

        {/* Tóm tắt chẩn đoán */}
        <section className="bg-white p-8 rounded-2xl shadow-lg border-l-8 border-emerald-500 mb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Nhận xét từ bài kiểm tra</h2>
          {roadmap.summary && (
            <p className="text-gray-700 mb-3 leading-relaxed">
              <strong className="text-emerald-700">Tóm tắt:</strong> {roadmap.summary}
            </p>
          )}
          {roadmap.current_status && (
            <p className="text-gray-700 mb-3">
              <strong className="text-emerald-700">Trạng thái:</strong> {roadmap.current_status}
            </p>
          )}
          <p className="text-gray-700 mb-3">
            <strong className="text-emerald-700">Điểm yếu:</strong>{" "}
            {diagnostic_summary?.weak_topics?.length
              ? diagnostic_summary.weak_topics.join(" • ")
              : "Không xác định"}
          </p>
          <p className="text-lg font-semibold text-emerald-600">
            Kết quả: {diagnostic_summary?.correct_count ?? 0}/
            {diagnostic_summary?.total_questions ?? 0} câu đúng →{" "}
            {(diagnostic_summary?.score_percent ?? 0).toFixed(0)}%
          </p>
        </section>

        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Các Giai Đoạn Học Tập
        </h2>

        <div className="space-y-8">
          {stages.map((stage, idx) => {
            const dailyActivities = stage.daily_breakdown || [];
            const completedCount = dailyActivities.reduce((acc, _, i) => {
              const activityId = `${stage.stage_number || idx}_activity_${i}`;
              return userProgress[activityId]?.completed ? acc + 1 : acc;
            }, 0);
            const progress = dailyActivities.length > 0
              ? (completedCount / dailyActivities.length) * 100
              : 0;

            return (
              <div
                key={`${stage.stage_number || "stage"}-${idx}`}
                className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200"
              >
                <div className="bg-emerald-600 text-white p-5 flex justify-between items-center">
                  <h3 className="text-2xl font-bold">
                    {stage.stage_number || `Giai đoạn ${idx + 1}`}
                  </h3>
                  <span className="text-lg font-medium">{stage.duration || "1-2 tuần"}</span>
                </div>

                <div className="p-6">
                  <p className="mb-4 text-gray-700">
                    <strong className="text-emerald-700">Trọng tâm:</strong> {stage.focus}
                  </p>

                  {dailyActivities.length > 0 && (
                    <>
                      <div className="mb-5">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Tiến độ giai đoạn</span>
                          <span>{completedCount}/{dailyActivities.length} hoàn thành</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${progress.toFixed(0)}%` }}
                          />
                        </div>
                      </div>

                      <div className="mb-6">
                        <h4 className="font-semibold text-lg mb-3 text-emerald-700">
                          Lịch học hàng ngày
                        </h4>
                        <ul className="space-y-3">
                          {dailyActivities.map((d, i) => {
                            const activityId = `${stage.stage_number || idx}_activity_${i}`;
                            const isCompleted = userProgress[activityId]?.completed;
                            const score = userProgress[activityId]?.score;

                            return (
                              <li
                                key={activityId}
                                className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                              >
                                <div>
                                  <span className="font-medium text-emerald-700">
                                    {d.time_allocation}
                                  </span>{" "}
                                  — {d.activity}
                                </div>
                                {isCompleted ? (
                                  <span className="text-green-600 font-bold">
                                    Hoàn thành {score !== undefined && `(${score}/10)`}
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleStartActivity(activityId, d.activity)}
                                    className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
                                  >
                                    Bắt đầu
                                  </button>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </>
                  )}

                  {stage.grammar_focus && stage.grammar_focus.length > 0 && (
                    <p className="mb-3">
                      <strong className="text-blue-700">Ngữ pháp:</strong>{" "}
                      {stage.grammar_focus.join(" • ")}
                    </p>
                  )}

                  {stage.speaking_practice && stage.speaking_practice.length > 0 && (
                    <p className="mb-3">
                      <strong className="text-purple-700">Luyện nói:</strong>{" "}
                      {stage.speaking_practice.join(" • ")}
                    </p>
                  )}

                  {stage.reflex_building && (
                    <p className="mb-3">
                      <strong className="text-orange-700">Phản xạ:</strong> {stage.reflex_building}
                    </p>
                  )}

                  {stage.expected_outcomes && (
                    <p className="mb-4 text-gray-700">
                      <strong className="text-emerald-700">Kết quả mong đợi:</strong>{" "}
                      {stage.expected_outcomes}
                    </p>
                  )}

                  {stage.milestone && (
                    <div className="mt-6 p-5 bg-amber-50 rounded-xl border border-amber-200">
                      <h4 className="font-bold text-xl text-amber-800 mb-2">
                        Mốc quan trọng: {stage.milestone.milestone_name}
                      </h4>
                      <p className="text-amber-700 font-medium mb-2">
                        Mục tiêu: {stage.milestone.target_score_goal}
                      </p>
                      <ul className="list-disc pl-5 text-amber-900">
                        {stage.milestone.milestone_requirements.map((req, i) => (
                          <li key={i}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}