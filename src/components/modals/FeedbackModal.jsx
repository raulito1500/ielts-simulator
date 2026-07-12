import React, { useState } from 'react';
import { ICONS } from '../../constants/navigation';

const FeedbackModal = ({ score, onClose, overallScore }) => {
    const [openAccordion, setOpenAccordion] = useState(null);
    const toggleAccordion = (index) => setOpenAccordion(openAccordion === index ? null : index);
    if (!score) return null;
    const criteria = Object.keys(score);
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-0 m-0" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center border-b border-slate-200 p-6 pb-4 m-0">
                    <h2 className="text-xl font-bold text-gray-800">Your Detailed Feedback</h2>
                    <button onClick={onClose} className="text-slate-400 size-8 rounded-lg grid content-center hover:bg-slate-50 text-2xl">&times;</button>
                </div>
                <div className="text-center bg-primary-50 m-6 p-4 rounded-xl border-primary-100 border mb-6">
                    <p className="text-sm text-slate-500">Overall Estimated Band Score</p>
                    <p className="text-5xl font-roboto-mono font-bold text-primary-600">{overallScore}</p>
                </div>
                <div className="m-6 space-y-3">
                    {criteria.map((criterion, index) => (
                        <div key={criterion} className="border border-slate-100 bg-slate-50 rounded-lg overflow-hidden">
                            <button onClick={() => toggleAccordion(index)} className="w-full flex justify-between items-center p-4">
                                <span className="font-semibold text-slate-900">{criterion.replace(/([A-Z])/g, ' $1').trim()}</span>
                                <div className='flex items-center gap-4'>
                                    <span className='font-bold font-roboto-mono text-lg text-primary-600'>{score[criterion].score.toFixed(1)}</span>
                                    <ICONS.CHEVRON className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${openAccordion === index ? 'rotate-180' : ''}`} />
                                </div>
                            </button>
                            {openAccordion === index && (
                                <div className="p-4 pt-0">
                                    <p className="text-slate-500 text-sm font-normal whitespace-pre-line">{score[criterion].observation}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FeedbackModal;
