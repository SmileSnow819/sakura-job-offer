import React, { useRef, useState } from 'react';
import { CalendarDays, Compass, PenTool, BookOpen, BriefcaseBusiness } from 'lucide-react';
import gsap from 'gsap';

import { ICategory } from '../../types/bookmark';
import {
  getDockItemWidth,
  getDockScale,
  getDockTooltipBottom,
} from '../../utils/dockMagnification';

const ICON_COMPONENTS: Record<string, React.ReactNode> = {
  BriefcaseBusiness: <BriefcaseBusiness size={20} />,
  Compass: <Compass size={20} />,
  CalendarDays: <CalendarDays size={20} />,
  PenTool: <PenTool size={20} />,
  BookOpen: <BookOpen size={20} />,
};

interface ISidebarDockProps {
  categories: ICategory[];
  activeTab: string;
  launchActive?: boolean;
  onTabChange: (tabId: string) => void;
}

/** 根据当前视口返回 Dock 图标的基础尺寸。 */
const getIconSize = () => {
  if (typeof window === 'undefined') return 44;
  return window.innerWidth <= 400 ? 38 : window.innerWidth <= 768 ? 42 : 44;
};

const ICON_SIZE = getIconSize();
const ICON_GAP = 8;
const DOCK_MAX_SCALE = 1.65;
const DOCK_BUTTON_LIFT = 22;
const DOCK_TOOLTIP_GAP = 8;
const LOGO_URL = `${import.meta.env.BASE_URL}sakura-offer-icon.svg`;

interface IDockTooltipProps {
  label: string;
  isVisible: boolean;
  iconSize: number;
  scale: number;
  verticalLift: number;
}

/**
 * 显示贴近图标顶部的粉色胶囊提示，尾巴与放大的图标保持连续的视觉关系。
 */
const DockTooltip: React.FC<IDockTooltipProps> = ({
  label,
  isVisible,
  iconSize,
  scale,
  verticalLift,
}) => (
  <div
    role="tooltip"
    aria-hidden={!isVisible}
    style={{
      position: 'absolute',
      bottom: getDockTooltipBottom(iconSize, scale, verticalLift, DOCK_TOOLTIP_GAP),
      left: '50%',
      transform: `translateX(-50%) translateY(${isVisible ? 0 : 6}px)`,
      opacity: isVisible ? 1 : 0,
      pointerEvents: 'none',
      transition: 'opacity 0.15s ease, transform 0.15s ease',
      whiteSpace: 'nowrap',
      zIndex: 999,
    }}
  >
    <div
      style={{
        position: 'relative',
        padding: '6px 14px',
        border: '1px solid var(--pink-400)',
        borderRadius: 999,
        background: 'var(--pink-100)',
        boxShadow: '0 6px 18px rgba(255, 107, 158, 0.3)',
        color: 'var(--pink-600)',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 0.3,
      }}
    >
      {label}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: -6,
          left: '50%',
          width: 11,
          height: 11,
          transform: 'translateX(-50%) rotate(45deg)',
          borderRight: '1px solid var(--pink-400)',
          borderBottom: '1px solid var(--pink-400)',
          borderRadius: 2,
          background: 'var(--pink-100)',
          zIndex: -1,
        }}
      />
    </div>
  </div>
);

/**
 * 展示分类导航的底部 Dock，并在鼠标靠近时按 macOS 风格放大相邻图标。
 *
 * 放大项同步扩展其布局宽度，确保按钮和提示文字不会压住相邻项目。
 */
const SidebarDock: React.FC<ISidebarDockProps> = ({
  categories,
  activeTab,
  launchActive = false,
  onTabChange,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handlePointerMove = (event: React.PointerEvent<HTMLUListElement>) => {
    if (
      event.pointerType !== 'mouse' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;

    itemRefs.current.forEach((item, index) => {
      const button = buttonRefs.current[index];
      if (!item || !button) return;

      const rect = item.getBoundingClientRect();
      const scale = getDockScale(event.clientX, rect.left + rect.width / 2, ICON_SIZE);
      gsap.to(button, {
        scale,
        y: -(scale - 1) * DOCK_BUTTON_LIFT,
        duration: 0.12,
        ease: 'power2.out',
        overwrite: true,
      });
      gsap.to(item, {
        width: getDockItemWidth(ICON_SIZE, scale),
        duration: 0.12,
        ease: 'power2.out',
        overwrite: true,
      });
    });
  };

  const handlePointerLeave = () => {
    setHoveredIndex(null);
    gsap.to(buttonRefs.current, {
      scale: 1,
      y: 0,
      duration: 0.34,
      ease: 'back.out(1.8)',
      overwrite: true,
    });
    gsap.to(itemRefs.current, {
      width: ICON_SIZE,
      duration: 0.34,
      ease: 'back.out(1.8)',
      overwrite: true,
    });
  };

  return (
    <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 overflow-visible">
      <style>{`
        @keyframes autumnDockPulse {
          0%, 100% { box-shadow: 0 4px 14px var(--pink-400); }
          50% { box-shadow: 0 0 0 10px rgba(255,107,158,0), 0 12px 28px rgba(255,107,158,0.5); }
        }
      `}</style>
      <div
        className="flex flex-row items-center overflow-visible rounded-[26px] border border-white/80 bg-white/55 px-4 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.1),0_2px_8px_rgba(255,183,197,0.2)] backdrop-blur-2xl"
        style={{ gap: ICON_GAP }}
      >
        {/* Logo */}
        <div
          className="relative flex items-center justify-center rounded-[13px] text-white shadow-sm flex-shrink-0"
          style={{
            width: ICON_SIZE,
            height: ICON_SIZE,
            background: 'linear-gradient(135deg, var(--pink-400), var(--blue-400))',
            transform: isLogoHovered ? 'scale(1.08) translateY(-2px)' : 'none',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            boxShadow: isLogoHovered ? '0 6px 18px var(--pink-400)' : '0 2px 6px rgba(0,0,0,0.05)',
          }}
          onMouseEnter={() => setIsLogoHovered(true)}
          onMouseLeave={() => setIsLogoHovered(false)}
          aria-label="Sakura Offer Hub"
        >
          <DockTooltip
            label="Sakura Offer Hub"
            isVisible={isLogoHovered}
            iconSize={ICON_SIZE}
            scale={1.08}
            verticalLift={2 / 0.08}
          />
          <img
            src={LOGO_URL}
            alt=""
            aria-hidden="true"
            style={{
              width: ICON_SIZE - 8,
              height: ICON_SIZE - 8,
              borderRadius: 11,
              display: 'block',
              objectFit: 'cover',
            }}
          />
        </div>

        {/* 分隔线 */}
        <div
          className="h-6 w-px rounded-full flex-shrink-0"
          style={{ margin: '0 2px', background: 'var(--pink-300)' }}
        />

        {/* Tab 图标列表 */}
        <ul
          className="m-0 flex list-none flex-row items-end overflow-visible p-0"
          style={{ gap: ICON_GAP }}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          {categories.map((cat, i) => {
            const isActive = cat.id === activeTab;
            const isHovered = hoveredIndex === i;
            const isLaunchTarget = launchActive && cat.id === 'autumn';
            return (
              <li
                key={cat.id}
                ref={(element) => {
                  itemRefs.current[i] = element;
                }}
                className="relative flex shrink-0 flex-col items-center"
                style={{
                  width: ICON_SIZE,
                  height: ICON_SIZE,
                  zIndex: isHovered || isLaunchTarget ? 10 : 1,
                }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <DockTooltip
                  label={isLaunchTarget ? '秋招专场上线' : cat.name}
                  isVisible={isHovered || isLaunchTarget}
                  iconSize={ICON_SIZE}
                  scale={isLaunchTarget ? 1.28 : DOCK_MAX_SCALE}
                  verticalLift={isLaunchTarget ? 8 / 0.28 : DOCK_BUTTON_LIFT}
                />

                <button
                  ref={(element) => {
                    buttonRefs.current[i] = element;
                  }}
                  aria-label={cat.name}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => onTabChange(cat.id)}
                  className="relative flex items-center justify-center rounded-[13px]"
                  style={{
                    width: ICON_SIZE,
                    height: ICON_SIZE,
                    background: isActive
                      ? 'linear-gradient(135deg, var(--pink-50), var(--neutral-50))'
                      : isHovered
                        ? 'rgba(255,255,255,0.9)'
                        : 'rgba(255,255,255,0.6)',
                    border: isActive
                      ? '1.5px solid var(--pink-400)'
                      : '1.5px solid rgba(255,255,255,0.75)',
                    color: isActive || isHovered ? 'var(--pink-500)' : 'var(--neutral-600)',
                    boxShadow: isLaunchTarget
                      ? '0 0 0 5px rgba(255,107,158,0.16), 0 12px 28px rgba(255,107,158,0.48)'
                      : isActive
                        ? '0 4px 14px var(--pink-400)'
                        : isHovered
                          ? '0 6px 18px var(--pink-400)'
                          : '0 2px 6px rgba(0,0,0,0.05)',
                    transform: isLaunchTarget ? 'scale(1.28) translateY(-8px)' : undefined,
                    transformOrigin: 'bottom center',
                    transition: 'box-shadow 0.15s ease, background 0.15s ease',
                    animation: isLaunchTarget ? 'autumnDockPulse 0.75s ease-in-out 3' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  {ICON_COMPONENTS[cat.icon] ?? <Compass size={20} />}
                </button>

                {isActive && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '-0.375rem',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '0.25rem',
                      height: '0.25rem',
                      borderRadius: '9999px',
                      background: 'var(--pink-500)',
                    }}
                  />
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
