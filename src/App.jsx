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

// --- IMPORTANT: ADD YOUR API KEY HERE --- //
// Get your free key from Google AI Studio: https://aistudio.google.com/app/apikey
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;


const PlaceholderPage = ({ title }) => (
    <div className="w-full h-full flex items-center justify-center bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-700">{title}</h1>
            <p className="mt-2 text-slate-500">This feature is coming soon.</p>
        </div>
    </div>
);

// --- SIDEBAR COMPONENT --- //
const Sidebar = ({ activeView, setActiveView }) => {
    return (
        <nav className="w-[8%] min-w-[100px] bg-white border-r border-slate-200 flex flex-col items-center py-6 gap-2">
            <div className="w-12 h-12 bg-blue-600 rounded-full mb-6 flex items-center justify-center text-white font-bold text-xl">I</div>
            {navigationStructure.map(item => {
                const Icon = ICONS[item.icon];
                const isMainActive = item.label === activeView.main;
                return (
                    <div key={item.label} className="w-full px-2">
                        <div
                            onClick={() => setActiveView({ main: item.label, sub: item.subItems[0] })}
                            className={`w-full flex flex-col items-center p-2 rounded-lg transition-colors duration-200 cursor-pointer ${isMainActive ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            <Icon className="w-7 h-7" />
                            <span className="text-xs mt-1 font-semibold">{item.label}</span>
                        </div>
                        {isMainActive && (
                            <div className="flex flex-col items-center mt-2 space-y-1">
                                {item.subItems.map(subItem => {
                                    const isSubActive = subItem === activeView.sub;
                                    return (
                                        <button
                                            key={subItem}
                                            onClick={() => setActiveView({ main: item.label, sub: subItem })}
                                            className={`w-full text-center text-xs py-2 px-1 rounded-md transition-colors ${isSubActive ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-200'}`}
                                        >
                                            {subItem}
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </nav>
    );
};

// --- FEATURE COMPONENTS --- //

const ListeningFullTest = ({ apiKey }) => {
    const [phase, setPhase] = useState('not_started'); // not_started, generating, prereading, listening, reviewing, finished
    const [currentPart, setCurrentPart] = useState(1);
    const [audioUrl, setAudioUrl] = useState(null);
    const [userAnswers, setUserAnswers] = useState({});
    const [score, setScore] = useState(null);
    const [testData, setTestData] = useState({});
    
    const [reviewTimeLeft, setReviewTimeLeft] = useState(60);
    const reviewTimerRef = useRef(null);
    
    const [preReadingTimeLeft, setPreReadingTimeLeft] = useState(60);
    const preReadingTimerRef = useRef(null);

    const audioRef = useRef(null);

    const startTest = useCallback(async () => {
        setPhase('generating');
        setCurrentPart(1);
        setUserAnswers({});
        setScore(null);
        setTestData({});
        await handleGenerateNextPart(1);
    }, []);
    
    const handleGenerateNextPart = useCallback(async (part) => {
        if (!apiKey) {
            alert("Please add your Gemini API key at the top of the file to generate the test.");
            setPhase('not_started');
            return;
        }
        clearInterval(reviewTimerRef.current);
        setPhase('generating');
        try {
            const data = await generateListeningTestPartApi(part, apiKey);
            setTestData(prev => ({...prev, [`part${part}`]: data}));
            setPhase('prereading');
        } catch (error) {
            console.error(`Error generating test for part ${part}:`, error);
            setPhase('not_started');
        }
    }, [apiKey]);
    
    const startAudioPlayback = useCallback(() => {
        if(testData[`part${currentPart}`]) {
            const { script, speakers } = testData[`part${currentPart}`];
            generateAndPlayAudio(script, speakers);
        }
    }, [testData, currentPart]);
    
    // Timer for pre-reading questions
    useEffect(() => {
        if (phase === 'prereading') {
            setPreReadingTimeLeft(60);
            preReadingTimerRef.current = setInterval(() => {
                setPreReadingTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(preReadingTimerRef.current);
                        startAudioPlayback();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(preReadingTimerRef.current);
    }, [phase, startAudioPlayback]);

    const generateAndPlayAudio = useCallback(async (script, speakers) => {
        setPhase('listening');
        setAudioUrl(null);
        try {
            const url = await generateListeningAudioApi(script, speakers, apiKey);
            setAudioUrl(url);
        } catch (error) {
            console.error("Error generating audio:", error);
            setPhase('reviewing'); // Fallback to review phase on error
        }
    }, [apiKey]);
    
    const handleAudioEnded = useCallback(() => {
        if (currentPart < 4) {
            setPhase('reviewing');
        } else {
            setPhase('finished');
        }
    }, [currentPart]);
    
    // Timer for reviewing answers after audio
    useEffect(() => {
        if(phase === 'reviewing') {
            setReviewTimeLeft(60);
            reviewTimerRef.current = setInterval(() => {
                setReviewTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(reviewTimerRef.current);
                        handleNextPart();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(reviewTimerRef.current);
    }, [phase]);

    const handleNextPart = useCallback(async () => {
        if (currentPart < 4) {
            const nextPart = currentPart + 1;
            setCurrentPart(nextPart);
            await handleGenerateNextPart(nextPart);
        }
    }, [currentPart, handleGenerateNextPart]);

    const handleAnswerChange = (question, answer) => {
        setUserAnswers(prev => ({ ...prev, [question]: answer }));
    };
    
    const calculateScore = () => {
        let correctAnswers = 0;
        Object.values(testData).forEach(part => {
            part.questions.forEach(q => {
                if (userAnswers[q.q]?.trim().toLowerCase() === q.answer.trim().toLowerCase()) {
                    correctAnswers++;
                }
            });
        });
        setScore(correctAnswers);
    };

    const handleDownloadListeningPdf = async () => {
        try {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        } catch (error) {
            console.error("jsPDF could not be loaded.", error);
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        const maxLineWidth = pageWidth - margin * 2;
        let yPos = 20;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text('IELTS Listening Test Report', pageWidth / 2, yPos, { align: 'center' });
        yPos += 15;
        
        const bands = { 40: "9.0", 39: "9.0", 38: "8.5", 37: "8.5", 36: "8.0", 35: "8.0", 34: "7.5", 33: "7.5", 32: "7.0", 31: "7.0", 30: "7.0", 29: "6.5", 28: "6.5", 27: "6.5", 26: "6.0", 25: "6.0", 24: "6.0", 23: "6.0", 22: "5.5", 21: "5.5", 20: "5.5", 19: "5.5", 18: "5.0", 17: "5.0", 16: "5.0", 15: "5.0" };
        const band = bands[score] || "Below 5.0";

        doc.setFontSize(14);
        doc.text(`Final Score: ${score} / 40`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 7;
        doc.text(`Estimated Band: ${band}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 15;

        const checkYPos = (neededHeight) => {
            if (yPos + neededHeight > doc.internal.pageSize.getHeight() - margin) {
                doc.addPage();
                yPos = margin;
            }
        };

        Object.values(testData).forEach((part, index) => {
            checkYPos(20);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.text(`Part ${index + 1}`, margin, yPos);
            yPos += 8;

            doc.setFont('helvetica', 'italic');
            doc.setFontSize(9);
            doc.setTextColor(100);
            const transcriptLines = doc.splitTextToSize(`Transcript: ${part.script}`, maxLineWidth);
            checkYPos(transcriptLines.length * 3.5 + 5);
            doc.text(transcriptLines, margin, yPos);
            yPos += transcriptLines.length * 3.5 + 5;
            doc.setTextColor(0);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            
            part.questions.forEach(q => {
                const userAnswer = userAnswers[q.q] || "No answer";
                const isCorrect = userAnswer.trim().toLowerCase() === q.answer.trim().toLowerCase();
                
                checkYPos(12);
                doc.setFont('helvetica', 'bold');
                doc.text(`${q.q}. ${q.label}`, margin, yPos);
                yPos += 5;

                doc.setFont('helvetica', 'normal');
                if (isCorrect) {
                    doc.setTextColor(34, 139, 34); // ForestGreen
                    doc.text(`   Your answer: ${userAnswer} (Correct)`, margin, yPos);
                    yPos += 5;
                } else {
                    doc.setTextColor(220, 20, 60); // Crimson
                    doc.text(`   Your answer: ${userAnswer}`, margin, yPos);
                    yPos += 5;
                    doc.setTextColor(34, 139, 34);
                    doc.text(`   Correct answer: ${q.answer}`, margin, yPos);
                    yPos += 5;
                }
                doc.setTextColor(0);
                yPos += 3;
            });
            yPos += 5;
        });

        doc.save('ielts-listening-report.pdf');
    };


    const renderQuestions = (part) => {
        const partData = testData[`part${part}`];
        if (!partData) return null;
        
        const { instructions, questions } = partData;
        return (
            <div>
                <h3 className="font-bold text-lg mb-2">Part {part}</h3>
                <p className="text-sm text-slate-600 mb-4">{instructions}</p>
                <div className="space-y-6">
                    {questions.map(q => {
                        const questionKey = `q-${q.q}`;
                        if (q.type === 'text') {
                            return (
                                <div key={questionKey} className="flex items-center gap-x-3 flex-wrap">
                                    <span className="font-bold">{q.q}.</span>
                                    <label className="font-semibold text-gray-800">{q.label.split('____')[0]}</label>
                                    <input type="text" disabled={phase === 'finished'} className="flex-grow border-b-2 border-slate-300 focus:border-blue-500 outline-none p-1 min-w-[100px]" onChange={(e) => handleAnswerChange(q.q, e.target.value)} />
                                     {q.label.split('____')[1] && <label className="font-semibold text-gray-800">{q.label.split('____')[1]}</label>}
                                </div>
                            );
                        }
                        if (q.type === 'mcq') {
                            return (
                                <div key={questionKey} className="p-3 bg-slate-50 rounded-lg">
                                    <p className="font-semibold mb-2">{q.q}. {q.label}</p>
                                    <div className="space-y-1">
                                        {q.options.map(opt => (
                                            <label key={opt} className="flex items-center gap-2 p-1 rounded hover:bg-slate-200 cursor-pointer">
                                                <input type="radio" name={`q${q.q}`} value={opt.charAt(0)} disabled={phase === 'finished'} onChange={(e) => handleAnswerChange(q.q, e.target.value)} />
                                                {opt}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>
            </div>
        )
    };
    
    const renderResults = () => {
        const bands = { 40: "9.0", 39: "9.0", 38: "8.5", 37: "8.5", 36: "8.0", 35: "8.0", 34: "7.5", 33: "7.5", 32: "7.0", 31: "7.0", 30: "7.0", 29: "6.5", 28: "6.5", 27: "6.5", 26: "6.0", 25: "6.0", 24: "6.0", 23: "6.0", 22: "5.5", 21: "5.5", 20: "5.5", 19: "5.5", 18: "5.0", 17: "5.0", 16: "5.0", 15: "5.0" };
        const band = bands[score] || "Below 5.0";
        return (
             <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">Test Results</h2>
                <div className="text-center bg-blue-50 p-6 rounded-lg mb-6">
                    <p className="text-lg text-blue-800">Your Score</p>
                    <p className="text-6xl font-bold text-blue-600">{score} / 40</p>
                    <p className="text-2xl font-semibold text-blue-700 mt-2">Estimated Band: {band}</p>
                </div>
                <div className="space-y-4">
                 {Object.values(testData).map((part, index) => (
                     <div key={index}>
                         <h3 className="font-bold text-lg mb-2">Part {index + 1}</h3>
                         {part.questions.map(q => {
                             const userAnswer = userAnswers[q.q] || "No answer";
                             const isCorrect = userAnswer.trim().toLowerCase() === q.answer.trim().toLowerCase();
                             return (
                                 <div key={q.q} className={`p-2 my-1 rounded-md flex justify-between items-center ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                                     <div>
                                         <p className="font-semibold">Q{q.q}: Your answer: <span className="font-normal">{userAnswer}</span></p>
                                         {!isCorrect && <p className="text-sm">Correct answer: <span className="font-semibold">{q.answer}</span></p>}
                                     </div>
                                     <span className={`font-bold text-lg ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{isCorrect ? '✔' : '✘'}</span>
                                 </div>
                             );
                         })}
                     </div>
                 ))}
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="w-[30%] min-w-[350px] flex flex-col gap-5">
                <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-sm">
                    <p className="text-sm text-slate-500">IELTS Listening</p>
                    <p className="text-3xl font-bold text-slate-700">Full Test</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 flex-grow flex flex-col shadow-sm">
                     <h2 className="text-lg font-bold mb-3">Instructions</h2>
                     <p className="text-sm text-slate-600 mb-4">This test has 4 parts. You will hear each part only once. Answer the questions as you listen.</p>
                     
                     {phase === 'listening' && audioUrl && <audio ref={audioRef} src={audioUrl} autoPlay controls onEnded={handleAudioEnded} className="w-full mt-auto" />}
                     {phase === 'generating' && <div className="text-center p-4 mt-auto">Generating test, please wait...</div>}
                     
                     {phase === 'prereading' && (
                         <div className="mt-auto text-center p-2 bg-green-100 rounded-lg">
                            <p className="font-semibold">Read the questions for Part {currentPart}.</p>
                            <p className="text-2xl font-bold font-roboto-mono">{formatTime(preReadingTimeLeft)}</p>
                             <button onClick={() => { clearInterval(preReadingTimerRef.current); startAudioPlayback(); }} className="mt-2 px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700">Start Audio Now</button>
                         </div>
                     )}

                     {phase === 'reviewing' && (
                         <div className="mt-auto text-center p-2 bg-yellow-100 rounded-lg">
                            <p className="font-semibold">Review your answers for Part {currentPart}.</p>
                            <p className="text-2xl font-bold font-roboto-mono">{formatTime(reviewTimeLeft)}</p>
                         </div>
                     )}
                </div>
                {phase === 'not_started' && <button onClick={startTest} className="w-full p-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">Start Test</button>}
                
                {phase === 'reviewing' && (
                    <button onClick={handleNextPart} className="w-full p-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
                        Continue to Part {currentPart + 1}
                    </button>
                )}

                {phase === 'finished' && !score && <button onClick={calculateScore} className="w-full p-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700">Submit & See Score</button>}
                {score !== null && (
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={handleDownloadListeningPdf} className="w-full p-3 bg-blue-100 text-blue-700 font-semibold rounded-lg hover:bg-blue-200 flex items-center justify-center gap-2">
                            <ICONS.DOWNLOAD className="w-5 h-5" /> PDF Report
                        </button>
                        <button onClick={startTest} className="w-full p-3 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200">Restart Test</button>
                    </div>
                )}
            </div>
            <div className="w-[62%] flex-grow flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-y-auto">
                {(phase !== 'finished' && phase !== 'not_started') && testData[`part${currentPart}`] && <div className="p-6">{renderQuestions(currentPart)}</div>}
                {phase === 'finished' && score !== null && renderResults()}
                {(phase === 'not_started' || (phase === 'generating' && !testData['part1'])) && <div className="p-6 text-center text-slate-500 flex items-center justify-center h-full">Click "Start Test" to begin.</div>}
            </div>
        </>
    );
};


// --- WRITING TASK 1 COMPONENT --- //
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

// --- WRITING TASK 2 COMPONENT --- //
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
            alert("Please add your Gemini API key at the top of the file.");
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
        </>
    );
};

// --- API --- //
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