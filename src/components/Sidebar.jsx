import React from 'react';
import { ICONS, navigationStructure } from '../constants/navigation';

const Sidebar = ({ activeView, setActiveView }) => {
    return (
        <nav className="w-24 min-w-24 bg-white border-r border-slate-100 flex flex-col items-center py-6 gap-2">
            <div className="w-12 h-12 bg-primary-600 shadow-md shadow-primary-600 rounded-full mb-6 flex items-center justify-center text-white font-bold text-xl">I</div>
            {navigationStructure.map(item => {
                const Icon = ICONS[item.icon];
                const isMainActive = item.label === activeView.main;
                return (
                    <div key={item.label} className="w-full px-2">
                        <div
                            onClick={() => setActiveView({ main: item.label, sub: item.subItems[0] })}
                            className={`w-full relative flex flex-col items-center pt-2 pb-3 rounded-2xl transition-colors duration-200 cursor-pointer ${isMainActive ? 'bg-primary-50 text-primary-600' : 'text-slate-500/45 hover:bg-slate-100'}`}
                        >
                            <Icon className="w-6 h-6" />
                            <span className="text-xs mt-1 font-semibold">{item.label}</span>
                            <span className={`absolute -left-[10px] top-1/2 -translate-y-1/2 w-[6px] h-6 mt-1 rounded-e-sm ${isMainActive ? 'bg-primary-600' : 'bg-transparent'}`}></span>
                        </div>
                        {isMainActive && (
                            <div className="flex flex-col items-center mt-2 space-y-1">
                                {item.subItems.map(subItem => {
                                    const isSubActive = subItem === activeView.sub;
                                    return (
                                        <button
                                            key={subItem}
                                            onClick={() => setActiveView({ main: item.label, sub: subItem })}
                                            className={`w-full text-center text-xs py-2 px-1 rounded-2xl transition-colors ${isSubActive ? 'bg-primary-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-200'}`}
                                        >
                                            {subItem}
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </nav>
    );
};

export default Sidebar;
