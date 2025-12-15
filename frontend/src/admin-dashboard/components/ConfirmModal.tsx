
"use client";

import React from 'react';
import { FiAlertTriangle, FiX } from 'react-icons/fi';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean; // Nếu là hành động xóa thì màu đỏ, ngược lại màu xanh
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmText = "Confirm", 
    cancelText = "Cancel",
    isDanger = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="relative w-full max-w-md transform rounded-2xl bg-white p-6 text-left shadow-2xl transition-all scale-100">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full ${isDanger ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        <FiAlertTriangle size={24} />
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <FiX size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 leading-6 mb-2">
                        {title}
                    </h3>
                    <p className="text-sm text-gray-500">
                        {message}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        className="inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all"
                        onClick={onClose}
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        className={`inline-flex justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${
                            isDanger 
                            ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                            : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                        }`}
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;