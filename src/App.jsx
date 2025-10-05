import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- HELPER & SVG COMPONENTS --- //

const ICONS = {
    WRITING: ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M14.06 9.02l.92.92L5.92 19H5v-.92l9.06-9.06M17.66 3c-.25 0-.51.1-.7.29l-1.83 1.83 3.75 3.75 1.83-1.83c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.2-.2-.45-.29-.71-.29zm-3.6 3.19L3 17.25V21h3.75L17.81 9.94l-3.75-3.75z"></path></svg>,
    LISTENING: ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M4 9v6h4l5 5V4L8 9H4zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path></svg>,
    READING: ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M13 12h7v1.5h-7zm0-2.5h7V11h-7zm0 5h7V16h-7zM21 4H3c-1.1 0-2 .9-2 2v13c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 15h-9V6h9v13z"></path></svg>,
    SPEAKING: ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V4c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v11l4-4h10c.55 0 1-.45 1-1z"></path></svg>,
    COPY: ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path></svg>,
    DOWNLOAD: ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"></path></svg>,
    CHEVRON: ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>,
};

const loadScript = (src) => {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            return resolve();
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
    });
};

const ImageModal = ({ imageUrl, onClose }) => {
    if (!imageUrl) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
                <img src={imageUrl} alt="Generated Task Graph" className="max-w-full max-h-[90vh] rounded-lg shadow-2xl" />
                <button onClick={onClose} className="absolute top-4 right-4 text-white text-3xl font-bold">&times;</button>
            </div>
        </div>
    );
};

const FeedbackModal = ({ score, onClose, overallScore }) => {
    const [openAccordion, setOpenAccordion] = useState(null);

    const toggleAccordion = (index) => {
        setOpenAccordion(openAccordion === index ? null : index);
    };

    if (!score) return null;

    const criteria = Object.keys(score);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl font-inter p-8 m-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Your Detailed Feedback</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl">&times;</button>
                </div>
                <div className="text-center bg-blue-50 p-4 rounded-lg mb-6">
                    <p className="text-lg text-blue-800">Overall Estimated Band Score</p>
                    <p className="text-5xl font-bold text-blue-600">{overallScore}</p>
                </div>
                <div className="space-y-3">
                    {criteria.map((criterion, index) => (
                        <div key={criterion} className="border border-gray-200 rounded-lg overflow-hidden">
                            <button onClick={() => toggleAccordion(index)} className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 focus:outline-none">
                                <span className="font-semibold text-gray-700">{criterion.replace(/([A-Z])/g, ' $1').trim()}</span>
                                <div className='flex items-center gap-4'>
                                    <span className='font-bold text-lg text-blue-600'>{score[criterion].score.toFixed(1)}</span>
                                    <ICONS.CHEVRON className={`w-6 h-6 text-gray-500 transition-transform duration-300 ${openAccordion === index ? 'rotate-180' : ''}`} />
                                </div>
                            </button>
                            {openAccordion === index && (
                                <div className="p-4 bg-white border-t border-gray-200">
                                    <p className="text-gray-600 whitespace-pre-line">{score[criterion].observation}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ConfirmationModal = ({ onConfirm, onCancel, message }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl font-inter">
            <p className="text-lg mb-4">{message}</p>
            <div className="flex justify-end gap-4">
                <button onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                <button onClick={onConfirm} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">Confirm</button>
            </div>
        </div>
    </div>
);


// --- MAIN APP COMPONENT --- //
export default function App() {
    const [text, setText] = useState('');
    const [wordCount, setWordCount] = useState(0);
    const [timeLeft, setTimeLeft] = useState(1200);
    const [timerActive, setTimerActive] = useState(false);
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
    
    const timerRef = useRef(null);
    const writingSheetRef = useRef(null);
    const initialTimeSpent = useRef(0);

    // --- API & Core Logic --- //
    
    const startTimer = useCallback(() => {
        if (!timerActive && !isTimeUp) {
            setTimerActive(true);
            initialTimeSpent.current = 1200 - timeLeft;
        }
    }, [timerActive, isTimeUp, timeLeft]);

    const handleTimerFinish = useCallback((manual = false) => {
        clearInterval(timerRef.current);
        setTimerActive(false);
        setIsTimeUp(true);
        if (manual) setShowConfirmModal(false);
    }, []);
    
    useEffect(() => {
        if (timerActive) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        handleTimerFinish();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [timerActive, handleTimerFinish]);

    useEffect(() => {
        const words = text.trim().split(/\s+/).filter(Boolean);
        setWordCount(words.length);
    }, [text]);

    const generateGraphTask = async () => {
        setIsGenerating(true);
        const prompts = [
            "A simple line graph for an IELTS writing task 1, showing changes in population in 3 different countries between 1990 and 2020.",
            "An IELTS academic writing task 1 bar chart comparing the percentage of households with different types of pets in the UK in 2010 and 2020.",
            "A pie chart for IELTS writing task 1 illustrating the main sources of electricity in a European country in 2023.",
            "An IELTS task 1 table showing the number of international students enrolled in universities in Canada, Australia, and the USA for the years 2015, 2018, and 2021.",
            "A process diagram for an IELTS task 1 showing the life cycle of a salmon."
        ];
        const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

        try {
            const apiKey = ""; 
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ instances: { prompt: randomPrompt }, parameters: { "sampleCount": 1 } })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.statusText}`);
            }

            const result = await response.json();
            if (result.predictions && result.predictions[0]?.bytesBase64Encoded) {
                const imageUrl = `data:image/png;base64,${result.predictions[0].bytesBase64Encoded}`;
                setImageUrl(imageUrl);
                startTimer();
            } else {
                 throw new Error("Invalid response structure from image generation API.");
            }
        } catch (error) {
            console.error("Error generating image:", error);
            // Fallback placeholder
            setImageUrl(`https://placehold.co/600x400/EBF4FF/1E40AF?text=Error+Generating+Image`);

        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleGrade = async () => {
        setIsGrading(true);
        setGradeButtonClicked(true);
        
        const systemPrompt = `As an expert IELTS examiner, evaluate the following Academic Writing Task 1 response. Provide your feedback as a single JSON object. Do not include any text, markdown, or comments outside of the JSON object. The JSON object must have the following structure:
        {
          "scores": {
            "TaskAchievement": { "score": 7.0, "observation": "A detailed explanation for this score, highlighting specific examples from the text that justify the band score. Mention strengths and areas for improvement." },
            "CoherenceAndCohesion": { "score": 6.5, "observation": "A detailed explanation for this score, highlighting specific examples from the text that justify the band score. Mention strengths and areas for improvement." },
            "LexicalResource": { "score": 6.0, "observation": "A detailed explanation for this score, highlighting specific examples from the text that justify the band score. Mention strengths and areas for improvement." },
            "GrammaticalRangeAndAccuracy": { "score": 7.5, "observation": "A detailed explanation for this score, highlighting specific examples from the text that justify the band score. Mention strengths and areas for improvement." }
          },
          "correctedHtml": "<string>"
        }
        For the 'correctedHtml' string, use the user's original essay. For each error, wrap the incorrect word/phrase in a <del> tag. Inside this tag, after the incorrect word, insert the correction inside a <span class='handwritten'> tag. Example: 'This is a <del>good<span class='handwritten'>great</span></del> idea.' Ensure the entire output is a valid JSON object starting with { and ending with }.`;
        
        const userQuery = `My essay is:\n---\n${text}\n---`;

        try {
            const apiKey = "";
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
            const payload = {
                contents: [{ parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
            };
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) throw new Error('Grading API request failed.');

            const result = await response.json();
            let responseText = result.candidates[0].content.parts[0].text;
            
            // Clean the response to ensure it is valid JSON by removing markdown fences
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                responseText = jsonMatch[0];
            }
            
            const parsedData = JSON.parse(responseText);
            setScore(parsedData.scores);
            setCorrectedHtml(parsedData.correctedHtml);

        } catch (error) {
            console.error("Error grading text:", error);
            // Provide a fallback error message in the UI
            setCorrectedHtml(`<p class="text-red-500">Sorry, an error occurred while grading. Please try resetting the session.</p>`);
        } finally {
            setIsGrading(false);
        }
    };

    const handleReset = () => {
        clearInterval(timerRef.current);
        setText('');
        setTimeLeft(1200);
        setTimerActive(false);
        setIsTimeUp(false);
        setImageUrl(null);
        setScore(null);
        setCorrectedHtml(null);
        setGradeButtonClicked(false);
        initialTimeSpent.current = 0;
    };
    
    // --- UI Handlers & Helpers --- //

    const handleTextChange = (e) => {
        if (!timerActive && !isTimeUp) {
            startTimer();
        }
        setText(e.target.value);
    };
    
    const handlePaste = (e) => {
        e.preventDefault();
    };

    const handleCopy = () => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
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

        // Ensure Inter font is loaded or fall back to a default
        try {
            doc.setFont('Inter', 'bold');
        } catch(e) {
            console.warn("Inter font not found in jsPDF. Falling back to default.");
            doc.setFont('helvetica', 'bold');
        }

        doc.setFontSize(20);
        doc.text('IELTS Writing Task 1 Report', pageWidth / 2, yPos, { align: 'center' });
        yPos += 30;
        
        try {
            doc.setFont('Inter', 'normal');
        } catch(e) {
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
            } catch(e) {
               doc.setFont('helvetica', 'bold');
            }
            doc.text('Detailed Scores & Feedback:', margin, yPos);
            yPos += 20;
            
            const availableWidth = pageWidth - (margin * 2) - 15;
            
            Object.entries(score).forEach(([key, value]) => {
                doc.setFontSize(11);
                try {
                   doc.setFont('Inter', 'bold');
                } catch(e) {
                   doc.setFont('helvetica', 'bold');
                }
                const scoreText = `${key.replace(/([A-Z])/g, ' $1').trim()}: ${value.score.toFixed(1)}`;

                try {
                   doc.setFont('Inter', 'normal');
                } catch(e) {
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
                } catch(e) {
                   doc.setFont('helvetica', 'bold');
                }
                doc.text(scoreText, margin + 5, yPos);
                yPos += 15;
                
                try {
                   doc.setFont('Inter', 'normal');
                } catch(e) {
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
                const imgHeight = (pageWidth - (margin*2)) * aspectRatio;

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
            } catch(e) {
                console.error("Error capturing writing sheet for PDF:", e);
                doc.text('Could not capture writing sheet.', margin, yPos);
            }
        }

        doc.save('ielts-report.pdf');
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    const calculateOverallScore = () => {
        if (!score) return 'N/A';
        const total = Object.values(score).reduce((sum, item) => sum + item.score, 0);
        const avg = total / 4;
        return (Math.round(avg * 2) / 2).toFixed(1);
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto+Mono:wght@400;500&family=Caveat:wght@700&display=swap');
                body { font-family: 'Inter', sans-serif; background-color: #f8fafc; }
                .font-roboto-mono { font-family: 'Roboto Mono', monospace; }
                .handwritten {
                    font-family: 'Caveat', cursive;
                    color: #1e40af; /* Darker blue for better contrast */
                    background-color: #e0f2fed1; /* Light blue background like a sticker */
                    padding: 0 0.3em; /* Reduced padding */
                    border-radius: 4px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    position: absolute;
                    left: 50%;
                    bottom: 80%;
                    line-height: 1em;
                    transform: translateX(-50%) translateY(4px); /* Lowered to partially cover the word */
                    white-space: nowrap;
                    font-size: 1.1em;
                    font-weight: 700;
                    pointer-events: none;
                }
                del {
                    color: #ef4444;
                    text-decoration: none; /* Use pseudo-element for strikethrough */
                    background-color: transparent;
                    position: relative;
                }
                del::after {
                    content: '';
                    position: absolute;
                    left: 0;
                    right: 0;
                    top: 50%;
                    border-bottom: 1.5px solid #ef4444;
                    pointer-events: none;
                }
                @keyframes blink { 50% { opacity: 0; } }
                .blinking { animation: blink 1s linear infinite; }
            `}</style>

            <div className="flex h-screen bg-slate-50 text-gray-800">
                {/* --- SIDEBAR --- */}
                <nav className="w-[8%] min-w-[80px] bg-white border-r border-slate-200 flex flex-col items-center py-6 gap-2">
                    <div className="w-12 h-12 bg-blue-600 rounded-full mb-8 flex items-center justify-center text-white font-bold text-xl">I</div>
                    {[
                        { icon: 'WRITING', label: 'Writing', active: true },
                        { icon: 'LISTENING', label: 'Listening' },
                        { icon: 'READING', label: 'Reading' },
                        { icon: 'SPEAKING', label: 'Speaking' },
                    ].map(item => {
                        const Icon = ICONS[item.icon];
                        return (
                            <button key={item.label} title={item.label} className={`w-full flex flex-col items-center p-3 rounded-lg transition-colors duration-200 ${item.active ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}>
                                <Icon className="w-7 h-7" />
                                <span className="text-xs mt-1">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* --- MAIN CONTENT --- */}
                <main className="w-[92%] p-6 flex gap-6 overflow-y-auto">
                    {/* --- Left Column: Controls & Task --- */}
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
                                        <p className={`font-roboto-mono text-3xl font-bold ${timeLeft <= 300 ? 'text-red-500 blinking' : 'text-slate-700'}`}>
                                            {formatTime(timeLeft)}
                                        </p>
                                    </div>
                                    <div className="border-l h-10 border-slate-200"></div>
                                    <div>
                                        <p className="text-sm text-slate-500">Word Count</p>
                                        <p className={`font-roboto-mono text-3xl font-bold ${wordCount >= 150 ? 'text-green-600' : 'text-slate-700'}`}>
                                            {wordCount}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-slate-200 flex-grow flex flex-col shadow-sm">
                            <h2 className="text-lg font-bold mb-3">Academic Task 1</h2>
                            <p className="text-sm text-slate-600 mb-4">You should spend about 20 minutes on this task. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.</p>
                            <div className="flex-grow flex items-center justify-center bg-slate-50 rounded-lg p-2">
                                {imageUrl ? (
                                    <img src={imageUrl} alt="Task Graph" className="max-h-full max-w-full object-contain rounded-md cursor-pointer" onClick={() => setIsImageModalOpen(true)} />
                                ) : !timerActive && !isTimeUp && (
                                    <button onClick={generateGraphTask} disabled={isGenerating} className="px-5 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-300 transition-all duration-200 flex items-center gap-2">
                                        {isGenerating ? 'Generating...' : 'Generate Random Graph Task'}
                                    </button>
                                )}
                                {timerActive && !imageUrl && (
                                    <p className="text-slate-500 text-center">Writing session started with your own material.</p>
                                )}
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 shadow-sm">
                           {!isTimeUp && <button onClick={() => setShowConfirmModal(true)} className="col-span-2 w-full p-3 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 transition-colors">End Session</button>}
                            
                            <button onClick={handleReset} className="w-full p-3 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors">Reset Session</button>
                            
                            <button onClick={handleGrade} disabled={!isTimeUp || text.trim().length === 0 || gradeButtonClicked} className="w-full p-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                                {isGrading && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                {isGrading ? 'Grading...' : 'Grade'}
                            </button>
                             {score && (
                                <>
                                 <div className="col-span-2 border-t my-2"></div>
                                    <button onClick={handleCopy} className="relative w-full p-3 bg-blue-100 text-blue-700 font-semibold rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center gap-2">
                                        <ICONS.COPY className="w-5 h-5"/> Copy Text
                                        {showCopyMessage && <span className="absolute -top-8 bg-slate-800 text-white text-xs px-2 py-1 rounded">Copied!</span>}
                                    </button>
                                    <button onClick={handleDownloadPdf} className="w-full p-3 bg-blue-100 text-blue-700 font-semibold rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center gap-2">
                                        <ICONS.DOWNLOAD className="w-5 h-5" /> PDF Report
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* --- Right Column: Writing Sheet --- */}
                    <div className="w-[62%] flex-grow flex flex-col">
                        <div ref={writingSheetRef} className="bg-[#FFFBF0] border border-yellow-200 shadow-inner flex-grow p-8 leading-relaxed font-roboto-mono text-[#1a1a1a] text-lg overflow-y-auto">
                            {correctedHtml ? (
                                <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: correctedHtml }}></div>
                            ) : (
                                <textarea
                                    value={text}
                                    onChange={handleTextChange}
                                    //onPaste={handlePaste}
                                    readOnly={isTimeUp}
                                    className="w-full h-full bg-transparent border-none outline-none resize-none placeholder-gray-400"
                                    placeholder="Start typing your response here..."
                                />
                            )}
                        </div>
                    </div>
                </main>
            </div>
            {/* --- MODALS --- */}
            <ImageModal imageUrl={imageUrl} onClose={() => setIsImageModalOpen(false)} />
            {isFeedbackModalOpen && <FeedbackModal score={score} onClose={() => setIsFeedbackModalOpen(false)} overallScore={calculateOverallScore()} />}
            {showConfirmModal && <ConfirmationModal onConfirm={() => handleTimerFinish(true)} onCancel={() => setShowConfirmModal(false)} message="Are you sure you want to end the session?" />}
        </>
    );
}