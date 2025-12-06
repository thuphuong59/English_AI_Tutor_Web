"use client"; 

import Link from "next/link";
import React, { useState } from "react";

const videoResources = [
  {
    id: "1",
    title: "The benefits of a bilingual brain",
    channel: "TED-Ed",
    youtubeId: "Z18Z81cz6tk",
    description: "Mia Nacamulli details the three types of bilingual brains and how knowing more than one language keeps your brain healthy."
  },
  {
    id: "2",
    title: "Secrets to Learning English",
    channel: "Speak English With Vanessa",
    youtubeId: "638ly8cFPME",
    description: "Simple tips to help you become a confident and fluent English speaker."
  },
  {
    id: "3",
    title: "Small Talk & Conversation",
    channel: "mmmEnglish",
    youtubeId: "sLPO3iS0iqM",
    description: "Learn natural English expressions for small talk and daily conversation."
  },
  {
    id: "4",
    title: "The secrets of learning a new language",
    channel: "TED",
    youtubeId: "o_XVt5rdpFY",
    description: "Lýdia Machová reveals the core principles used by polyglots to master languages quickly."
  },
  {
    id: "5",
    title: "Stop saying VERY Use these alternatives to sound like a native",
    channel: "linguamarina",
    youtubeId: "Fj88r-v7EPo",
    description: "Expand your vocabulary with advanced adjectives to sound more fluent."
  },
  {
    id: "6",
    title: "How to THINK in English",
    channel: "JamesESL English Lessons",
    youtubeId: "FUW_FN8uzy0",
    description: "Stop translating in your head and start thinking directly in English."
  },
  {
    id: "7",
    title: "Daily English Conversation Practice",
    channel: "English Speaking Course",
    youtubeId: "TesbMy__Uq8",
    description: "Practice your listening and speaking skills with daily English questions and answers."
  },
  {
    id: "8",
    title: "15 Minutes of Listening Practice",
    channel: "English with Alex",
    youtubeId: "EX8RJR4-6PE",
    description: "Challenge your listening skills with short stories and questions."
  },

  {
    id: "9",
    title: "Learn English with Friends (TV Show)",
    channel: "Learn English with TV Series",
    youtubeId: "0ksYrvfOG_w", // Video phân tích phim Friends cực hay
    description: "Learn vocabulary, pronunciation, and expressions from the famous TV show Friends."
  },
  {
    id: "10",
    title: "Slow Listening & Shadowing",
    channel: "Slow English",
    youtubeId: "-SOVLf-g0ZM", // Video luyện nghe chậm & nhại lại
    description: "Perfect for beginners: Listen to slow, clear English and practice shadowing."
  },
  {
    id: "11",
    title: "100 Common Questions & Answers",
    channel: "English Speaking Course",
    youtubeId: "wkjSBC-_bDA", 
    description: "Improve your speaking fluency by practicing 100 common daily questions."
  },
  {
    id: "12",
    title: "Fixing Common Advanced Mistakes",
    channel: "Pronunciation Pro",
    youtubeId: "xW6kk34yowM", // Video ngữ pháp nâng cao
    description: "Fine-tune your grammar and avoid common mistakes made by advanced learners."
  }
];

const VIDEOS_PER_PAGE = 8;

export default function PracticePage() {
  const [visibleCount, setVisibleCount] = useState(VIDEOS_PER_PAGE);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 4); 
  };

  const handleCollapse = () => {
    setVisibleCount(VIDEOS_PER_PAGE);
  };

    return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-white">
      <section className="max-w-[1400px] w-full mx-auto px-6 py-12">

        <div className="mb-20">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 border-l-4 border-[#0067C5] pl-4">
            Interactive Tools
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <Link
              href="/practice/quiz"
              className="block p-8 bg-white shadow-sm hover:shadow-md rounded-xl border border-blue-100
                         transition-all duration-300 hover:-translate-y-1 group flex flex-col justify-center"
            >
              <div className="flex items-center mb-4">
                <div className="p-3 bg-blue-100 rounded-full mr-4 text-blue-600 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold group-hover:text-[#0067C5] transition-colors">
                  Vocabulary Quiz
                </h3>
              </div>
              <p className="text-gray-600 text-base leading-relaxed">
                Test your knowledge with multiple-choice questions, fill-in-the-blanks, and typing challenges.
              </p>
            </Link>

            <Link
              href="/practice/grammar_check"
              className="block p-8 bg-white shadow-sm hover:shadow-md rounded-xl border border-blue-100
                         transition-all duration-300 hover:-translate-y-1 group flex flex-col justify-center"
            >
              <div className="flex items-center mb-4">
                <div className="p-3 bg-green-100 rounded-full mr-4 text-green-600 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold group-hover:text-[#0067C5] transition-colors">
                  Grammar Check
                </h3>
              </div>
              <p className="text-gray-600 text-base leading-relaxed">
                Write sentences and get instant AI feedback on your grammar and spelling.
              </p>
            </Link>
          </div>
        </div>

       <div className="mb-12">
          <div className="flex justify-between items-end mb-6 border-b pb-3 border-gray-200">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 border-l-4 border-red-500 pl-4">
                Recommended Lessons
              </h3>
              <p className="text-gray-500 mt-1 ml-5 text-sm">
                Hand-picked videos from top English teachers.
              </p>
            </div>
            <span className="text-sm text-gray-500 font-medium hidden md:block">
              Showing {Math.min(visibleCount, videoResources.length)} of {videoResources.length} lessons
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videoResources.slice(0, visibleCount).map((video) => (
              <div 
                key={video.id} 
                className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 flex flex-col group animate-fade-in"
              >
                <div className="aspect-video w-full bg-gray-100 relative">
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${video.youtubeId}`}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
                
                <div className="p-4 flex-grow flex flex-col">
                  <h4 className="font-bold text-sm text-gray-900 mb-2 line-clamp-2 leading-tight group-hover:text-blue-700 transition-colors">
                    {video.title}
                  </h4>
                  
                  <div className="flex items-center mb-2">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                    <p className="text-[11px] text-gray-500 uppercase tracking-wider font-bold truncate">
                      {video.channel}
                    </p>
                  </div>
                  
                  <p className="text-gray-500 text-xs line-clamp-2 mt-auto">
                    {video.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            {visibleCount < videoResources.length ? (
              <button
                onClick={handleLoadMore}
                className="px-8 py-3 bg-white border border-blue-200 text-blue-600 font-semibold rounded-full 
                           shadow-sm hover:bg-blue-50 hover:border-blue-300 hover:shadow-md 
                           transition-all duration-200 transform active:scale-95"
              >
                Load More Lessons ({videoResources.length - visibleCount} remaining)
              </button>
            ) : (
              <button
                onClick={handleCollapse}
                className="px-8 py-3 bg-gray-50 border border-gray-200 text-gray-500 font-medium rounded-full 
                           hover:bg-gray-100 transition-all duration-200 text-sm"
              >
                Show Less
              </button>
            )}
          </div>
        </div>

      </section>
    </main>
  );
}