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
        <div className="flex h-screen bg-slate-50 text-gray-800">
            <Sidebar activeView={activeView} setActiveView={setActiveView} />

            <main className="w-[92%] p-6 flex gap-6 overflow-y-auto">
                {renderActiveView()}
            </main>
        </div>
    );
}