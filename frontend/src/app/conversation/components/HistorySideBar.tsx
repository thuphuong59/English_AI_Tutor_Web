"use client";

import { FC } from "react";
import { Plus, Trash2, Search, Menu, MessageSquare, PanelLeftClose } from "lucide-react"; // Import Menu icon (3 gạch)
import { HistorySession } from "../types";

interface HistorySidebarProps {
  sessions: HistorySession[];
  loading: boolean;
  deletingId: string | null;
  onSessionSelect: (id: string) => void;
  activeSessionId: string | null;
  onNewConversation: () => void;
  onDelete: (id: string, topic: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const HistorySidebar: FC<HistorySidebarProps> = ({
  sessions,
  loading,
  deletingId,
  onSessionSelect,
  activeSessionId,
  onNewConversation,
  onDelete,
  isOpen,
  onClose,
}) => {
  return (
    <>
      <div 
        className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      <div 
        className={`fixed inset-y-0 left-0 z-40 w-80 bg-white border-r border-slate-200 shadow-2xl lg:shadow-none transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 flex-shrink-0">
          <span className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <MessageSquare size={18} strokeWidth={2.5} />
            </div>
            History
          </span>
        
          <button 
            onClick={onClose} 
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
            title="Close Sidebar"
          >
            <Menu size={24} />
          </button>
        </div>
        <div className="p-4 space-y-3 flex-shrink-0">
          <button
            onClick={() => {
              onNewConversation();
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-bold shadow-lg shadow-slate-200 hover:shadow-blue-200 transition-all active:scale-[0.98]"
          >
            <Plus size={20} />
            New Chat
          </button>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-9 pr-4 text-sm text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mb-2"></div>
              <span className="text-xs">Loading...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 px-6">
              <p className="text-sm text-slate-500 font-medium">No history yet.</p>
              <p className="text-xs text-slate-400 mt-1">Your conversations will appear here.</p>
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = activeSessionId === session.id;
              
              return (
                <div
                  key={session.id}
                  onClick={() => {
                    onSessionSelect(session.id);
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`group relative flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 border ${
                    isActive
                      ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200"
                      : "bg-white text-slate-700 border-transparent hover:bg-slate-50"
                  } ${deletingId === session.id ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-semibold truncate mb-1.5 ${isActive ? "text-white" : "text-slate-700"}`}>
                      {session.topic || "Untitled Session"}
                    </h4>
                    
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isActive 
                          ? "bg-white/20 text-white" 
                          : session.mode === 'scenario' 
                            ? "bg-blue-50 text-blue-600 border border-blue-100" 
                            : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      }`}>
                        {session.mode}
                      </span>
                      <span className={`text-[10px] ${isActive ? "text-blue-100" : "text-slate-400"}`}>
                        {new Date(session.created_at).toLocaleDateString(undefined, { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(session.id, session.topic);
                    }}
                    className={`p-1.5 rounded-lg transition-all absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 ${
                      isActive 
                        ? "text-white/70 hover:bg-white/20 hover:text-white" 
                        : "text-slate-400 hover:bg-red-50 hover:text-red-500"
                    }`}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-slate-100 hidden lg:block">
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 py-2 rounded-lg transition-all text-sm font-medium"
          >
            <PanelLeftClose size={18} />
            <span>Collapse Sidebar</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default HistorySidebar;