import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import gsap from 'gsap';

import bookmarkDataRaw from './bookmarks.json';
import { IBookmarkData } from './types/bookmark';
import SidebarDock from './components/SidebarDock';
import BookmarkGrid from './components/BookmarkGrid';
import LoadingScreen from './components/LoadingScreen';

const bookmarkData = bookmarkDataRaw as IBookmarkData;

// ── Sakura petals background ──────────────────────────────────────────────────

const SakuraPetals: React.FC = () => {
  const petals = Array.from({ length: 25 }).map((_, i) => {
    const left = Math.random() * 100;
    const duration = 5 + Math.random() * 10;
    const delay = Math.random() * 5;
    const size = 10 + Math.random() * 15;
    const opacity = 0.3 + Math.random() * 0.5;
    return (
      <div
        key={i}
        className="absolute pointer-events-none rounded-tl-full rounded-br-full rounded-tr-sm rounded-bl-sm"
        style={{
          left: `${left}%`,
          top: '-20px',
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: '#ffb7c5',
          opacity,
          boxShadow: '0 0 10px rgba(255, 183, 197, 0.5)',
          animation: `fall ${duration}s linear infinite`,
          animationDelay: `-${delay}s`,
          transform: 'rotate(45deg)',
        } as React.CSSProperties}
      />
    );
  });
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">{petals}</div>
  );
};

// ── App ───────────────────────────────────────────────────────────────────────

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>(bookmarkData.categories[0].id);
  const [toast, setToast] = useState<string | null>(null);

  const mainRef = useRef<HTMLElement>(null);
  const dockWrapRef = useRef<HTMLDivElement>(null);

  const activeCategory = bookmarkData.categories.find((c) => c.id === activeTab)!;

  // ── 从右侧推入的入场动画 ──
  const handleLoadComplete = useCallback(() => {
    setLoading(false);
    // 下一帧确保元素已渲染
    requestAnimationFrame(() => {
      gsap.fromTo(
        [mainRef.current, dockWrapRef.current],
        { x: '100%', opacity: 0 },
        { x: '0%', opacity: 1, duration: 0.65, ease: 'power3.out', stagger: 0.08 },
      );
    });
  }, []);

  // 初始隐藏主内容（loading 期间不可见）
  useEffect(() => {
    if (mainRef.current) gsap.set(mainRef.current, { x: '100%', opacity: 0 });
    if (dockWrapRef.current) gsap.set(dockWrapRef.current, { x: '100%', opacity: 0 });
  }, []);

  const handleTabChange = useCallback((newTabId: string) => {
    setActiveTab(newTabId);
  }, []);

  const handleShare = useCallback((e: React.MouseEvent, url: string) => {
    e.preventDefault();
    e.stopPropagation();
    const ta = document.createElement('textarea');
    ta.value = url;
    ta.style.cssText = 'position:fixed;opacity:0;';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
      setToast('链接复制成功啦！(ﾉ>ω<)ﾉ');
    } catch {
      setToast('复制失败了 QAQ');
    }
    document.body.removeChild(ta);
    setTimeout(() => setToast(null), 2000);
  }, []);

  return (
    <>
      {loading && <LoadingScreen onComplete={handleLoadComplete} />}

      <style>{`
        html, body, #root { height: 100%; margin: 0; padding: 0; }
        @keyframes fall {
          0%   { transform: translateY(-20px) rotate(0deg) translateX(0); }
          100% { transform: translateY(100vh) rotate(360deg) translateX(50px); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-5px); }
        }
        .text-brown { color: #5D4037; }
        .hover-pink:hover { color: #FF6B9E; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* 全屏背景渐变 */}
      <div
        className="fixed inset-0 -z-10"
        style={{ background: 'linear-gradient(135deg, #fff0f5 0%, #e6f2ff 50%, #ffe6f0 100%)' }}
      />

      <SakuraPetals />

      {/* 主内容区：铺满视口，底部留出 Dock 高度，初始隐藏在右侧 */}
      <main
        ref={mainRef}
        className="relative z-10 flex flex-col"
        style={{
          position: 'fixed',
          inset: 0,
          paddingBottom: 88,
          background: 'rgba(255,255,255,0.38)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          overflow: 'hidden',
        }}
      >
        <BookmarkGrid
          category={activeCategory}
          allCategories={bookmarkData.categories}
          onShare={handleShare}
        />
      </main>

      {/* 底部 Dock（fixed，自己管理 z-index） */}
      <div ref={dockWrapRef} style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40, pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto' }}>
          <SidebarDock
            categories={bookmarkData.categories}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </div>
      </div>

      {/* Toast 通知 */}
      {toast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl border border-[#ffb7c5] text-[#FF6B9E] px-6 py-3 rounded-full shadow-[0_8px_30px_rgba(255,183,197,0.4)] flex items-center gap-2 z-50">
          <Check size={18} strokeWidth={3} />
          <span className="font-bold tracking-wide text-sm">{toast}</span>
        </div>
      )}
    </>
  );
};

export default App;
