import React from 'react';

const PlaceholderPage = ({ title }) => (
    <div className="w-full h-full flex items-center justify-center bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-700">{title}</h1>
            <p className="mt-2 text-slate-500">This feature is coming soon.</p>
        </div>
    </div>
);

export default PlaceholderPage;
