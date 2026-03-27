import React, { useRef, useCallback } from 'react';
import { Compass, PenTool, Sparkles } from 'lucide-react';
import gsap from 'gsap';

import { ICategory } from '../../types/bookmark';

const ICON_COMPONENTS: Record<string, React.ReactNode> = {
  Compass: <Compass size={20} />,
  PenTool: <PenTool size={20} />,
};

interface ISidebarDockProps {
  categories: ICategory[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const ICON_SIZE = 44;
const ICON_GAP = 10;

const SidebarDock: React.FC<ISidebarDockProps> = ({ categories, activeTab, onTabChange }) => {
  const tooltipRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleItemEnter = useCallback((i: number, itemEl: HTMLLIElement) => {
    const tooltip = tooltipRefs.current[i];
    if (!tooltip) return;
    const rect = itemEl.getBoundingClientRect();
    gsap.set(tooltip, { left: rect.left + rect.width / 2, top: rect.top - 8, xPercent: -50, yPercent: -100 });
    gsap.fromTo(tooltip, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.18, ease: 'power2.out' });
  }, []);

  const handleItemLeave = useCallback((i: number) => {
    const tooltip = tooltipRefs.current[i];
    if (!tooltip) return;
    gsap.to(tooltip, { opacity: 0, duration: 0.12 });
  }, []);

  return (
    <>
      {/* Tooltip 层（fixed，完全脱离文档流，不会撑开 Dock） */}
      {categories.map((cat, i) => (
        <div
          key={cat.id}
          ref={(el) => { tooltipRefs.current[i] = el; }}
          className="fixed pointer-events-none opacity-0 whitespace-nowrap z-50"
          style={{ transform: 'none' }}
        >
          <div className="bg-white/90 backdrop-blur-md text-[#5D4037] text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#FFB7C5]/40 shadow-[0_4px_14px_rgba(255,107,158,0.15)]">
            {cat.name}
          </div>
        </div>
      ))}

      {/* Dock 容器 */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40">
        <div
          className="flex flex-row items-center px-4 py-2 rounded-[26px] bg-white/55 backdrop-blur-2xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.1),0_2px_8px_rgba(255,183,197,0.2)]"
          style={{ gap: ICON_GAP }}
        >
          {/* Logo（装饰） */}
          <div
            className="flex items-center justify-center rounded-[13px] text-white shadow-sm flex-shrink-0"
            style={{ width: ICON_SIZE, height: ICON_SIZE, background: 'linear-gradient(135deg,#FFB7C5,#a1c4fd)' }}
          >
            <Sparkles size={19} />
          </div>

          {/* 分隔线 */}
          <div className="h-6 w-px rounded-full bg-[#FFB7C5]/35 flex-shrink-0" style={{ margin: `0 2px` }} />

          {/* Tab 图标列表 */}
          <ul className="flex flex-row items-center list-none m-0 p-0" style={{ gap: ICON_GAP }}>
            {categories.map((cat, i) => {
              const isActive = cat.id === activeTab;
              return (
                <li
                  key={cat.id}

                  className="relative flex flex-col items-center"
                  style={{ width: ICON_SIZE, height: ICON_SIZE }}
                  onMouseEnter={(e) => handleItemEnter(i, e.currentTarget)}
                  onMouseLeave={() => handleItemLeave(i)}  
                >
                  <button
                    onClick={() => onTabChange(cat.id)}
                    className="w-full h-full flex items-center justify-center rounded-[13px] relative transition-all duration-150"
                    style={{
                      background: isActive ? 'linear-gradient(135deg,#ffe6f0,#fff)' : 'rgba(255,255,255,0.6)',
                      border: isActive ? '1.5px solid rgba(255,183,197,0.65)' : '1.5px solid rgba(255,255,255,0.75)',
                      color: isActive ? '#FF6B9E' : '#8D6E63',
                      boxShadow: isActive ? '0 4px 14px rgba(255,107,158,0.2)' : '0 2px 6px rgba(0,0,0,0.05)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.9)';
                        e.currentTarget.style.color = '#FF6B9E';
                        e.currentTarget.style.transform = 'scale(1.12) translateY(-3px)';
                        e.currentTarget.style.boxShadow = '0 6px 18px rgba(255,107,158,0.18)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.6)';
                        e.currentTarget.style.color = '#8D6E63';
                        e.currentTarget.style.transform = '';
                        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.05)';
                      }
                    }}
                  >
                    {ICON_COMPONENTS[cat.icon]}
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
    </>
  );
};

export default React.memo(SidebarDock);
