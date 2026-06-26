import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ICONS } from '../constants/navigation';
import { gradeWritingTask1Api, generateGraphTaskApi } from '../api/gemini';
import loadScript from '../utils/loadScript';
import formatTime from '../utils/formatTime';
import useIeltsTimer from '../hooks/useIeltsTimer';
import ImageModal from '../components/modals/ImageModal';
import FeedbackModal from '../components/modals/FeedbackModal';
import ConfirmationModal from '../components/modals/ConfirmationModal';

const WritingTask1 = ({ apiKey }) => {
    const [text, setText] = useState('');
    const [wordCount, setWordCount] = useState(0);
    const [isTimeUp, setIsTimeUp] = useState(false);
    const [imageUrl, setImageUrl] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGrading, setIsGrading] = useState(false);
    const [score, setScore] = useState(null);
    const [correctedHtml, setCorrectedHtml] = useState(null);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [gradeButtonClicked, setGradeButtonClicked] = useState(false);
    const [showCopyMessage, setShowCopyMessage] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const writingSheetRef = useRef(null);
    const initialTimeSpent = useRef(0);

    const handleTimeUp = useCallback(() => setIsTimeUp(true), []);
    const { timeLeft, timerActive, startTimer, endTimer, resetTimer } = useIeltsTimer(1200, handleTimeUp);

    useEffect(() => {
        const words = text.trim().split(/\s+/).filter(Boolean);
        setWordCount(words.length);
    }, [text]);

    const handleGenerateTask = async () => {
        if (!apiKey) {
            alert("Please add your Gemini API key at the top of the file.");
            return;
        }
        setIsGenerating(true);
        try {
            const url = await generateGraphTaskApi(apiKey);
            setImageUrl(url);
            startTimer();
        } catch (error) {
            console.error("Error generating image:", error);
            setImageUrl(`https://placehold.co/600x400/EBF4FF/1E40AF?text=Error+Generating+Image`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGrade = async () => {
        if (!apiKey) {
            alert("Please add your Gemini API key at the top of the file.");
            return;
        }
        setIsGrading(true);
        setGradeButtonClicked(true);
        try {
            const { scores, correctedHtml } = await gradeWritingTask1Api(text, apiKey);
            setScore(scores);
            setCorrectedHtml(correctedHtml);
        } catch (error) {
            console.error("Error grading text:", error);
            setCorrectedHtml(`<p class="text-red-500">Sorry, an error occurred while grading. Please try resetting the session.</p>`);
        } finally {
            setIsGrading(false);
        }
    };

    const handleReset = () => {
        resetTimer();
        setIsTimeUp(false);
        setText('');
        setImageUrl(null);
        setScore(null);
        setCorrectedHtml(null);
        setGradeButtonClicked(false);
        initialTimeSpent.current = 0;
    };

    const handleEndSession = () => {
        initialTimeSpent.current = 1200 - timeLeft;
        endTimer();
        setShowConfirmModal(false);
    };

    const handleTextChange = (e) => {
        if (!timerActive && !isTimeUp) startTimer();
        setText(e.target.value);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setShowCopyMessage(true);
        setTimeout(() => setShowCopyMessage(false), 2000);
    };

    const handleDownloadPdf = async () => {
        try {
            await Promise.all([
                loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'),
                loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js')
            ]);
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
            // ... (rest of the PDF generation logic)
            doc.save('ielts-report-task1.pdf');
        } catch (error) {
            console.error("PDF generation libraries could not be loaded.", error);
        }
    };

    const calculateOverallScore = () => {
        if (!score) return 'N/A';
        const total = Object.values(score).reduce((sum, item) => sum + item.score, 0);
        const avg = total / 4;
        return (Math.round(avg * 2) / 2).toFixed(1);
    };

    return (
        <>
            <div className="w-[30%] min-w-[350px] flex flex-col gap-5">
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-around items-center text-center shadow-sm">
                    {score ? (
                        <div className="w-full cursor-pointer" onClick={() => setIsFeedbackModalOpen(true)}>
                            <p className="text-sm text-slate-500">Overall Estimated Band Score</p>
                            <p className="text-4xl font-bold text-blue-600">{calculateOverallScore()}</p>
                        </div>
                    ) : (
                        <>
                            <div>
                                <p className="text-sm text-slate-500">Time Remaining</p>
                                <p className={`font-roboto-mono text-3xl font-bold ${timeLeft <= 300 ? 'text-red-500 blinking' : 'text-slate-700'}`}>{formatTime(timeLeft)}</p>
                            </div>
                            <div className="border-l h-10 border-slate-200"></div>
                            <div>
                                <p className="text-sm text-slate-500">Word Count</p>
                                <p className={`font-roboto-mono text-3xl font-bold ${wordCount >= 250 ? 'text-green-600' : 'text-slate-700'}`}>{wordCount}</p>
                            </div>
                        </>
                    )}
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 flex-grow flex flex-col shadow-sm">
                    <h2 className="text-lg font-bold mb-3">Academic Task 1</h2>
                    <p className="text-sm text-slate-600 mb-4">You should spend about 20 minutes on this task. Summarise the information... Write at least 150 words.</p>
                    <div className="flex-grow flex items-center justify-center bg-slate-50 rounded-lg p-2">
                        {imageUrl ? <img src={imageUrl} alt="Task Graph" className="max-h-full max-w-full object-contain rounded-md cursor-pointer" onClick={() => setIsImageModalOpen(true)} />
                        : !timerActive && !isTimeUp && <button onClick={handleGenerateTask} disabled={isGenerating} className="px-5 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-300"> {isGenerating ? 'Generating...' : 'Generate Random Graph Task'} </button>}
                        {timerActive && !imageUrl && <p className="text-slate-500 text-center">Writing session started with your own material.</p>}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 shadow-sm">
                   {!isTimeUp && <button onClick={() => setShowConfirmModal(true)} className="col-span-2 w-full p-3 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200">End Session</button>}
                    <button onClick={handleReset} className="w-full p-3 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200">Reset Session</button>
                    <button onClick={handleGrade} disabled={!isTimeUp || !text.trim() || gradeButtonClicked} className="w-full p-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-300 flex items-center justify-center"> {isGrading && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>} {isGrading ? 'Grading...' : 'Grade'} </button>
                     {score && (
                        <>
                            <div className="col-span-2 border-t my-2"></div>
                            <button onClick={handleCopy} className="relative w-full p-3 bg-blue-100 text-blue-700 font-semibold rounded-lg hover:bg-blue-200 flex items-center justify-center gap-2"> <ICONS.COPY className="w-5 h-5"/> Copy Text {showCopyMessage && <span className="absolute -top-8 bg-slate-800 text-white text-xs px-2 py-1 rounded">Copied!</span>} </button>
                            <button onClick={handleDownloadPdf} className="w-full p-3 bg-blue-100 text-blue-700 font-semibold rounded-lg hover:bg-blue-200 flex items-center justify-center gap-2"> <ICONS.DOWNLOAD className="w-5 h-5" /> PDF Report </button>
                        </>
                    )}
                </div>
            </div>
            <div className="w-[62%] flex-grow flex flex-col">
                <div ref={writingSheetRef} className="bg-[#FFFBF0] border border-yellow-200 shadow-inner flex-grow p-8 leading-relaxed font-roboto-mono text-[#1a1a1a] text-lg overflow-y-auto">
                    {correctedHtml ? <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: correctedHtml }}></div>
                    : <textarea value={text} onChange={handleTextChange} readOnly={isTimeUp} className="w-full h-full bg-transparent border-none outline-none resize-none" placeholder="Start typing..."/>}
                </div>
            </div>
            {isImageModalOpen && <ImageModal imageUrl={imageUrl} onClose={() => setIsImageModalOpen(false)} />}
            {isFeedbackModalOpen && <FeedbackModal score={score} onClose={() => setIsFeedbackModalOpen(false)} overallScore={calculateOverallScore()} />}
            {showConfirmModal && <ConfirmationModal onConfirm={handleEndSession} onCancel={() => setShowConfirmModal(false)} message="Are you sure you want to end the session?" />}
        </>
    );
};

export default WritingTask1;
