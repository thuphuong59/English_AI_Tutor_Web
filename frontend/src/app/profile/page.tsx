export default function ProfilePage() {
  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-[#EAF3FB] to-white">
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-[#0067C5] mb-10 text-center">
          👤 Your Profile
        </h2>

        {/* Profile Card */}
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center border border-[#C7E0F9]">
          <h3 className="text-2xl font-semibold text-slate-800">Thu Phuong</h3>
          <p className="text-slate-500 mb-6">Intermediate Learner</p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
            <div className="bg-[#EAF3FB] rounded-xl p-4 shadow border border-[#C7E0F9]">
              <p className="text-xl font-bold text-[#0067C5]">120</p>
              <p className="text-slate-600 text-sm">Words Learned</p>
            </div>
            <div className="bg-[#EAF3FB] rounded-xl p-4 shadow border border-[#C7E0F9]">
              <p className="text-xl font-bold text-[#0067C5]">15</p>
              <p className="text-slate-600 text-sm">Quizzes Done</p>
            </div>
            <div className="bg-[#EAF3FB] rounded-xl p-4 shadow border border-[#C7E0F9]">
              <p className="text-xl font-bold text-[#0067C5]">8 hrs</p>
              <p className="text-slate-600 text-sm">Practice Time</p>
            </div>
            <div className="bg-[#EAF3FB] rounded-xl p-4 shadow border border-[#C7E0F9]">
              <p className="text-xl font-bold text-[#0067C5]">B1</p>
              <p className="text-slate-600 text-sm">Current Level</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}