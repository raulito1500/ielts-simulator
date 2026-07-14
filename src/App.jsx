import React, { useState, useEffect } from 'react';
import PlaceholderPage from './components/PlaceholderPage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ListeningFullTest from './modules/ListeningFullTest';
import WritingTask1 from './modules/WritingTask1';
import WritingTask2 from './modules/WritingTask2';

// Read from a local .env file (REACT_APP_GEMINI_API_KEY=...), never committed.
// Get your free key from Google AI Studio: https://aistudio.google.com/app/apikey
// The public GitHub Pages build intentionally ships without this key — CRA bakes
// REACT_APP_* vars into the public JS bundle, so a real key would be extractable
// by anyone visiting the live demo. AI features are local-only by design.
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

export default function App() {
    const [activeView, setActiveView] = useState({ main: 'Writing', sub: 'Task 1' });
    // Only the Writing tasks report a session phase back up today; other
    // views have no such concept yet, so the header simply shows no status
    // chip for them (see Header.jsx: phase=null renders nothing extra).
    const [writingPhase, setWritingPhase] = useState('idle');

    useEffect(() => {
        setWritingPhase('idle');
    }, [activeView.main, activeView.sub]);

    const renderActiveView = () => {
        if (activeView.main === 'Writing' && activeView.sub === 'Task 1') {
            return <WritingTask1 apiKey={GEMINI_API_KEY} onPhaseChange={setWritingPhase} />;
        }
        if (activeView.main === 'Writing' && activeView.sub === 'Task 2') {
            return <WritingTask2 apiKey={GEMINI_API_KEY} onPhaseChange={setWritingPhase} />;
        }
        if (activeView.main === 'Listening' && activeView.sub === 'Full Test') {
            return <ListeningFullTest apiKey={GEMINI_API_KEY} />;
        }

        return <PlaceholderPage title={`${activeView.main} ${activeView.sub}`} />;
    };

    return (
        <div className="flex h-screen bg-slate-50 text-gray-800">
            <Sidebar activeView={activeView} setActiveView={setActiveView} />

            <main className="w-full flex flex-col overflow-y-auto bg-slate-50">
                <Header
                    main={activeView.main}
                    sub={activeView.sub}
                    phase={activeView.main === 'Writing' ? writingPhase : null}
                />
                <div className="flex-1 min-h-0 flex gap-6 p-6">
                    {renderActiveView()}
                </div>
            </main>
        </div>
    );
}