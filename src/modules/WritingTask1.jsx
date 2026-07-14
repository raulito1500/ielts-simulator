import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ICONS } from '../constants/navigation';
import { gradeWritingTask1Api, generateGraphTaskApi } from '../api/gemini';
import loadScript from '../utils/loadScript';
import formatTime from '../utils/formatTime';
import useIeltsTimer from '../hooks/useIeltsTimer';
import ImageModal from '../components/modals/ImageModal';
import FeedbackModal from '../components/modals/FeedbackModal';
import ConfirmationModal from '../components/modals/ConfirmationModal';
import ErrorModal from '../components/modals/ErrorModal';
import StatCard from '../components/writing/StatCard';
import AnswerSheet from '../components/writing/AnswerSheet';

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
    const [errorMessage, setErrorMessage] = useState(null);
    const [isFocused, setIsFocused] = useState(false);

    const writingSheetRef = useRef(null);
    const initialTimeSpent = useRef(0);

    const handleTimeUp = useCallback(() => setIsTimeUp(true), []);
    const { timeLeft, totalTime, timerActive, startTimer, endTimer, resetTimer } = useIeltsTimer(1200, handleTimeUp);

    useEffect(() => {
        const words = text.trim().split(/\s+/).filter(Boolean);
        setWordCount(words.length);
    }, [text]);

    const handleGenerateTask = async () => {
        if (!apiKey) {
            setErrorMessage("This public demo doesn't ship with an API key. Clone the repo and add your own free Gemini key to a local .env file to use this feature.");
            return;
        }
        setIsGenerating(true);
        try {
            const url = await generateGraphTaskApi(apiKey);
            setImageUrl(url);
            startTimer();
        } catch (error) {
            console.error("Error generating image:", error);
            setImageUrl(`https://placehold.co/600x400/CCFBF1/115E59?text=Error+Generating+Image`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGrade = async () => {
        if (!apiKey) {
            setErrorMessage("This public demo doesn't ship with an API key. Clone the repo and add your own free Gemini key to a local .env file to use this feature.");
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

    const handleDownloadPdf = async () => {
        try {
            await Promise.all([
                loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'),
                loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js')
            ]);
        } catch (error) {
            console.error("PDF generation libraries could not be loaded.", error);
            setErrorMessage("Sorry, the PDF report could not be generated. Please check your connection and try again.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const html2canvas = window.html2canvas;

        const doc = new jsPDF({
            orientation: 'p',
            unit: 'px',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        let yPos = 20;

        try {
            doc.setFont('Inter', 'bold');
        } catch (e) {
            doc.setFont('helvetica', 'bold');
        }

        doc.setFontSize(20);
        doc.text('IELTS Writing Task 1 Report', pageWidth / 2, yPos, { align: 'center' });
        yPos += 30;

        try {
            doc.setFont('Inter', 'normal');
        } catch (e) {
            doc.setFont('helvetica', 'normal');
        }

        doc.setFontSize(12);

        const overallScore = calculateOverallScore();
        doc.text(`Overall Score: ${overallScore}`, margin, yPos);
        yPos += 15;
        doc.text(`Time Spent: ${formatTime(initialTimeSpent.current)}`, margin, yPos);
        yPos += 15;
        doc.text(`Word Count: ${wordCount}`, margin, yPos);
        yPos += 30;

        if (score) {
            doc.setFontSize(14);
            try {
                doc.setFont('Inter', 'bold');
            } catch (e) {
                doc.setFont('helvetica', 'bold');
            }
            doc.text('Detailed Scores & Feedback:', margin, yPos);
            yPos += 20;

            const availableWidth = pageWidth - (margin * 2) - 15;

            Object.entries(score).forEach(([key, value]) => {
                doc.setFontSize(11);
                try {
                    doc.setFont('Inter', 'bold');
                } catch (e) {
                    doc.setFont('helvetica', 'bold');
                }
                const scoreText = `${key.replace(/([A-Z])/g, ' $1').trim()}: ${value.score.toFixed(1)}`;

                try {
                    doc.setFont('Inter', 'normal');
                } catch (e) {
                    doc.setFont('helvetica', 'normal');
                }
                const observationLines = doc.splitTextToSize(value.observation, availableWidth);
                const blockHeight = 15 + (observationLines.length * 12) + 10;

                if (yPos + blockHeight > pageHeight - margin) {
                    doc.addPage();
                    yPos = margin;
                }

                try {
                    doc.setFont('Inter', 'bold');
                } catch (e) {
                    doc.setFont('helvetica', 'bold');
                }
                doc.text(scoreText, margin + 5, yPos);
                yPos += 15;

                try {
                    doc.setFont('Inter', 'normal');
                } catch (e) {
                    doc.setFont('helvetica', 'normal');
                }
                doc.text(observationLines, margin + 10, yPos);
                yPos += (observationLines.length * 12) + 10;
            });
            yPos += 15;
        }

        if (imageUrl) {
            try {
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.src = imageUrl;
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                });

                const aspectRatio = img.height / img.width;
                const imgHeight = (pageWidth - (margin * 2)) * aspectRatio;

                if (yPos + imgHeight > pageHeight - margin) {
                    doc.addPage();
                    yPos = margin;
                }
                doc.addImage(img, 'PNG', margin, yPos, pageWidth - (margin * 2), 0);
                yPos += imgHeight + 20;
            } catch (e) {
                console.error("Could not add task image to PDF:", e);
                doc.text('Task image could not be loaded for PDF.', margin, yPos);
                yPos += 20;
            }
        }

        if (writingSheetRef.current) {
            try {
                const canvas = await html2canvas(writingSheetRef.current, { scale: 2, useCORS: true });
                const imgData = canvas.toDataURL('image/png');

                const imgProps = doc.getImageProperties(imgData);
                const pdfWidth = pageWidth - (margin * 2);
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                if (yPos + pdfHeight > pageHeight - margin) {
                    doc.addPage();
                    yPos = margin;
                }

                doc.addImage(imgData, 'PNG', margin, yPos, pdfWidth, pdfHeight);
            } catch (e) {
                console.error("Error capturing writing sheet for PDF:", e);
                doc.text('Could not capture writing sheet.', margin, yPos);
            }
        }

        doc.save('ielts-report-task1.pdf');
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
                    wordTarget={150}
                />
                <div className="bg-white p-5 rounded-2xl border border-slate-100 flex-grow flex flex-col shadow-sm">
                    <h2 className="text-lg font-bold mb-3">Academic Task 1</h2>
                    <p className="text-sm text-slate-600 mb-4">You should spend about 20 minutes on this task. Summarise the information by selecting and reporting the main features. Write at least 150 words.</p>
                    <div className="flex-grow flex items-center justify-center bg-slate-50 border-dashed border-2 border-slate-100 rounded-xl p-2">
                        {imageUrl ? 
                        <img src={imageUrl} alt="Task Graph" className="max-h-full max-w-full object-contain rounded-md cursor-pointer" onClick={() => setIsImageModalOpen(true)} /> : 
                        !timerActive && !isTimeUp && <button onClick={handleGenerateTask} disabled={isGenerating} className="px-4 py-3 bg-primary-600 text-white rounded-xl font-semibold shadow-lg shadow-primary-600/20 hover:bg-primary-700 disabled:bg-primary-300"> {isGenerating ? 'Generating...' : 'Generate Random Graph Task'} </button>}
                        {timerActive && !imageUrl && <p className="text-slate-500 text-center">Writing session started with your own material.</p>}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 grid grid-cols-2 gap-3 shadow-sm">
                    {!isTimeUp && <button disabled={!timerActive} onClick={() => setShowConfirmModal(true)} className="col-span-2 w-full px-4 py-3 bg-red-100 text-red-700 font-semibold rounded-xl hover:bg-red-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed">End Session</button>}
                    <button onClick={handleReset} className="w-full px-4 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200">Reset</button>
                    <button onClick={handleGrade} disabled={!isTimeUp || !text.trim() || gradeButtonClicked} className="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center justify-center"> {isGrading && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>} {isGrading ? 'Grading...' : 'Grade'} </button>
                    {score && (
                        <>
                            <div className="col-span-2 border-t my-2"></div>
                            <button onClick={handleCopy} className="relative w-full p-3 bg-primary-100 text-primary-700 font-semibold rounded-xl hover:bg-primary-200 flex items-center justify-center gap-2"> <ICONS.COPY className="w-5 h-5" /> Copy Text {showCopyMessage && <span className="absolute -top-8 bg-slate-800 text-white text-xs px-2 py-1 rounded">Copied!</span>} </button>
                            <button onClick={handleDownloadPdf} className="w-full p-3 bg-primary-100 text-primary-700 font-semibold rounded-xl hover:bg-primary-200 flex items-center justify-center gap-2"> <ICONS.DOWNLOAD className="w-5 h-5" /> PDF Report </button>
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
            {isImageModalOpen && <ImageModal imageUrl={imageUrl} onClose={() => setIsImageModalOpen(false)} />}
            {isFeedbackModalOpen && <FeedbackModal score={score} onClose={() => setIsFeedbackModalOpen(false)} overallScore={calculateOverallScore()} />}
            {showConfirmModal && <ConfirmationModal onConfirm={handleEndSession} onCancel={() => setShowConfirmModal(false)} message="Are you sure you want to end the session?" />}
            {errorMessage && <ErrorModal message={errorMessage} onClose={() => setErrorMessage(null)} />}
        </>
    );
};

export default WritingTask1;
