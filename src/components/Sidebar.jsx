import React from 'react';
import { ICONS, navigationStructure } from '../constants/navigation';

const Sidebar = ({ activeView, setActiveView }) => {
    return (
        <nav className="w-[8%] min-w-[100px] bg-white border-r border-slate-200 flex flex-col items-center py-6 gap-2">
            <div className="w-12 h-12 bg-blue-600 rounded-full mb-6 flex items-center justify-center text-white font-bold text-xl">I</div>
            {navigationStructure.map(item => {
                const Icon = ICONS[item.icon];
                const isMainActive = item.label === activeView.main;
                return (
                    <div key={item.label} className="w-full px-2">
                        <div
                            onClick={() => setActiveView({ main: item.label, sub: item.subItems[0] })}
                            className={`w-full flex flex-col items-center p-2 rounded-lg transition-colors duration-200 cursor-pointer ${isMainActive ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            <Icon className="w-7 h-7" />
                            <span className="text-xs mt-1 font-semibold">{item.label}</span>
                        </div>
                        {isMainActive && (
                            <div className="flex flex-col items-center mt-2 space-y-1">
                                {item.subItems.map(subItem => {
                                    const isSubActive = subItem === activeView.sub;
                                    return (
                                        <button
                                            key={subItem}
                                            onClick={() => setActiveView({ main: item.label, sub: subItem })}
                                            className={`w-full text-center text-xs py-2 px-1 rounded-md transition-colors ${isSubActive ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-200'}`}
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
