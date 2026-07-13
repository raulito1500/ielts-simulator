import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ICONS } from '../constants/navigation';
import { gradeWritingTask2Api } from '../api/gemini';
import useIeltsTimer from '../hooks/useIeltsTimer';
import FeedbackModal from '../components/modals/FeedbackModal';
import ConfirmationModal from '../components/modals/ConfirmationModal';
import ErrorModal from '../components/modals/ErrorModal';
import StatCard from '../components/writing/StatCard';
import AnswerSheet from '../components/writing/AnswerSheet';

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
    const [isFocused, setIsFocused] = useState(false);

    const writingSheetRef = useRef(null);
    const initialTimeSpent = useRef(0);

    const handleTimeUp = useCallback(() => setIsTimeUp(true), []);
    const { timeLeft, totalTime, timerActive, startTimer, endTimer, resetTimer } = useIeltsTimer(2400, handleTimeUp);

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
        initialTimeSpent.current = totalTime - timeLeft;
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
                <StatCard
                    hasScore={!!score}
                    overallScore={calculateOverallScore()}
                    onOpenFeedback={() => setIsFeedbackModalOpen(true)}
                    timeLeft={timeLeft}
                    totalTime={totalTime}
                    timerActive={timerActive}
                    wordCount={wordCount}
                    wordTarget={250}
                />
                <div className="bg-white p-5 rounded-2xl border border-slate-100 flex-grow flex flex-col shadow-sm">
                    <h2 className="text-lg font-bold mb-3">Academic Task 2</h2>
                    <p className="text-sm text-slate-600 mb-4">You should spend about 40 minutes on this task. Write at least 250 words.</p>
                    <div className="flex-grow flex items-center justify-center bg-slate-50 border-dashed border-2 border-slate-100 rounded-xl p-4">
                        {essayQuestion ? (
                            <p className="text-center text-slate-700 font-semibold">{essayQuestion}</p>
                        ) : (
                            <button onClick={generateEssayTask} className="px-4 py-3 bg-primary-600 text-white rounded-xl font-semibold shadow-lg shadow-primary-600/20 hover:bg-primary-700">Generate Random Essay Task</button>
                        )}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 grid grid-cols-2 gap-3 shadow-sm">
                    {!isTimeUp && <button disabled={!timerActive} onClick={() => setShowConfirmModal(true)} className="col-span-2 w-full px-4 py-3 bg-red-100 text-red-700 font-semibold rounded-xl hover:bg-red-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed">End Session</button>}
                    <button onClick={handleReset} className="w-full px-4 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200">Reset</button>
                    <button onClick={handleGrade} disabled={!isTimeUp || !text.trim() || gradeButtonClicked} className="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center justify-center"> {isGrading && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>} {isGrading ? 'Grading...' : 'Grade'} </button>
                    {score && (
                        <>
                            <div className="col-span-2 border-t my-2"></div>
                            <button onClick={handleCopy} className="relative w-full p-3 bg-primary-100 text-primary-700 font-semibold rounded-xl hover:bg-primary-200 flex items-center justify-center gap-2"> <ICONS.COPY className="w-5 h-5"/> Copy Text {showCopyMessage && <span className="absolute -top-8 bg-slate-800 text-white text-xs px-2 py-1 rounded">Copied!</span>} </button>
                        </>
                    )}
                </div>
            </div>
            <AnswerSheet
                ref={writingSheetRef}
                value={text}
                onChange={handleTextChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                readOnly={isTimeUp}
                correctedHtml={correctedHtml}
                wordCount={wordCount}
                isFocused={isFocused}
            />
            {isFeedbackModalOpen && <FeedbackModal score={score} onClose={() => setIsFeedbackModalOpen(false)} overallScore={calculateOverallScore()} />}
            {showConfirmModal && <ConfirmationModal onConfirm={handleEndSession} onCancel={() => setShowConfirmModal(false)} message="Are you sure you want to end the session?" />}
            {errorMessage && <ErrorModal message={errorMessage} onClose={() => setErrorMessage(null)} />}
        </>
    );
};

export default WritingTask2;
