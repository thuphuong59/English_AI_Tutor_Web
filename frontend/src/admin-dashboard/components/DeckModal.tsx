"use client";

import React, { useState, useEffect } from 'react';
import { FiX, FiSave, FiLayers, FiImage, FiType, FiBarChart } from 'react-icons/fi';

interface DeckModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    initialData?: any; // Nếu có data là Edit, không là Create
}

const DeckModal: React.FC<DeckModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        level: 'beginner',
        image_url: '',
        is_public: true
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                description: initialData.description || '',
                level: initialData.level || 'beginner',
                image_url: initialData.image_url || '',
                is_public: initialData.is_public ?? true
            });
        } else {
            // Reset form khi tạo mới
            setFormData({
                name: '',
                description: '',
                level: 'beginner',
                image_url: '',
                is_public: true
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center text-white">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <FiLayers /> {initialData ? 'Edit Deck' : 'Create New Deck'}
                    </h3>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition">
                        <FiX size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                            <FiType className="text-gray-400"/> Deck Name <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="text" 
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. IELTS Essential Words"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea 
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Short description about this deck..."
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                        />
                    </div>

                    {/* Level & Public Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                <FiBarChart className="text-gray-400"/> Level
                            </label>
                            <select 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white capitalize"
                                value={formData.level}
                                onChange={(e) => setFormData({...formData, level: e.target.value})}
                            >
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                            </select>
                        </div>
                        <div className="flex items-end pb-2">
                            <label className="inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={formData.is_public}
                                    onChange={(e) => setFormData({...formData, is_public: e.target.checked})}
                                />
                                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                <span className="ms-3 text-sm font-medium text-gray-700">Public Deck</span>
                            </label>
                        </div>
                    </div>

                    {/* Image URL */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                            <FiImage className="text-gray-400"/> Cover Image URL
                        </label>
                        <input 
                            type="url" 
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono text-gray-600"
                            placeholder="https://example.com/image.png"
                            value={formData.image_url}
                            onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                        />
                        {formData.image_url && (
                            <div className="mt-2 w-full h-32 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative">
                                <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                                <span className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 -z-10">Image Preview</span>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="pt-4 flex justify-end gap-3 border-t">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-md"
                        >
                            <FiSave /> {initialData ? 'Update Deck' : 'Create Deck'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DeckModal;