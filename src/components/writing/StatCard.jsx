import React from 'react';
import TimerRing from './TimerRing';
import formatTime from '../../utils/formatTime';

const StatCard = ({ hasScore, overallScore, onOpenFeedback, timeLeft, totalTime, timerActive, wordCount, wordTarget }) => {
    return (
        <div className="bg-white py-5 rounded-2xl border border-slate-100 flex justify-around items-center text-center shadow-slate-90/4 shadow-sm">
            {hasScore ? (
                <>
                    <div className="w-full hover:cursor-pointer" onClick={onOpenFeedback}>
                        <p className="text-xs text-slate-500">Overall Estimated Band Score</p>
                        <p className="text-5xl font-bold text-primary-600">{overallScore}</p>
                        <p className="text-xs text-slate-400 mt-1">Click for detailed feedback</p>
                    </div>
                </>) : (
                <>
                    <div>
                        <p className="text-xs text-slate-500 mb-3">TIME LEFT</p>
                        <div className="flex items-center justify-between gap-4">
                            <TimerRing fraction={timeLeft / totalTime} danger={timeLeft <= (totalTime * 0.25)} />
                            <p className={`font-roboto-mono text-2xl font-semibold ${timeLeft <= (totalTime * 0.25) ? 'text-red-500 animate-blink' : 'text-slate-700'}`}>{formatTime(timeLeft)}</p>
                        </div>
                    </div>
                    <div className="border-l h-10 border-slate-100"></div>
                    <div>
                        <p className="text-xs text-slate-500">WORD COUNT</p>
                        <p className={`font-roboto-mono text-3xl font-bold ${wordCount >= wordTarget ? 'text-green-600' : 'text-slate-700'}`}>{wordCount}</p>
                        <div className="w-full bg-slate-100 rounded-full h-2 mt-1">
                            <div className={`bg-primary-600 h-2 rounded-full transition-all duration-300 ease-in-out ${wordCount >= wordTarget ? 'bg-green-600' : ''}`} style={{ width: `${Math.min((wordCount / wordTarget) * 100, 100)}%` }}></div>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{wordCount >= wordTarget ? 'Minimum reached' : `Target ${wordTarget} words`}</p>
                    </div>
                </>)}
        </div>
    );
};

export default StatCard;