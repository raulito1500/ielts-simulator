import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ICONS } from '../constants/navigation';
import { generateListeningTestPartApi, generateListeningAudioApi } from '../api/listening';
import loadScript from '../utils/loadScript';
import formatTime from '../utils/formatTime';
import ErrorModal from '../components/modals/ErrorModal';

const ListeningFullTest = ({ apiKey }) => {
    const [phase, setPhase] = useState('not_started'); // not_started, generating, prereading, listening, reviewing, finished
    const [currentPart, setCurrentPart] = useState(1);
    const [audioUrl, setAudioUrl] = useState(null);
    const [userAnswers, setUserAnswers] = useState({});
    const [score, setScore] = useState(null);
    const [testData, setTestData] = useState({});
    const [errorMessage, setErrorMessage] = useState(null);

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
            setErrorMessage("Please add your Gemini API key at the top of the file to generate the test.");
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
            {errorMessage && <ErrorModal message={errorMessage} onClose={() => setErrorMessage(null)} />}
            <div className="w-[62%] flex-grow flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-y-auto">
                {(phase !== 'finished' && phase !== 'not_started') && testData[`part${currentPart}`] && <div className="p-6">{renderQuestions(currentPart)}</div>}
                {phase === 'finished' && score !== null && renderResults()}
                {(phase === 'not_started' || (phase === 'generating' && !testData['part1'])) && <div className="p-6 text-center text-slate-500 flex items-center justify-center h-full">Click "Start Test" to begin.</div>}
            </div>
        </>
    );
};

export default ListeningFullTest;
