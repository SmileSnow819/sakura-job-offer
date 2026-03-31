import React, { useState } from 'react';
import { Compass, PenTool, BookOpen, Sparkles } from 'lucide-react';

import { ICategory } from '../../types/bookmark';

const ICON_COMPONENTS: Record<string, React.ReactNode> = {
  Compass: <Compass size={20} />,
  PenTool: <PenTool size={20} />,
  BookOpen: <BookOpen size={20} />,
};

interface ISidebarDockProps {
  categories: ICategory[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const ICON_SIZE = 44;
const ICON_GAP = 10;

const SidebarDock: React.FC<ISidebarDockProps> = ({ categories, activeTab, onTabChange }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40">
      <div
        className="flex flex-row items-center px-4 py-2 rounded-[26px] bg-white/55 backdrop-blur-2xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.1),0_2px_8px_rgba(255,183,197,0.2)]"
        style={{ gap: ICON_GAP }}
      >
        {/* Logo */}
        <div
          className="flex items-center justify-center rounded-[13px] text-white shadow-sm flex-shrink-0"
          style={{ width: ICON_SIZE, height: ICON_SIZE, background: 'linear-gradient(135deg,#FFB7C5,#a1c4fd)' }}
        >
          <Sparkles size={19} />
        </div>

        {/* 分隔线 */}
        <div className="h-6 w-px rounded-full bg-[#FFB7C5]/35 flex-shrink-0" style={{ margin: '0 2px' }} />

        {/* Tab 图标列表 */}
        <ul className="flex flex-row items-center list-none m-0 p-0" style={{ gap: ICON_GAP }}>
          {categories.map((cat, i) => {
            const isActive = cat.id === activeTab;
            const isHovered = hoveredIndex === i;
            return (
              <li
                key={cat.id}
                className="relative flex flex-col items-center"
                style={{ width: ICON_SIZE, height: ICON_SIZE }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Tooltip */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: ICON_SIZE + 10,
                    left: '50%',
                    transform: `translateX(-50%) translateY(${isHovered ? 0 : 6}px)`,
                    opacity: isHovered ? 1 : 0,
                    pointerEvents: 'none',
                    transition: 'opacity 0.15s ease, transform 0.15s ease',
                    whiteSpace: 'nowrap',
                    zIndex: 999,
                  }}
                >
                  <div style={{
                    background: 'rgba(255,255,255,0.96)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    color: '#5D4037',
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '5px 14px',
                    borderRadius: 12,
                    border: '1px solid rgba(255,183,197,0.55)',
                    boxShadow: '0 4px 18px rgba(255,107,158,0.2)',
                    letterSpacing: 0.3,
                  }}>
                    {cat.name}
                  </div>
                </div>

                <button
                  onClick={() => onTabChange(cat.id)}
                  className="w-full h-full flex items-center justify-center rounded-[13px] relative"
                  style={{
                    background: isActive
                      ? 'linear-gradient(135deg,#ffe6f0,#fff)'
                      : isHovered ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)',
                    border: isActive ? '1.5px solid rgba(255,183,197,0.65)' : '1.5px solid rgba(255,255,255,0.75)',
                    color: isActive || isHovered ? '#FF6B9E' : '#8D6E63',
                    boxShadow: isActive
                      ? '0 4px 14px rgba(255,107,158,0.2)'
                      : isHovered ? '0 6px 18px rgba(255,107,158,0.18)' : '0 2px 6px rgba(0,0,0,0.05)',
                    transform: isHovered && !isActive ? 'scale(1.12) translateY(-3px)' : 'none',
                    transition: 'all 0.15s ease',
                    cursor: 'pointer',
                  }}
                >
                  {ICON_COMPONENTS[cat.icon] ?? <Compass size={20} />}
                </button>

                {isActive && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#FF6B9E]" />
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default React.memo(SidebarDock);
