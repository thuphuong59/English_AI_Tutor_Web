"use client";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

export default function DashboardPage() {
  // Mock data
  const progressData = [
    { week: "Week 1", score: 55 },
    { week: "Week 2", score: 62 },
    { week: "Week 3", score: 70 },
    { week: "Week 4", score: 78 },
    { week: "Week 5", score: 85 },
  ];

  const skillsData = [
    { skill: "Vocabulary", level: 80 },
    { skill: "Grammar", level: 65 },
    { skill: "Pronunciation", level: 50 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Content */}
      <main className="p-8 space-y-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-teal-600">
          Dashboard & Analytics
        </h1>

        {/* Strengths & Weakness */}
        <section className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Skills Analysis
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={skillsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="skill" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="level" fill="#20c997" />
            </BarChart>
          </ResponsiveContainer>
        </section>

        {/* Progress Chart */}
        <section className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Progress Over Time
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#20c997"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </section>

        {/* Recommendation */}
        <section className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Recommended Focus
          </h2>
          <p className="text-gray-600">
            Based on your performance, we recommend focusing on{" "}
            <span className="font-semibold text-teal-600">Pronunciation</span>{" "}
            to improve your speaking fluency.
          </p>
        </section>
      </main>
    </div>
  );
}
