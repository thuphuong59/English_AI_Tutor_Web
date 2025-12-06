import Image from "next/image";
import Link from "next/link";
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-[#F9F4EF] via-[#F4FFFB] to-[#E6ECFF]">
      {/* Hero Section với animated background */}
      <section className="relative flex flex-1 flex-col items-center justify-center text-center px-6 py-20 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-40 right-1/4 w-64 h-64 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-emerald-200 mb-8 shadow-lg">
            <span className="text-emerald-600 font-medium">🚀 AI-Powered Learning</span>
          </div>

          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black mb-6">
            <span className="bg-gradient-to-r from-[#98F5E1] via-[#6B63FF] to-[#B9B4FF] bg-clip-text text-transparent">
              Master English 
            </span>
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-500 bg-clip-text text-transparent leading-tight block">
              Like Never Before
            </span>
          </h1>

          <p className="mt-8 text-xl md:text-2xl text-gray-700 max-w-4xl font-light leading-relaxed">
            Experience language learning with AI that adapts to your pace,
            <br className="hidden md:block" />
            corrects your pronunciation, and makes every conversation count.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button className="group px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl shadow-2xl hover:shadow-emerald-500/25 hover:scale-105 transition-all duration-300 transform">
              <span className="flex items-center gap-3">
                🚀 Start Learning Now
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
            <button className="group px-10 py-4 bg-white/90 backdrop-blur-sm text-gray-700 font-bold border-2 border-gray-200 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 hover:border-emerald-300 transition-all duration-300">
              <span className="flex items-center gap-3">
                🎧 Try Voice Demo
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1a3 3 0 000-6h-1m4.64 0a3 3 0 000 6M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
            </button>
          </div>

          {/* Hero Illustration với glassmorphism */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent rounded-3xl blur-xl"></div>
            <Image
              src="/learning.svg"
              alt="AI English Tutor"
              width={700}
              height={500}
              className="relative w-full max-w-4xl drop-shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Features Section với modern cards */}
      <section className="py-24 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full mb-6">
              <span className="text-emerald-700 font-semibold">✨ Premium Features</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">
              Everything You Need to
              <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent block">
                Excel in English
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered platform combines cutting-edge technology with proven learning methods
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Pronunciation Card */}
            <Link href="/pronunciation" className="group block">
              <div className="relative p-8 bg-gradient-to-br from-emerald-50 to-green-100 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-emerald-200/50">
                <div className="absolute top-6 right-6 w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  🎤
                </div>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-emerald-800 mb-4">Perfect Pronunciation</h3>
                  <p className="text-emerald-700 leading-relaxed">
                    Real-time AI feedback analyzes your speech patterns and guides you to native-level pronunciation
                  </p>
                </div>
                <div className="flex items-center text-emerald-600 font-semibold group-hover:gap-3 transition-all">
                  <span>Start practicing</span>
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* Conversation Card */}
            <Link href="/conversation" className="group block">
              <div className="relative p-8 bg-gradient-to-br from-teal-50 to-cyan-100 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-teal-200/50">
                <div className="absolute top-6 right-6 w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  💬
                </div>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-teal-800 mb-4">Smart Conversations</h3>
                  <p className="text-teal-700 leading-relaxed">
                    Engage in realistic dialogues with AI that adapts to your skill level and interests


                    
                  </p>
                </div>
                <div className="flex items-center text-teal-600 font-semibold group-hover:gap-3 transition-all">
                  <span>Start chatting</span>
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* Vocabulary Card */}
            <Link href="/vocabulary" className="group block">
              <div className="relative p-8 bg-gradient-to-br from-yellow-50 to-amber-100 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-yellow-200/50">
                <div className="absolute top-6 right-6 w-12 h-12 bg-yellow-500 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  📚
                </div>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-yellow-800 mb-4">Dynamic Vocabulary</h3>
                  <p className="text-yellow-700 leading-relaxed">
                    Learn words that matter with spaced repetition and contextual examples
                  </p>
                </div>
                <div className="flex items-center text-yellow-600 font-semibold group-hover:gap-3 transition-all">
                  <span>Expand vocabulary</span>
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer với dark mode và glassmorphism */}
      <footer className="relative bg-gradient-to-b from-gray-900 via-slate-900 to-black overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
          <div className="grid lg:grid-cols-4 gap-12 mb-16">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-white font-bold text-xl">E</span>
                </div>
                <h3 className="text-2xl font-bold text-white">English AI Tutor</h3>
              </div>
              <p className="text-gray-300 text-lg leading-relaxed mb-8 max-w-lg">
                Transform your English learning journey with AI that understands your unique needs. 
                Join thousands of learners who've achieved fluency faster than ever before.
              </p>
              
              {/* Social Links */}
              <div className="flex space-x-4">
                {[
                  { icon: "M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z", color: "hover:bg-blue-500" },
                  { icon: "M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z", color: "hover:bg-blue-400" },
                  { icon: "M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.748-1.378 0 0-.599 2.282-.744 2.84-.282 1.084-1.044 2.441-1.551 3.271C9.088 23.746 10.519 24 12.017 24c6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001 12.017.001z", color: "hover:bg-red-500" }
                ].map((social, idx) => (
                  <a key={idx} href="#" className={`w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center text-gray-400 ${social.color} hover:text-white transition-all duration-300 hover:scale-110`}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d={social.icon}/>
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-xl font-bold text-white mb-6">Learning Paths</h4>
              <ul className="space-y-4">
                {['Pronunciation Mastery', 'Conversation Practice', 'Vocabulary Builder', 'Grammar Guide', 'Fluency Tests'].map((item, idx) => (
                  <li key={idx}>
                    <a href="#" className="text-gray-300 hover:text-emerald-400 transition-colors duration-300 flex items-center group">
                      <svg className="w-4 h-4 mr-3 text-emerald-500 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-xl font-bold text-white mb-6">Support & More</h4>
              <ul className="space-y-4">
                {['Help Center', 'Contact Support', 'Learning Tips', 'Privacy Policy', 'Terms of Service'].map((item, idx) => (
                  <li key={idx}>
                    <a href="#" className="text-gray-300 hover:text-emerald-400 transition-colors duration-300 flex items-center group">
                      <svg className="w-4 h-4 mr-3 text-emerald-500 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-800 pt-8 flex flex-col lg:flex-row justify-between items-center">
            <p className="text-gray-400 mb-4 lg:mb-0 text-center lg:text-left">
              © 2024 English AI Tutor. Empowering learners worldwide with cutting-edge AI technology.
            </p>
            <div className="flex items-center space-x-3 text-gray-400">
              <span>Made with</span>
              <div className="w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
                <span className="text-white text-sm">❤️</span>
              </div>
              <span>for English learners</span>
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center ml-2">
                <span className="text-white text-sm">🌍</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}