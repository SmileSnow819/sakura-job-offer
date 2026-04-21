import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Hash } from 'lucide-react';
import gsap from 'gsap';

import { ICategory, ILink } from '../../types/bookmark';
import mottosRaw from '../../mottos.json';

const MOTTOS: string[] = mottosRaw as string[];
import { getFavicon, handleImgError } from '../../utils/getFavicon';

interface IBookmarkGridProps {
  category: ICategory;
  allCategories: ICategory[];
  onShare: (e: React.MouseEvent, url: string) => void;
}

// ── 轮播参数 ──────────────────────────────────────────────────────────────────
const VISIBLE = 5;

const getResponsiveCardSize = () => {
  if (typeof window === 'undefined') return { width: 280, height: 390 };
  return window.innerWidth <= 768
    ? { width: 240, height: 340 }
    : { width: 280, height: 390 };
};

const { width: CARD_W, height: CARD_H } = getResponsiveCardSize();
const X_GAP = 40;
const PITCH = CARD_W + X_GAP;

const SLOT_STYLES: Record<number, { scale: number; opacity: number; zIndex: number; y: number }> = {
  [-2]: { scale: 0.72, opacity: 0.28, zIndex: 1,  y: 18 },
  [-1]: { scale: 0.85, opacity: 0.58, zIndex: 2,  y: 9  },
   [0]: { scale: 1.00, opacity: 1.00, zIndex: 10, y: 0  },
   [1]: { scale: 0.85, opacity: 0.58, zIndex: 2,  y: 9  },
   [2]: { scale: 0.72, opacity: 0.28, zIndex: 1,  y: 18 },
};
const HIDDEN_STYLE = { scale: 0.6, opacity: 0, zIndex: 0, y: 30 };

// ── 单张卡片 ──────────────────────────────────────────────────────────────────
interface ICarouselCardProps {
  link: ILink;
  isActive: boolean;
  onShare: (e: React.MouseEvent, url: string) => void;
  onClick: () => void;
  innerRef: (el: HTMLDivElement | null) => void;
}

const CarouselCard: React.FC<ICarouselCardProps> = ({ link, isActive, onShare, onClick, innerRef }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const faviconWrapRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);
  const visitBtnRef = useRef<HTMLAnchorElement>(null);
  const shareBtnRef = useRef<HTMLButtonElement>(null);
  const heartBtnRef = useRef<HTMLButtonElement>(null);
  const rippleRef = useRef<HTMLDivElement>(null);
  const mottoRef = useRef<HTMLSpanElement>(null);
  const scrambleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const particleContainerRef = useRef<HTMLDivElement>(null);
  const [liked, setLiked] = useState(false);
  const mottoIdx = useRef(Math.floor(Math.random() * MOTTOS.length));

  const hostname = (() => {
    try { return new URL(link.url).hostname.replace('www.', ''); }
    catch { return link.url; }
  })();

  // ── 乱码 / 打字机 motto ──
  const SCRAMBLE_CHARS = '的一是在不了有和人这中大为上个国我以要他时来用们生到作地于出就分对成会可主发年动同工也能下过子说产种面而方后多定行学法所民得经十三之进着等部度家电力里如水化高自二理起小物现实加量都两体制机当使点从业本去把性好应开它合还因由其些然前外天政四日那社义事平形相全表间样与关各重新线内数正心力理见开代期先系号面被专应该这么做完全可以的好的生活加油努力坚持';  
  useEffect(() => {
    const el = mottoRef.current;
    if (!el) return;
    // 清理旧 timer
    if (scrambleTimerRef.current) { clearInterval(scrambleTimerRef.current); scrambleTimerRef.current = null; }

    if (!isActive) {
      // 乱码持续滚动
      const len = 10;
      scrambleTimerRef.current = setInterval(() => {
        el.innerHTML = Array.from({ length: len }, () =>
          SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
        ).join('');
      }, 80);
      return () => { if (scrambleTimerRef.current) clearInterval(scrambleTimerRef.current); };
    }

    // 激活：停乱码，打字机揭示真实文本
    const text = MOTTOS[mottoIdx.current];
    mottoIdx.current = (mottoIdx.current + 1) % MOTTOS.length;
    el.innerHTML = '';
    let i = 0;
    // 开头短暂乱码过渡，然后匀速逐字揭示（无中间乱码帧，避免抖动）
    const startReveal = () => {
      const revealInterval = setInterval(() => {
        i++;
        el.innerHTML = text.slice(0, i).replace(/\n/g, '<br>');
        if (i >= text.length) clearInterval(revealInterval);
      }, 30);
      scrambleTimerRef.current = revealInterval;
    };
    // 开头 2 帧乱码过渡
    let warmup = 2;
    const warmupInterval = setInterval(() => {
      const scramble = Array.from({ length: 4 }, () =>
        SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
      ).join('');
      el.innerHTML = `<span style="color:rgba(176,96,112,0.4)">${scramble}</span>`;
      warmup--;
      if (warmup <= 0) { clearInterval(warmupInterval); startReveal(); }
    }, 30);
    scrambleTimerRef.current = warmupInterval;
    return () => { clearInterval(warmupInterval); if (scrambleTimerRef.current) clearInterval(scrambleTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  // ── 3D 倾斜 ──
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isActive) return;
    const el = cardRef.current;
    if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const rx = ((e.clientY - top) / height - 0.5) * -10;
    const ry = ((e.clientX - left) / width - 0.5) * 10;
    gsap.to(el, { rotateX: rx, rotateY: ry, duration: 0.3, ease: 'power2.out', transformPerspective: 900, overwrite: 'auto' });
  };
  const handleMouseLeaveCard = () => {
    gsap.to(cardRef.current, { rotateX: 0, rotateY: 0, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
    gsap.to(shineRef.current, { opacity: 0, duration: 0.3 });
  };
  const handleMouseEnterCard = () => {
    // 光扫动画
    const shine = shineRef.current;
    if (!shine) return;
    gsap.fromTo(shine,
      { x: '-120%', opacity: 0.55 },
      { x: '120%', opacity: 0, duration: 0.7, ease: 'power2.inOut' }
    );
  };

  // ── Favicon hover ──
  const handleFaviconEnter = () => {
    gsap.to(faviconWrapRef.current, { y: -7, scale: 1.1, duration: 0.3, ease: 'power2.out' });
    gsap.to(glowRef.current, { opacity: 1, scale: 1.5, duration: 0.4, ease: 'power2.out' });
  };
  const handleFaviconLeave = () => {
    gsap.to(faviconWrapRef.current, { y: 0, scale: 1, duration: 0.35, ease: 'power2.out' });
    gsap.to(glowRef.current, { opacity: 0, scale: 1, duration: 0.3 });
  };

  // ── 按钮弹弹 ──
  const btnEnter = (el: HTMLElement | null) => gsap.to(el, { scale: 1.08, y: -2, duration: 0.25, ease: 'power2.out' });
  const btnLeave = (el: HTMLElement | null) => gsap.to(el, { scale: 1, y: 0, duration: 0.25, ease: 'power2.out' });
  const btnClick = (el: HTMLElement | null) => {
    gsap.timeline()
      .to(el, { scale: 0.92, duration: 0.08, ease: 'power2.in' })
      .to(el, { scale: 1.05, duration: 0.15, ease: 'power2.out' })
      .to(el, { scale: 1, duration: 0.12, ease: 'power2.out' });
  };

  // ── 收藏爱心 + 粒子爆炸 ──
  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !liked;
    setLiked(next);
    btnClick(heartBtnRef.current);
    if (!next) return;
    const container = particleContainerRef.current;
    if (!container) return;
    const colors = ['#FF6B9E', '#a1c4fd', '#FFB7C5', '#ffd6e7', '#c2e0ff'];
    for (let p = 0; p < 10; p++) {
      const dot = document.createElement('div');
      dot.style.cssText = `position:absolute;width:7px;height:7px;border-radius:50%;background:${colors[p % colors.length]};top:50%;left:50%;pointer-events:none;`;
      container.appendChild(dot);
      const angle = (p / 10) * Math.PI * 2;
      const dist = 28 + Math.random() * 22;
      gsap.fromTo(dot,
        { x: 0, y: 0, scale: 1, opacity: 1 },
        {
          x: Math.cos(angle) * dist, y: Math.sin(angle) * dist,
          scale: 0, opacity: 0, duration: 0.55 + Math.random() * 0.2,
          ease: 'power2.out',
          onComplete: () => dot.remove(),
        }
      );
    }
  };

  // ── 涟漪 ──
  const handleRipple = (e: React.MouseEvent<HTMLDivElement>) => {
    const rip = rippleRef.current;
    if (!rip) return;
    const { left, top } = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    gsap.set(rip, { x: e.clientX - left, y: e.clientY - top, scale: 0, opacity: 0.4, display: 'block' });
    gsap.to(rip, { scale: 7, opacity: 0, duration: 0.6, ease: 'power2.out', onComplete: () => { gsap.set(rip, { display: 'none' }); } });
  };

  return (
    <div
      ref={(el) => { (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = el; innerRef(el); }}
      onClick={(e) => { handleRipple(e); onClick(); }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeaveCard}
      onMouseEnter={handleMouseEnterCard}
      style={{
        position: 'absolute',
        width: CARD_W, height: CARD_H,
        left: '50%', top: '50%',
        marginLeft: -CARD_W / 2, marginTop: -CARD_H / 2,
        borderRadius: 20,
        background: 'linear-gradient(145deg, var(--neutral-50), var(--pink-50))',
        backdropFilter: 'blur(16px)',
        border: isActive ? '2px solid var(--pink-500)' : '1.5px solid var(--pink-200)',
        boxShadow: isActive
          ? '0 12px 40px var(--pink-400), 0 2px 8px var(--blue-400)'
          : '0 4px 16px rgba(0,0,0,0.06)',
        animation: isActive ? 'strokePulse 2s ease-in-out infinite' : 'none',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '32px 24px 24px',
        cursor: 'pointer', userSelect: 'none',
        willChange: 'transform, opacity',
        overflow: 'hidden', transformStyle: 'preserve-3d',
      }}
    >
      {/* 光扫 shine */}
      <div ref={shineRef} style={{
        position: 'absolute', top: 0, left: 0, width: '55%', height: '100%',
        background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.38) 50%, transparent 70%)',
        pointerEvents: 'none', opacity: 0, zIndex: 20,
      }} />

      {/* 涟漪层 */}
      <div ref={rippleRef} style={{
        position: 'absolute', width: 60, height: 60, borderRadius: '50%',
        background: 'radial-gradient(circle, var(--blue-400), transparent 70%)',
        pointerEvents: 'none', display: 'none', marginLeft: -30, marginTop: -30, zIndex: 99,
      }} />

      {/* 粒子容器 */}
      <div ref={particleContainerRef} style={{ position: 'absolute', top: 18, right: 18, width: 0, height: 0, zIndex: 50, pointerEvents: 'none' }} />

      {/* 收藏按钮（右上角）*/}
      <button
        ref={heartBtnRef}
        onClick={handleLike}
        onMouseEnter={() => btnEnter(heartBtnRef.current)}
        onMouseLeave={() => btnLeave(heartBtnRef.current)}
        aria-label={liked ? '取消收藏' : '收藏'}
        aria-pressed={liked}
        style={{
          position: 'absolute', top: 14, right: 14,
          width: 32, height: 32, borderRadius: '50%', border: 'none',
          background: liked ? 'linear-gradient(135deg, var(--pink-500), var(--pink-400))' : 'var(--pink-100)',
          cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: liked ? '0 3px 10px var(--pink-400)' : 'none',
          transition: 'background 0.3s, box-shadow 0.3s',
        }}
      >
        {liked ? '♥' : '♡'}
      </button>

      {/* Favicon（可点击跳转）*/}
      <a
        href={link.url} target="_blank" rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        aria-label={`${link.title}的网站图标`}
        style={{ textDecoration: 'none', marginBottom: 12, flexShrink: 0, position: 'relative', display: 'block' }}
        onMouseEnter={handleFaviconEnter} onMouseLeave={handleFaviconLeave}
      >
        <div ref={glowRef} style={{
          position: 'absolute', inset: -12, borderRadius: '50%',
          background: 'radial-gradient(circle, var(--pink-400) 0%, transparent 70%)',
          opacity: 0, pointerEvents: 'none',
        }} />
        <div ref={faviconWrapRef} style={{
          width: 88, height: 88, borderRadius: 22,
          background: 'linear-gradient(135deg, var(--pink-50), var(--blue-50))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 20px var(--pink-400), inset 0 1px 0 rgba(255,255,255,0.95)',
        }}>
          <img src={getFavicon(link.url)} alt={link.title}
            style={{ width: 52, height: 52, objectFit: 'contain', borderRadius: 10 }}
            onError={handleImgError} />
        </div>
      </a>

      {/* 主标题 */}
      <h3
        style={{
          fontSize: 16, fontWeight: 800, color: 'var(--neutral-800)', lineHeight: 1.45,
          margin: '0 0 6px', textAlign: 'center', width: '100%',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}
        title={link.title}
      >
        {link.title}
      </h3>

      {/* hostname 胶囊 */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: 'var(--pink-100)', border: '1px solid var(--pink-200)',
        borderRadius: 999, padding: '4px 12px', marginBottom: 8,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--pink-400)', display: 'inline-block', flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: 'var(--neutral-700)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
          {hostname}
        </span>
      </div>

      {/* 分隔线 */}
      <div style={{
        width: '80%', height: 1.5, borderRadius: 999, marginBottom: 8, flexShrink: 0,
        background: 'linear-gradient(90deg, transparent, var(--pink-300) 30%, var(--blue-300) 70%, transparent)',
      }} />

      {/* 打字机鼓励语 */}
      <div style={{
        height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 8, padding: '0 4px', flexShrink: 0,
      }}>
        <span ref={mottoRef} style={{
          display: 'block',
          fontSize: isActive ? 12 : 13,
          color: isActive ? 'var(--pink-600)' : 'var(--neutral-700)',
          fontStyle: isActive ? 'italic' : 'normal',
          fontFamily: isActive ? 'Crimson Pro, Georgia, serif' : 'ui-monospace, monospace',
          textAlign: 'center', lineHeight: 1.7,
          background: isActive ? 'var(--pink-100)' : 'transparent',
          borderRadius: 8, padding: isActive ? '6px 12px' : '0',
          letterSpacing: isActive ? 0.3 : 1.5,
        }} />
      </div>

      {/* 按钮区 */}
      <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
        <a
          ref={visitBtnRef}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => { e.stopPropagation(); btnClick(visitBtnRef.current); }}
          onMouseEnter={() => btnEnter(visitBtnRef.current)}
          onMouseLeave={() => btnLeave(visitBtnRef.current)}
          aria-label={`访问${link.title}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '8px 20px', borderRadius: 999,
            background: 'linear-gradient(135deg, var(--pink-500), var(--pink-400))',
            color: '#fff', fontSize: 13, fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 4px 14px var(--pink-400)',
          }}
        >
          ↗ 访问
        </a>
        <button
          ref={shareBtnRef}
          onClick={(e) => { onShare(e, link.url); btnClick(shareBtnRef.current); }}
          onMouseEnter={() => btnEnter(shareBtnRef.current)}
          onMouseLeave={() => btnLeave(shareBtnRef.current)}
          aria-label={`分享${link.title}`}
          style={{
            padding: '8px 16px', borderRadius: 999,
            background: 'var(--blue-100)',
            border: '1.5px solid var(--blue-400)',
            color: 'var(--blue-500)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}
        >
          ⬡ 分享
        </button>
      </div>
    </div>
  );
};

// ── BookmarkGrid ──────────────────────────────────────────────────────────────
const BookmarkGrid: React.FC<IBookmarkGridProps> = ({ category, allCategories, onShare }) => {
  const [displayedCategory, setDisplayedCategory] = useState<ICategory>(category);
  const [activeIndex, setActiveIndex] = useState(0);

  const headerRef = useRef<HTMLElement>(null);
  const isMountRef = useRef<boolean>(true);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardsWrapRef = useRef<HTMLDivElement>(null);

  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoPlayRef = useRef<gsap.core.Tween | null>(null);
  const isAutoPlayingRef = useRef(false);
  const AUTO_DELAY = 30_000;

  const dragStartXRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  const links = displayedCategory.links;
  const total = links.length;

  const animateCards = useCallback((centerIdx: number, duration = 0.55) => {
    const half = Math.floor(VISIBLE / 2);
    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      const slot = ((i - centerIdx) % total + total) % total;
      const relativeSlot = slot <= half ? slot : slot >= total - half ? slot - total : null;
      const style = relativeSlot !== null ? (SLOT_STYLES[relativeSlot] ?? HIDDEN_STYLE) : HIDDEN_STYLE;
      const x = relativeSlot !== null
        ? relativeSlot * PITCH
        : (slot < total / 2 ? (half + 1) * PITCH : -(half + 1) * PITCH);
      gsap.to(el, { x, y: style.y, scale: style.scale, opacity: style.opacity, zIndex: style.zIndex, duration, ease: 'power3.out', overwrite: 'auto' });
    });
  }, [total]);

  const initCards = useCallback((centerIdx: number) => {
    const half = Math.floor(VISIBLE / 2);
    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      const slot = ((i - centerIdx) % total + total) % total;
      const relativeSlot = slot <= half ? slot : slot >= total - half ? slot - total : null;
      const style = relativeSlot !== null ? (SLOT_STYLES[relativeSlot] ?? HIDDEN_STYLE) : HIDDEN_STYLE;
      const x = relativeSlot !== null
        ? relativeSlot * PITCH
        : (slot < total / 2 ? (half + 1) * PITCH : -(half + 1) * PITCH);
      gsap.set(el, { x, y: style.y, scale: style.scale, opacity: style.opacity, zIndex: style.zIndex });
    });
  }, [total]);

  const goTo = useCallback((idx: number, duration?: number) => {
    const next = ((idx % total) + total) % total;
    setActiveIndex(next);
    animateCards(next, duration);
  }, [total, animateCards]);

  const resetIdleTimer = useCallback(() => {
    if (autoPlayRef.current) { autoPlayRef.current.kill(); autoPlayRef.current = null; }
    isAutoPlayingRef.current = false;
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    autoTimerRef.current = setTimeout(() => {
      isAutoPlayingRef.current = true;
      const tick = () => {
        if (!isAutoPlayingRef.current) return;
        setActiveIndex((prev) => {
          const next = (prev + 1) % total;
          animateCards(next, 1.2);
          return next;
        });
        autoPlayRef.current = gsap.delayedCall(2.5, tick);
      };
      autoPlayRef.current = gsap.delayedCall(0, tick);
    }, AUTO_DELAY);
  }, [total, animateCards]);

  useEffect(() => {
    setActiveIndex(0);
    cardRefs.current = cardRefs.current.slice(0, displayedCategory.links.length);
    const raf = requestAnimationFrame(() => {
      // 先把所有卡片设到正确位置但透明
      initCards(0);
      cardRefs.current.forEach((el) => { if (el) gsap.set(el, { opacity: 0 }); });
      // 用 animateCards 做入场动画，它会计算正确的 relativeSlot → opacity
      animateCards(0, 0.6);
      resetIdleTimer();
    });
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedCategory.id]);

  useEffect(() => {
    return () => {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
      if (autoPlayRef.current) autoPlayRef.current.kill();
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragStartXRef.current = e.clientX;
    isDraggingRef.current = false;
    resetIdleTimer();
  }, [resetIdleTimer]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (dragStartXRef.current === null) return;
    if (Math.abs(e.clientX - dragStartXRef.current) > 8) isDraggingRef.current = true;
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (dragStartXRef.current === null) return;
    const dx = e.clientX - dragStartXRef.current;
    dragStartXRef.current = null;
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    resetIdleTimer();
    if (Math.abs(dx) > 20) {
      setActiveIndex((prev) => {
        const next = ((prev + (dx < 0 ? 1 : -1)) % total + total) % total;
        animateCards(next);
        return next;
      });
    }
  }, [total, animateCards, resetIdleTimer]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      resetIdleTimer();
      setActiveIndex((prev) => {
        const next = ((prev - 1) % total + total) % total;
        animateCards(next);
        return next;
      });
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      resetIdleTimer();
      setActiveIndex((prev) => {
        const next = (prev + 1) % total;
        animateCards(next);
        return next;
      });
    }
  }, [total, animateCards, resetIdleTimer]);

  useLayoutEffect(() => {
    if (isMountRef.current) {
      isMountRef.current = false;
      gsap.fromTo(headerRef.current, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.45, delay: 0.1, ease: 'power2.out' });
      return;
    }
    const nextCategory = category;
    const oldIndex = allCategories.findIndex((c) => c.id === displayedCategory.id);
    const newIndex = allCategories.findIndex((c) => c.id === nextCategory.id);
    const exitDir = newIndex > oldIndex ? -1 : 1;
    if (tlRef.current) { tlRef.current.kill(); tlRef.current = null; }
    const tl = gsap.timeline();
    tlRef.current = tl;
    // header + 卡片整体同时出场
    tl.to(headerRef.current, { x: exitDir * 80, opacity: 0, duration: 0.22, ease: 'power2.in' });
    tl.to(cardsWrapRef.current, { x: exitDir * 120, opacity: 0, duration: 0.25, ease: 'power2.in' }, '<');
    tl.call(() => {
      setDisplayedCategory(nextCategory);
      // 立刻把入场起始位置设好（React 会在下一 tick 渲染新卡片）
      requestAnimationFrame(() => {
        const enterDir = -exitDir;
        gsap.set(headerRef.current, { x: enterDir * 80, opacity: 0 });
        gsap.set(cardsWrapRef.current, { x: enterDir * 120, opacity: 0 });
        gsap.to(headerRef.current, { x: 0, opacity: 1, duration: 0.35, ease: 'power3.out' });
        gsap.to(cardsWrapRef.current, { x: 0, opacity: 1, duration: 0.38, ease: 'power3.out', delay: 0.04 });
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category.id]);

  // 删除原来的第二个 useLayoutEffect（入场逻辑已合并上方）

  return (
    <section
      className="flex flex-col"
      style={{ height: '100%' }}
      role="region"
      aria-label={`${displayedCategory.name}书签轮播`}
      aria-live="polite"
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onKeyDown={handleKeyDown}
    >
      {/* strokePulse keyframes */}
      <style>{`
        @keyframes strokePulse {
          0%   { box-shadow: 0 0 0 0px rgba(161,196,253,0.7),  0 12px 40px rgba(161,196,253,0.25); }
          50%  { box-shadow: 0 0 0 7px rgba(161,196,253,0),    0 12px 40px rgba(161,196,253,0.25); }
          100% { box-shadow: 0 0 0 0px rgba(161,196,253,0),    0 12px 40px rgba(161,196,253,0.25); }
        }
      `}</style>

      {/* 标题行 */}
      <header ref={headerRef} className="mb-6 flex items-center gap-3 flex-shrink-0 px-8 pt-6">
        <Hash size={24} style={{ color: 'var(--pink-400)' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--neutral-800)' }}>{displayedCategory.name}</h2>
        <div style={{
          marginLeft: 'auto',
          fontSize: '0.875rem',
          color: 'var(--neutral-600)',
          background: 'rgba(255,255,255,0.5)',
          padding: '0.375rem 1rem',
          borderRadius: '9999px',
          border: '1px solid rgba(255,255,255,0.8)'
        }}>
          共 {displayedCategory.links.length} 个内容
        </div>
      </header>

      {/* 轮播舞台 */}
      <div
        ref={stageRef}
        className="flex-1 relative"
        style={{ overflow: 'visible', touchAction: 'pan-y' }}
      >
        {/* 左右渐变遮罩 */}
        <div
          className="absolute inset-y-0 pointer-events-none z-20"
          style={{ left: '-100vw', right: '50%', background: 'linear-gradient(to right, rgba(255,240,245,0.92) 55%, transparent)' }}
        />
        <div
          className="absolute inset-y-0 pointer-events-none z-20"
          style={{ left: '50%', right: '-100vw', background: 'linear-gradient(to left, rgba(255,240,245,0.92) 55%, transparent)' }}
        />

        {/* 卡片层 */}
        <div ref={cardsWrapRef} className="absolute inset-0 flex items-center justify-center">
          {links.map((link, i) => (
            <CarouselCard
              key={`${displayedCategory.id}-${i}`}
              link={link}
              isActive={i === activeIndex}
              onShare={onShare}
              onClick={() => { resetIdleTimer(); goTo(i); }}
              innerRef={(el) => { cardRefs.current[i] = el; }}
            />
          ))}
        </div>
      </div>

      {/* 底部指示器 */}
      <div className="flex items-center justify-center gap-2 pt-4 pb-2 flex-shrink-0">
        {links.map((_, i) => (
          <button
            key={i}
            onClick={() => { resetIdleTimer(); goTo(i); }}
            style={{
              width: i === activeIndex ? 20 : 6,
              height: 6,
              borderRadius: 999,
              background: i === activeIndex ? '#FF6B9E' : 'rgba(255,107,158,0.25)',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              transition: 'width 0.3s, background 0.3s',
            }}
          />
        ))}
      </div>
    </section>
  );
};

export default React.memo(BookmarkGrid);
