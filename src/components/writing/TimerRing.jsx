import React from 'react';

const TimerRing = ({ fraction, danger, size = 54, strokeWidth = 5 }) => {
    const r = 24, c = 2 * Math.PI * r;
    return (
        <div className="relative size-[54px]">
            <svg width={size} height={size} viewBox="0 0 54 54">
                <circle cx="27" cy="27" r={r} fill="none" className="stroke-slate-100" strokeWidth={strokeWidth} />
                <circle cx="27" cy="27" r={r} fill="none" className={danger ? 'stroke-red-500' : 'stroke-primary-600'} strokeWidth={strokeWidth}
                    strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - fraction)}
                    transform="rotate(-90 27 27)" style={{ transition: 'stroke-dashoffset .9s linear, stroke .3s ease' }} />
            </svg>
        </div>
    );
}

export default TimerRing;