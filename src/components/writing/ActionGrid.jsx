import React from 'react';
import { ICONS } from '../../constants/navigation';

const ActionGrid = ({
    isTimeUp,
    endSessionDisabled,
    onEndSession,
    onReset,
    onGrade,
    isGrading,
    gradeDisabled,
    hasScore,
    onCopy,
    showCopyMessage,
    showPdfButton,
    onDownloadPdf,
}) => {
    return (
        <div className="bg-white p-4 rounded-2xl border border-slate-100 grid grid-cols-2 gap-3 shadow-sm">
            {!isTimeUp && (
                <button
                    disabled={endSessionDisabled}
                    onClick={onEndSession}
                    className="col-span-2 w-full px-4 py-3 bg-red-100 text-red-700 font-semibold rounded-xl hover:bg-red-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                    End Session
                </button>
            )}
            <button onClick={onReset} className="w-full px-4 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200">
                Reset
            </button>
            <button
                onClick={onGrade}
                disabled={gradeDisabled}
                className="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
                {isGrading && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>}
                {isGrading ? 'Grading...' : 'Grade'}
            </button>
            {hasScore && (
                <>
                    <div className="col-span-2 border-t my-2"></div>
                    <button
                        onClick={onCopy}
                        className={`relative w-full p-3 bg-primary-100 text-primary-700 font-semibold rounded-xl hover:bg-primary-200 flex items-center justify-center gap-2 ${showPdfButton ? '' : 'col-span-2'}`}
                    >
                        <ICONS.COPY className="w-5 h-5" /> Copy Text
                        {showCopyMessage && <span className="absolute -top-8 bg-slate-800 text-white text-xs px-2 py-1 rounded">Copied!</span>}
                    </button>
                    {showPdfButton && (
                        <button onClick={onDownloadPdf} className="w-full p-3 bg-primary-100 text-primary-700 font-semibold rounded-xl hover:bg-primary-200 flex items-center justify-center gap-2">
                            <ICONS.DOWNLOAD className="w-5 h-5" /> PDF Report
                        </button>
                    )}
                </>
            )}
        </div>
    );
};

export default ActionGrid;
