import React, { useState } from 'react';
import { ICONS } from '../../constants/navigation';

const FeedbackModal = ({ score, onClose, overallScore }) => {
    const [openAccordion, setOpenAccordion] = useState(null);
    const toggleAccordion = (index) => setOpenAccordion(openAccordion === index ? null : index);
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

export default FeedbackModal;
