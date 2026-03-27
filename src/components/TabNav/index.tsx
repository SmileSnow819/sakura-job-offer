import React, { ReactNode } from 'react';
import { Compass, PenTool } from 'lucide-react';

import { ICategory } from '../../types/bookmark';

const ICON_MAP: Record<string, ReactNode> = {
  Compass: <Compass size={20} />,
  PenTool: <PenTool size={20} />,
};

interface ITabNavProps {
  categories: ICategory[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const TabNav: React.FC<ITabNavProps> = ({ categories, activeTab, onTabChange }) => (
  <nav className="bg-white/50 backdrop-blur-xl border border-white/80 rounded-3xl p-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex md:flex-col gap-2 overflow-x-auto hide-scrollbar">
    {categories.map((category) => (
      <button
        key={category.id}
        onClick={() => onTabChange(category.id)}
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 whitespace-nowrap md:whitespace-normal font-medium ${
          activeTab === category.id
            ? 'bg-gradient-to-r from-[#ffe6f0] to-white text-[#FF6B9E] shadow-sm border border-[#ffb7c5]/50'
            : 'text-brown hover:bg-white/60 hover-pink'
        }`}
      >
        <span className={activeTab === category.id ? 'text-[#FF6B9E]' : 'opacity-70'}>
          {ICON_MAP[category.icon]}
        </span>
        {category.name}
      </button>
    ))}
  </nav>
);

export default React.memo(TabNav);
