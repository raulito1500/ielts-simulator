import React from 'react';

const STATUS_BY_PHASE = {
    idle: { label: 'Not started', dot: 'bg-slate-300' },
    writing: { label: 'Session in progress', dot: 'bg-green-500' },
    ended: { label: 'Session ended', dot: 'bg-red-500' },
    graded: { label: 'Graded', dot: 'bg-red-500' },
};

const Header = ({ main, sub, phase }) => {
    const status = phase ? (STATUS_BY_PHASE[phase] || STATUS_BY_PHASE.idle) : null;
    return (
        <header className="h-16 flex-shrink-0 flex items-center bg-white border-b border-slate-100 px-6">
            <div className="flex items-baseline gap-2">
                <span className="text-sm font-normal text-slate-500">{main}</span>
                <span className="text-slate-300">/</span>
                <span className="text-sm font-normal text-slate-900">{sub}</span>
            </div>
            {status && (
                <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                    <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                    {status.label}
                </div>
            )}
        </header>
    );
};

export default Header;
