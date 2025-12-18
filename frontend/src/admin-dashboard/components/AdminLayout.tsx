"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    FiUsers, 
    FiBookOpen, 
    FiActivity, 
    FiCpu, 
    FiSettings, 
    FiLogOut, 
    FiGrid,
    FiMessageSquare,
    FiLayers
} from 'react-icons/fi';

interface AdminLayoutProps {
    children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    const pathname = usePathname();

    const handleLogout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('adminToken');
            window.location.href = '/auth'; 
        }
    };

    // Danh sách Menu
    const menuItems = [
        { 
            category: "Main",
            items: [
                { 
                    name: 'User Management', 
                    href: '/admin/users', 
                    icon: FiUsers, 
                    active: pathname?.startsWith('/admin/users'),
                    disabled: false
                },
                // Nếu chưa có trang sessions riêng thì tạm thời để disable hoặc trỏ về users
                { 
                    name: 'Session History', 
                    href: '/admin/sessions', 
                    icon: FiMessageSquare, 
                    active: pathname?.startsWith('/admin/sessions'),
                    disabled: true 
                }
            ]
        },
        { 
            category: "Content & AI",
            items: [
                { 
                    // --- ĐÃ CẬP NHẬT & MỞ KHÓA MỤC NÀY ---
                    name: 'Decks & Vocabulary', 
                    href: '/admin/content/decks', // Trỏ đến trang DeckManagement
                    icon: FiLayers, 
                    active: pathname?.startsWith('/admin/content'),
                    disabled: false // Cho phép click
                },
                { 
                    name: 'Prompt Engineering', 
                    href: '/admin/prompts', 
                    icon: FiCpu, 
                    active: false,
                    disabled: true 
                },
            ]
        },
        { 
            category: "System",
            items: [
                { 
                    name: 'Analytics & Costs', 
                    href: '/admin/analytics', 
                    icon: FiActivity, 
                    active: false,
                    disabled: true 
                },
                { 
                    name: 'Settings', 
                    href: '/admin/settings', 
                    icon: FiSettings, 
                    active: false,
                    disabled: true 
                },
            ]
        }
    ];

    return (
        <div className="flex h-screen bg-gray-50 font-sans text-sm">
            {/* Sidebar */}
            <aside className="w-72 bg-slate-900 text-slate-300 flex flex-col fixed h-full top-0 left-0 z-30 shadow-xl border-r border-slate-800">
                
                {/* Logo Area */}
                <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3 text-white font-bold shadow-lg shadow-blue-900/50">
                        AI
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white tracking-wide">English Tutor</h1>
                        <span className="text-xs text-blue-400 font-medium uppercase tracking-wider">Admin Portal</span>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-grow p-4 space-y-6 mt-2 overflow-y-auto custom-scrollbar">
                    {menuItems.map((section, idx) => (
                        <div key={idx}>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-4">
                                {section.category}
                            </div>
                            <div className="space-y-1">
                                {section.items.map((item, itemIdx) => (
                                    <div key={itemIdx}>
                                        {item.disabled ? (
                                            <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-600 cursor-not-allowed opacity-60">
                                                <item.icon size={18} />
                                                <span className="font-medium">{item.name}</span>
                                                <span className="ml-auto text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">Soon</span>
                                            </div>
                                        ) : (
                                            <Link 
                                                href={item.href} 
                                                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group ${
                                                    item.active 
                                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
                                                    : 'hover:bg-slate-800 hover:text-white'
                                                }`}
                                            >
                                                <item.icon size={18} className={`${item.active ? 'text-white' : 'text-slate-400 group-hover:text-white'} transition-colors`} />
                                                <span className="font-medium">{item.name}</span>
                                            </Link>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Footer User Info */}
                <div className="p-4 border-t border-slate-800 bg-slate-950">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white shadow-inner">
                            <FiGrid />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white">Administrator</p>
                            <p className="text-xs text-slate-500">Super Admin Access</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-red-600 hover:text-white text-slate-400 py-2.5 rounded-lg transition-all duration-200 group border border-slate-700 hover:border-red-500"
                    >
                        <FiLogOut className="group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>
            
            {/* Main Content Area */}
            <main className="flex-1 ml-72 p-8 overflow-y-auto h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto animate-fadeIn">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;