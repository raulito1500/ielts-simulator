import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ICONS } from '../constants/navigation';
import { gradeWritingTask2Api } from '../api/gemini';
import formatTime from '../utils/formatTime';
import useIeltsTimer from '../hooks/useIeltsTimer';
import FeedbackModal from '../components/modals/FeedbackModal';
import ConfirmationModal from '../components/modals/ConfirmationModal';
import ErrorModal from '../components/modals/ErrorModal';

const WritingTask2 = ({ apiKey }) => {
    const [text, setText] = useState('');
    const [wordCount, setWordCount] = useState(0);
    const [isTimeUp, setIsTimeUp] = useState(false);
    const [essayQuestion, setEssayQuestion] = useState(null);
    const [isGrading, setIsGrading] = useState(false);
    const [score, setScore] = useState(null);
    const [correctedHtml, setCorrectedHtml] = useState(null);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [gradeButtonClicked, setGradeButtonClicked] = useState(false);
    const [showCopyMessage, setShowCopyMessage] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    const writingSheetRef = useRef(null);
    const initialTimeSpent = useRef(0);

    const handleTimeUp = useCallback(() => setIsTimeUp(true), []);
    const { timeLeft, timerActive, startTimer, endTimer, resetTimer } = useIeltsTimer(2400, handleTimeUp);

    useEffect(() => {
        const words = text.trim().split(/\s+/).filter(Boolean);
        setWordCount(words.length);
    }, [text]);

    const generateEssayTask = () => {
        const questions = [
            "Some people believe that unpaid community service should be a compulsory part of high school programmes. To what extent do you agree or disagree?",
            "In many countries, traditional foods are being replaced by fast food. This has a negative impact on families, individuals and society. To what extent do you agree or disagree?",
            "Some people think that the best way to reduce crime is to give longer prison sentences. Others, however, believe there are better alternative ways of reducing crime. Discuss both views and give your own opinion.",
        ];
        setEssayQuestion(questions[Math.floor(Math.random() * questions.length)]);
        startTimer();
    };

    const handleGrade = async () => {
        if (!apiKey) {
            setErrorMessage("Please add your Gemini API key at the top of the file.");
            return;
        }
        setIsGrading(true);
        setGradeButtonClicked(true);
        try {
            const { scores, correctedHtml } = await gradeWritingTask2Api(text, essayQuestion, apiKey);
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
        setEssayQuestion(null);
        setScore(null);
        setCorrectedHtml(null);
        setGradeButtonClicked(false);
        initialTimeSpent.current = 0;
    };

    const handleEndSession = () => {
        initialTimeSpent.current = 2400 - timeLeft;
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
                    <h2 className="text-lg font-bold mb-3">Academic Task 2</h2>
                    <p className="text-sm text-slate-600 mb-4">You should spend about 40 minutes on this task. Write at least 250 words.</p>
                    <div className="flex-grow flex items-center justify-center bg-slate-50 rounded-lg p-4">
                        {essayQuestion ? (
                            <p className="text-center text-slate-700 font-semibold">{essayQuestion}</p>
                        ) : (
                            <button onClick={generateEssayTask} className="px-5 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">Generate Random Essay Task</button>
                        )}
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
            {isFeedbackModalOpen && <FeedbackModal score={score} onClose={() => setIsFeedbackModalOpen(false)} overallScore={calculateOverallScore()} />}
            {showConfirmModal && <ConfirmationModal onConfirm={handleEndSession} onCancel={() => setShowConfirmModal(false)} message="Are you sure you want to end the session?" />}
            {errorMessage && <ErrorModal message={errorMessage} onClose={() => setErrorMessage(null)} />}
        </>
    );
};

export default WritingTask2;
