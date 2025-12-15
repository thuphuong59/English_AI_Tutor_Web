"use client"; 

import React, { useState, useEffect } from 'react';
import axios from 'axios'; 
import Link from 'next/link'; 
import { FiTrash2, FiEye, FiUser, FiActivity, FiShield, FiLock, FiUnlock } from 'react-icons/fi';
import ConfirmModal from './ConfirmModal';

interface AdminUserDetail {
    id?: string;
    user_id?: string;
    username: string;
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

    // --- State for Modal ---
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        isDanger: false,
        onConfirm: () => {},
    });

    const fetchUsers = async () => {
        const adminToken = getAdminToken();
        if (!adminToken) { setError("Admin login required."); setLoading(false); return; }
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/admin/users`, {
                headers: { Authorization: `Bearer ${adminToken}` }
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

    useEffect(() => { fetchUsers(); }, []);

    // --- Execute Actions (Called by Modal) ---
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

    // --- Open Modal Handlers ---
    const openStatusModal = (userId: string, currentStatus: 'active' | 'blocked') => {
        const isBlocking = currentStatus === 'active';
        setModalConfig({
            isOpen: true,
            title: isBlocking ? 'Block User' : 'Unblock User',
            message: isBlocking 
                ? 'Are you sure you want to block this user? They will not be able to access the system.' 
                : 'Are you sure you want to activate this user again?',
            isDanger: isBlocking, 
            onConfirm: () => executeToggleStatus(userId, currentStatus)
        });
    };

    const openDeleteModal = (userId: string) => {
        setModalConfig({
            isOpen: true,
            title: 'Delete User',
            message: ' Are you sure you want to DELETE this user permanently? This action cannot be undone.',
            isDanger: true,
            onConfirm: () => executeDeleteUser(userId)
        });
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
    );
    
    if (error) return <div className="p-4 text-red-500 bg-red-50 rounded-lg text-center border border-red-200">Error: {error}</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header Section */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
                    <p className="text-gray-500 mt-1">Manage accounts, roles, and access.</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                    <span className="font-semibold text-blue-600">{users.length}</span> Users Total
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User Info</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Activity</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((user, index) => {
                                const rawId = user.id || user.user_id || `unknown-${index}`;
                                const displayId = String(rawId).substring(0, 8);

                                return (
                                    <tr key={rawId} className="hover:bg-blue-50/30 transition duration-150 group">
                                        
                                        {/* User Info Column */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                                                    {user.username?.charAt(0).toUpperCase() || "U"}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{user.username || "No Name"}</div>
                                                    <div className="text-xs text-gray-400 font-mono">ID: {displayId}...</div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Role Column */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                                                user.role === 'admin' 
                                                ? 'bg-indigo-100 text-indigo-800 border-indigo-200' 
                                                : 'bg-gray-100 text-gray-800 border-gray-200'
                                            }`}>
                                                <FiShield className="mr-1 self-center" /> {user.role?.toUpperCase()}
                                            </span>
                                        </td>

                                        {/* Status Column */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                                                user.status === 'active' 
                                                ? 'bg-green-100 text-green-800 border-green-200' 
                                                : 'bg-red-100 text-red-800 border-red-200'
                                            }`}>
                                                {user.status === 'active' ? 'Active' : 'Blocked'}
                                            </span>
                                        </td>

                                        {/* Activity Stats */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <FiActivity className="text-blue-400" />
                                                    <span>{user.session_count || 0} Sessions</span>
                                                </div>
                                                <div className="text-xs text-gray-400">Logins: {user.badge || 0}</div>
                                            </div>
                                        </td>

                                        {/* Actions Column */}
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-3 opacity-80 group-hover:opacity-100 transition-opacity">
                                                
                                                {/* Block/Unblock Toggle */}
                                                <button
                                                    onClick={() => openStatusModal(rawId, user.status)}
                                                    className={`p-2 rounded-full transition-colors ${
                                                        user.status === 'active' 
                                                        ? 'text-yellow-600 hover:bg-yellow-100' 
                                                        : 'text-green-600 hover:bg-green-100'
                                                    }`}
                                                    title={user.status === 'active' ? "Block User" : "Unblock User"}
                                                >
                                                    {user.status === 'active' ? <FiLock size={18} /> : <FiUnlock size={18} />}
                                                </button>

                                                {/* View Detail Link */}
                                                <Link
                                                    href={`/admin/users/${rawId}`}
                                                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                                                    title="View Details"
                                                >
                                                    <FiEye size={18} />
                                                </Link>

                                                {/* Delete Button */}
                                                <button
                                                    onClick={() => openDeleteModal(rawId)}
                                                    className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                                                    title="Delete User"
                                                >
                                                    <FiTrash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                
                {/* Empty State */}
                {users.length === 0 && (
                    <div className="p-12 text-center text-gray-500 bg-white">
                        <FiUser className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <p>No users found in the system.</p>
                    </div>
                )}
            </div>

            {/* --- Render Modal --- */}
            <ConfirmModal 
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onConfirm={modalConfig.onConfirm}
                title={modalConfig.title}
                message={modalConfig.message}
                isDanger={modalConfig.isDanger}
            />
        </div>
    );
};

export default UserManagement;