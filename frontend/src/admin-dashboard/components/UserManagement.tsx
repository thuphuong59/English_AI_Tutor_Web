"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { FiTrash2, FiEye, FiLock, FiUnlock, FiSearch, FiCalendar, FiFilter, FiEdit } from 'react-icons/fi';
import ConfirmModal from './ConfirmModal';
import EditUserModal from './EditUserModal';

interface AdminUserDetail {
    id?: string;
    user_id?: string;
    username: string;
    avatar_url?: string; // <--- 1. Thêm trường avatar_url
    role: 'admin' | 'user' | string;
    status: 'active' | 'blocked';
    updated_at: string;
    last_login_date?: string;
    badge: number;
    session_count: number;
}

const API_BASE_URL = 'http://127.0.0.1:8000';

const getAdminToken = (): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('adminToken');
    }
    return null;
};

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<AdminUserDetail[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        isDanger: false,
        onConfirm: () => {},
    });

    const [editModal, setEditModal] = useState({
        isOpen: false,
        selectedUser: null as AdminUserDetail | null
    });

    const fetchUsers = async () => {
        const adminToken = getAdminToken();
        if (!adminToken) { setError("Admin login required."); setLoading(false); return; }
        setLoading(true);
        try {
            // Thêm logic tìm kiếm nếu có searchTerm (cần update backend để hỗ trợ filter nếu muốn search server-side)
            // Hiện tại code này lấy tất cả về. Nếu muốn search server-side, sửa URL thành:
            // `${API_BASE_URL}/admin/users?search=${searchTerm}`
            const response = await axios.get(`${API_BASE_URL}/admin/users`, {
                headers: { Authorization: `Bearer ${adminToken}` },
                params: searchTerm ? { search: searchTerm } : {} // Gửi params search nếu có
            });
            setUsers(response.data);
            setError(null);
        } catch (err: any) {
            console.error(err);
            setError("Failed to load user data.");
        } finally {
            setLoading(false);
        }
    };

    // Gọi fetchUsers khi component mount hoặc khi searchTerm thay đổi (debounce nếu cần)
    // Ở đây ta thêm nút search để gọi thủ công hoặc gọi trong useEffect
    useEffect(() => { fetchUsers(); }, []);

    // Hàm xử lý khi bấm nút Search
    const handleSearch = () => {
        fetchUsers();
    };

    const executeToggleStatus = async (userId: string, currentStatus: 'active' | 'blocked') => {
        const adminToken = getAdminToken();
        const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
        try {
            await axios.put(`${API_BASE_URL}/admin/users/${userId}/status`, 
                { status: newStatus },
                { headers: { Authorization: `Bearer ${adminToken}` } }
            );
            setUsers(prev => prev.map(u => (u.id === userId || u.user_id === userId) ? { ...u, status: newStatus } : u));
        } catch (error) { alert("Failed to update status."); }
    };

    const executeDeleteUser = async (userId: string) => {
        const adminToken = getAdminToken();
        try {
            await axios.delete(`${API_BASE_URL}/admin/users/${userId}`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            setUsers(prevUsers => prevUsers.filter(user => (user.id !== userId && user.user_id !== userId)));
        } catch (error) {
            console.error("Delete Error:", error);
            alert("Error: Cannot delete user.");
        }
    };

    const handleUpdateUser = async (updatedData: any) => {
        const adminToken = getAdminToken();
        const userId = editModal.selectedUser?.id || editModal.selectedUser?.user_id;
        
        if (!userId) return;

        try {
            await axios.put(`${API_BASE_URL}/admin/users/${userId}`, updatedData, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });

            setUsers(prev => prev.map(u => 
                (u.id === userId || u.user_id === userId) 
                ? { ...u, ...updatedData } 
                : u
            ));
            
            alert("User updated successfully!");
        } catch (error) {
            console.error("Update Error:", error);
            alert("Failed to update user.");
        }
    };

    const openStatusModal = (userId: string, currentStatus: 'active' | 'blocked') => {
        const isBlocking = currentStatus === 'active';
        setModalConfig({
            isOpen: true,
            title: isBlocking ? 'Deactivate Account' : 'Activate Account',
            message: isBlocking 
                ? 'Are you sure you want to deactivate this user? They will not be able to access the system.' 
                : 'Are you sure you want to reactivate this user?',
            isDanger: isBlocking,
            onConfirm: () => executeToggleStatus(userId, currentStatus)
        });
    };

    const openDeleteModal = (userId: string) => {
        setModalConfig({
            isOpen: true,
            title: 'Delete Account',
            message: '⚠️ WARNING: This action will permanently delete user data and cannot be undone.',
            isDanger: true,
            onConfirm: () => executeDeleteUser(userId)
        });
    };

    const openEditModal = (user: AdminUserDetail) => {
        setEditModal({
            isOpen: true,
            selectedUser: user
        });
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
    );
    
    if (error) return <div className="p-4 text-red-500 bg-red-50 rounded-lg text-center border border-red-200">Error: {error}</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
                <div className="mt-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-3 items-center">
                    <div className="relative flex-grow max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiSearch className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
                            placeholder="Search by name, email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    
                    <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-600 text-sm">
                        <FiCalendar />
                        <span>mm/dd/yyyy</span>
                    </div>

                    <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-600 text-sm">
                        <FiFilter />
                        <span>All</span>
                    </div>

                    <button 
                        onClick={handleSearch}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors duration-200 flex items-center gap-2"
                    >
                        <FiSearch /> Search
                    </button>
                </div>
            </div>

            <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Full Name
                                </th>
                                <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Avatar
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Info
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                {/* Actions column moved to the far right */}
                                <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-64">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((user, index) => {
                                const rawId = user.id || user.user_id || `unknown-${index}`;
                                const avatarUrl = user.avatar_url 
                                    ? user.avatar_url 
                                    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;

                                return (
                                    <tr key={rawId} className="hover:bg-blue-50/30 transition duration-150">
                                        
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-gray-900">{user.username || "Unnamed"}</div>
                                            <div className="text-xs text-gray-400 mt-1 font-mono">ID: {rawId.substring(0, 8)}...</div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="inline-block h-12 w-12 rounded overflow-hidden shadow-sm border border-gray-200">
                                                <img 
                                                    src={avatarUrl} 
                                                    alt="avatar" 
                                                    className="h-full w-full object-cover" 
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
                                                    }}
                                                />
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-600">
                                                <div className="mb-1"><span className="font-medium">Role:</span> {user.role?.toUpperCase()}</div>
                                                <div className="mb-1"><span className="font-medium">Sessions:</span> {user.session_count || 0}</div>
                                                <div><span className="font-medium">Logins:</span> {user.badge || 0}</div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                user.status === 'active' 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-red-100 text-red-800'
                                            }`}>
                                                {user.status === 'active' ? 'Active' : 'Blocked'}
                                            </span>
                                        </td>

                                        {/* Actions Column - At the end */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col space-y-2">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Link href={`/admin/users/${rawId}`} className="w-full">
                                                        <button className="w-full text-blue-600 border border-blue-200 hover:bg-blue-50 hover:border-blue-300 font-medium py-1.5 px-2 rounded text-xs transition duration-200 flex items-center justify-center gap-1" title="View Details">
                                                            <FiEye /> View
                                                        </button>
                                                    </Link>
                                                    
                                                    <button
                                                        onClick={() => openEditModal(user)}
                                                        className="w-full text-indigo-600 border border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 font-medium py-1.5 px-2 rounded text-xs transition duration-200 flex items-center justify-center gap-1"
                                                        title="Edit User"
                                                    >
                                                        <FiEdit /> Edit
                                                    </button>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button
                                                        onClick={() => openStatusModal(rawId, user.status)}
                                                        className={`w-full font-medium py-1.5 px-2 rounded text-xs border transition duration-200 flex items-center justify-center gap-1 ${
                                                            user.status === 'active'
                                                            ? 'text-orange-600 border-orange-200 hover:bg-orange-50 hover:border-orange-300'
                                                            : 'text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300'
                                                        }`}
                                                        title={user.status === 'active' ? "Deactivate User" : "Activate User"}
                                                    >
                                                        {user.status === 'active' ? <><FiLock /> Lock</> : <><FiUnlock /> Unlock</>}
                                                    </button>

                                                    <button
                                                        onClick={() => openDeleteModal(rawId)}
                                                        className="w-full text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300 font-medium py-1.5 px-2 rounded text-xs transition duration-200 flex items-center justify-center gap-1"
                                                        title="Delete User"
                                                    >
                                                        <FiTrash2 /> Del
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                
                {users.length === 0 && (
                    <div className="p-12 text-center text-gray-500 bg-white">
                        <p>No users found.</p>
                    </div>
                )}
                
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-sm text-gray-700">
                        Showing <span className="font-medium">{users.length}</span> results
                    </span>
                    <div className="flex gap-1">
                        <button className="px-3 py-1 border border-gray-300 rounded bg-white text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50" disabled>
                            &laquo;
                        </button>
                        <button className="px-3 py-1 border border-blue-500 rounded bg-blue-50 text-sm text-blue-600 font-medium">
                            1
                        </button>
                        <button className="px-3 py-1 border border-gray-300 rounded bg-white text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50" disabled>
                            &raquo;
                        </button>
                    </div>
                </div>
            </div>

            <ConfirmModal 
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onConfirm={modalConfig.onConfirm}
                title={modalConfig.title}
                message={modalConfig.message}
                isDanger={modalConfig.isDanger}
            />

            <EditUserModal 
                isOpen={editModal.isOpen}
                onClose={() => setEditModal({ ...editModal, isOpen: false })}
                onSave={handleUpdateUser}
                initialData={editModal.selectedUser}
            />
        </div>
    );
};

export default UserManagement;