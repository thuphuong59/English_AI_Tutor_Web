"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

const API_BASE_URL = "http://127.0.0.1:8000";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const primaryColor = "#0067C5";
  const primaryHover = "#0052A3";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/signup";
      const payload = isLogin
        ? { email, password }
        : { email, password, username };

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Something went wrong");

      if (isLogin) {
        const { access_token, token_type, user_role } = data;

        localStorage.setItem("access_token", access_token);
        localStorage.setItem("token_type", token_type);
        localStorage.setItem("adminToken", access_token);

        toast.success("Login successful! Redirecting...");

        let redirectPath = "/";
        if (user_role === "admin") redirectPath = "/admin/users";

        setTimeout(() => (window.location.href = redirectPath), 1200);
      } else {
        toast.success("Signup successful! Please login now.");
        setIsLogin(true);
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e6f0fa] to-[#f8fcff]">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
        <div className="mb-6">
          <Link href="/" className="text-sm text-gray-500 hover:underline">
            ← Back to Home
          </Link>
        </div>

        <h2 className="text-3xl font-extrabold text-center mb-2" style={{ color: primaryColor }}>
          {isLogin ? "Welcome Back" : "Create Account"}
        </h2>
        <p className="text-center text-gray-500 mb-6">
          {isLogin
            ? "Login to continue learning with English AI Tutor"
            : "Sign up to start your English journey"}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Full name"
              className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
              style={{ outlineColor: primaryColor }}
              required
            />
          )}

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
            style={{ outlineColor: primaryColor }}
            required
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
            style={{ outlineColor: primaryColor }}
            required
          />

          {!isLogin && (
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
              style={{ outlineColor: primaryColor }}
              required
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 font-semibold rounded-lg text-white transition ${
              loading ? "bg-gray-400" : ""
            }`}
            style={{ backgroundColor: loading ? undefined : primaryColor }}
          >
            {loading ? "Processing..." : isLogin ? "Login" : "Sign Up"}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="font-semibold hover:underline"
            style={{ color: primaryColor }}
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}
