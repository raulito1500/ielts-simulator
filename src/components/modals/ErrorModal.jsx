import React from 'react';

const ErrorModal = ({ message, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white p-6 rounded-lg shadow-xl font-inter max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
                <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <h3 className="text-lg font-semibold text-slate-800">Error</h3>
            </div>
            <p className="text-slate-600 mb-5">{message}</p>
            <div className="flex justify-end">
                <button onClick={onClose} className="px-5 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 font-medium">OK</button>
            </div>
        </div>
    </div>
);

export default ErrorModal;
