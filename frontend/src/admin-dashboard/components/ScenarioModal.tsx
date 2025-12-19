"use client";

import React, { useState, useEffect } from 'react';
import { FiX, FiSave, FiPlus, FiTrash, FiEdit2 } from 'react-icons/fi';

interface ScenarioModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    initialData?: any; 
}

const ScenarioModal: React.FC<ScenarioModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [title, setTitle] = useState('');
    const [topic, setTopic] = useState('Daily Life');
    const [level, setLevel] = useState('Beginner');
    
    const [dialogues, setDialogues] = useState([
        { turn: 1, speaker: 'ai', line: '' },
        { turn: 2, speaker: 'user', line: '' }
    ]);

    // Load dữ liệu khi mở Modal ---
    useEffect(() => {
        if (isOpen && initialData) {
            // Chế độ EDIT
            setTitle(initialData.title || '');
            setTopic(initialData.topic || 'Daily Life');
            setLevel(initialData.level || 'Beginner');
            if (initialData.dialogues && initialData.dialogues.length > 0) {
                setDialogues(initialData.dialogues.map((d: any) => ({
                    turn: d.turn,
                    speaker: d.speaker,
                    line: d.line
                })));
            }
        } else if (isOpen && !initialData) {
            // Chế độ CREATE (Reset form)
            setTitle('');
            setTopic('Daily Life');
            setLevel('Beginner');
            setDialogues([{ turn: 1, speaker: 'ai', line: '' }, { turn: 2, speaker: 'user', line: '' }]);
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const addLine = () => {
        const nextTurn = dialogues.length + 1;
        const nextSpeaker = dialogues[dialogues.length - 1].speaker === 'ai' ? 'user' : 'ai';
        setDialogues([...dialogues, { turn: nextTurn, speaker: nextSpeaker, line: '' }]);
    };

    const updateLine = (index: number, val: string) => {
        const newDialogues = [...dialogues];
        newDialogues[index].line = val;
        setDialogues(newDialogues);
    };

    const removeLine = (index: number) => {
        if (dialogues.length <= 2) return; 
        const newDialogues = dialogues.filter((_, i) => i !== index);
        const reindexed = newDialogues.map((d, i) => ({ ...d, turn: i + 1 }));
        setDialogues(reindexed);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ title, topic, level, dialogues });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header chuyển sang màu xanh */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center text-white">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        {initialData ? <><FiEdit2 /> Edit Scenario</> : <><FiPlus /> Create New Scenario</>}
                    </h3>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition"><FiX size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-6 overflow-y-auto">
                        {/* Meta Info */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Title</label>
                                <input type="text" required className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="e.g. At the Coffee Shop" value={title} onChange={e => setTitle(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Topic</label>
                                <input type="text" required className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="e.g. Food" value={topic} onChange={e => setTopic(e.target.value)} />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1">Level</label>
                                <select className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white transition" value={level} onChange={e => setLevel(e.target.value)}>
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                </select>
                            </div>
                        </div>

                        {/* Dialogue Builder */}
                        <div className="border-t pt-4">
                            <h4 className="font-bold text-gray-700 mb-3 flex justify-between items-center">
                                Script
                                <span className="text-xs font-normal text-gray-500">Auto-switching speakers</span>
                            </h4>
                            <div className="space-y-3">
                                {dialogues.map((d, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        {/* Speaker Label màu xanh */}
                                        <div className={`w-16 text-xs font-bold uppercase text-center py-2 rounded ${d.speaker === 'ai' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                            {d.speaker}
                                        </div>
                                        <input 
                                            type="text" 
                                            required 
                                            className="flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:border-blue-500 outline-none transition" 
                                            placeholder="Type sentence here..." 
                                            value={d.line}
                                            onChange={(e) => updateLine(idx, e.target.value)}
                                        />
                                        <button type="button" onClick={() => removeLine(idx)} className="text-gray-400 hover:text-red-500 transition"><FiTrash /></button>
                                    </div>
                                ))}
                            </div>
                            {/* Nút Add Line */}
                            <button type="button" onClick={addLine} className="mt-4 w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 font-bold flex justify-center items-center gap-2 transition-all">
                                <FiPlus /> Add Next Line
                            </button>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 flex items-center gap-2 font-medium transition">
                            <FiSave /> {initialData ? 'Save Changes' : 'Create Scenario'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ScenarioModal;