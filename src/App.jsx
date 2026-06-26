import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ICONS, navigationStructure } from './constants/navigation';
import formatTime from './utils/formatTime';
import loadScript from './utils/loadScript';
import useIeltsTimer from './hooks/useIeltsTimer';
import { gradeWritingTask1Api, gradeWritingTask2Api, generateGraphTaskApi } from './api/gemini';
import { generateListeningTestPartApi, generateListeningAudioApi } from './api/listening';
import ImageModal from './components/modals/ImageModal';
import FeedbackModal from './components/modals/FeedbackModal';
import ConfirmationModal from './components/modals/ConfirmationModal';
import PlaceholderPage from './components/PlaceholderPage';
import Sidebar from './components/Sidebar';
import ListeningFullTest from './modules/ListeningFullTest';
import WritingTask1 from './modules/WritingTask1';
import WritingTask2 from './modules/WritingTask2';

// --- IMPORTANT: ADD YOUR API KEY HERE --- //
// Get your free key from Google AI Studio: https://aistudio.google.com/app/apikey
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

// --- MAIN APP COMPONENT --- //
export default function App() {
    const [activeView, setActiveView] = useState({ main: 'Writing', sub: 'Task 1' });

    const renderActiveView = () => {
        if (activeView.main === 'Writing' && activeView.sub === 'Task 1') {
            return <WritingTask1 apiKey={GEMINI_API_KEY} />;
        }
        if (activeView.main === 'Writing' && activeView.sub === 'Task 2') {
            return <WritingTask2 apiKey={GEMINI_API_KEY} />;
        }
        if (activeView.main === 'Listening' && activeView.sub === 'Full Test') {
            return <ListeningFullTest apiKey={GEMINI_API_KEY} />;
        }
        
        return <PlaceholderPage title={`${activeView.main} ${activeView.sub}`} />;
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto+Mono:wght@400;500&family=Caveat:wght@700&display=swap');
                body { font-family: 'Inter', sans-serif; background-color: #f8fafc; }
                .font-roboto-mono { font-family: 'Roboto Mono', monospace; }
                .handwritten {
                    font-family: 'Caveat', cursive; color: #1e40af; background-color: #e0f2fed1; padding: 0 0.3em;
                    border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); position: absolute;
                    left: 50%; bottom: 80%; line-height: 1em; transform: translateX(-50%) translateY(4px);
                    white-space: nowrap; font-size: 1.1em; font-weight: 700; pointer-events: none;
                }
                del { 
                    color: #ef4444; 
                    text-decoration: none; 
                    background-color: transparent; 
                    position: relative; 
                    display: inline-block;
                }
                del::after { content: ''; position: absolute; left: 0; right: 0; top: 50%; border-bottom: 1.5px solid #ef4444; pointer-events: none; }
                @keyframes blink { 50% { opacity: 0; } }
                .blinking { animation: blink 1s linear infinite; }
            `}</style>

            <div className="flex h-screen bg-slate-50 text-gray-800">
                <Sidebar activeView={activeView} setActiveView={setActiveView} />

                <main className="w-[92%] p-6 flex gap-6 overflow-y-auto">
                    {renderActiveView()}
                </main>
            </div>
        </>
    );
}