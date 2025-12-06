/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // Kết hợp cả hai phần theme (cấu hình màu xanh và animation)
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"], // font chính toàn web
      },
      colors: {
        brand: {
          light: "#93c5fd", // xanh nhạt
          DEFAULT: "#3b82f6", // xanh chính
          dark: "#1e40af", // xanh đậm
        },
      },
      boxShadow: {
        card: "0 4px 20px rgba(0,0,0,0.1)",
        button: "0 2px 10px rgba(59,130,246,0.4)", // shadow xanh cho nút
      },
      // Thêm animation và keyframes từ phiên bản còn lại
      animation: {
        'bounce': 'bounce 1s infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin': 'spin 1s linear infinite',
      },
      keyframes: {
        bounce: {
          '0%, 100%': {
            transform: 'translateY(-25%)',
            animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
          },
          '50%': {
            transform: 'translateY(0)',
            animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/line-clamp'),
  ],
};