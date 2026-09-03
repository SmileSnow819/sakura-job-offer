import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, Grid3X3, Hash, List, RotateCcw, Search, Send, Share2, Sparkles, X } from 'lucide-react';
import gsap from 'gsap';

import { ICategory, ILink } from '../../types/bookmark';
import mottosRaw from '../../mottos.json';
import TrackApplicationButton from '../TrackApplicationButton';

const MOTTOS: string[] = mottosRaw as string[];
import { getFavicon, handleFaviconLoad, handleImgError } from '../../utils/getFavicon';

interface IBookmarkGridProps {
  category: ICategory;
  allCategories: ICategory[];
  onShare: (e: React.MouseEvent, url: string) => void;
}

type ViewMode = 'cards' | 'table';
interface ILinkGroup {
  id: string;
  name: string;
  links: ILink[];
}

// ── 轮播参数 ──────────────────────────────────────────────────────────────────
const VISIBLE = 5;

const getResponsiveCardSize = () => {
  if (typeof window === 'undefined') return { width: 280, height: 390 };
  return window.innerWidth <= 768
    ? { width: Math.min(window.innerWidth - 56, 248), height: 322 }
    : { width: 280, height: 390 };
};

const { width: CARD_W, height: CARD_H } = getResponsiveCardSize();
const X_GAP = typeof window !== 'undefined' && window.innerWidth <= 768 ? 24 : 40;
const PITCH = CARD_W + X_GAP;

const SLOT_STYLES: Record<number, { scale: number; opacity: number; zIndex: number; y: number }> = {
  [-2]: { scale: 0.72, opacity: 0.28, zIndex: 1,  y: 18 },
  [-1]: { scale: 0.85, opacity: 0.58, zIndex: 2,  y: 9  },
   [0]: { scale: 1.00, opacity: 1.00, zIndex: 10, y: 0  },
   [1]: { scale: 0.85, opacity: 0.58, zIndex: 2,  y: 9  },
   [2]: { scale: 0.72, opacity: 0.28, zIndex: 1,  y: 18 },
};
const HIDDEN_STYLE = { scale: 0.6, opacity: 0, zIndex: 0, y: 30 };

const getHostname = (url: string) => {
  try { return new URL(url).hostname.replace('www.', ''); }
  catch { return url; }
};

const normalizeText = (value: string) => value.trim().toLowerCase();

const getCampusGroupName = (link: ILink) => {
  const haystack = normalizeText(`${link.title} ${getHostname(link.url)} ${link.url}`);

  if (/(mihoyo|米哈游|papergames|叠纸|腾讯音乐|网易互娱|game|lilith|莉莉丝|心动|4399|kuro|库洛|hypergryph|鹰角|iqiyi|爱奇艺|阅文)/i.test(haystack)) {
    return '游戏文娱';
  }
  if (/(moonshot|kimi|minimax|deepseek|momenta|iflytek|讯飞|夸克|百度|360|高德)/i.test(haystack)) {
    return 'AI智能';
  }
  if (/(huawei|华为|oppo|vivo|xiaomi|小米|honor|荣耀|dji|大疆|lenovo|联想)/i.test(haystack)) {
    return '硬件制造';
  }
  if (/(meituan|美团|didi|滴滴|sf-express|顺丰|ctrip|携程|nio|蔚来|dewu|得物)/i.test(haystack)) {
    return '生活出行';
  }
  if (/(alibaba|阿里|antgroup|蚂蚁|taotian|淘天|jd|京东|pdd|拼多多|shein|有赞)/i.test(haystack)) {
    return '电商平台';
  }
  return '互联网综合';
};

const getToolGroupName = (link: ILink) => {
  const haystack = normalizeText(`${link.title} ${link.url}`);
  if (/(简历|codecv|watermark|水印)/i.test(haystack)) return '简历工具';
  if (/(面经|nowcoder|博客|juejin)/i.test(haystack)) return '面经资料';
  return '其他工具';
};

const buildLinkGroups = (categoryId: string, links: ILink[]): ILinkGroup[] => {
  if (links.length === 0) return [{ id: 'all', name: '全部', links: [] }];

  const getGroupName = categoryId === 'tools' ? getToolGroupName : getCampusGroupName;
  const groups = new Map<string, ILink[]>();
  links.forEach((link) => {
    const name = getGroupName(link);
    groups.set(name, [...(groups.get(name) ?? []), link]);
  });

  const orderedNames = categoryId === 'tools'
    ? ['简历工具', '面经资料', '其他工具']
    : ['互联网综合', '电商平台', 'AI智能', '游戏文娱', '硬件制造', '生活出行'];

  return [
    { id: 'all', name: '全部', links },
    ...orderedNames
      .filter((name) => groups.has(name))
      .map((name) => ({ id: name, name, links: groups.get(name) ?? [] })),
  ];
};

interface IReferralApplyLinkProps {
  link: ILink;
  compact?: boolean;
  tooltipPlacement?: 'top' | 'left';
}

const ReferralApplyLink: React.FC<IReferralApplyLinkProps> = ({ link, compact = false, tooltipPlacement = 'top' }) => {
  if (!link.referralUrl) return null;

  const qrCodeUrl = link.referralQrCode
    ? `${import.meta.env.BASE_URL}${link.referralQrCode.replace(/^\//, '')}`
    : null;

  return (
    <span className="referral-apply-wrap" style={{ position: 'relative', display: 'inline-flex', flex: compact ? undefined : 1, minWidth: 0 }}>
      <a
        href={link.referralUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="referral-apply-link"
        aria-label={`通过内推码投递${link.title}`}
        title="内推码投递"
        onClick={(event) => event.stopPropagation()}
        style={{
          width: compact ? undefined : '100%',
          minWidth: compact ? 34 : undefined,
          height: compact ? 34 : undefined,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          padding: compact ? 0 : (CARD_H < 350 ? '8px 7px' : '8px 10px'),
          borderRadius: compact ? 10 : 999,
          color: 'white',
          background: compact ? 'linear-gradient(135deg, var(--blue-500), var(--blue-400))' : 'linear-gradient(135deg, var(--pink-500), var(--pink-400))',
          boxShadow: compact ? '0 4px 14px rgba(104,163,255,0.34)' : '0 4px 14px var(--pink-400)',
          textDecoration: 'none',
          fontSize: compact ? 11 : 13,
          fontWeight: compact ? 800 : 700,
          whiteSpace: 'nowrap',
        }}
      >
        {compact ? <Send size={16} /> : '↗ 内推投递'}
      </a>
      {qrCodeUrl && (
        <span
          className={`referral-qr-tooltip referral-qr-tooltip-${tooltipPlacement}`}
          role="tooltip"
          style={{
            position: 'absolute',
            right: tooltipPlacement === 'left' ? 'calc(100% + 12px)' : 0,
            top: tooltipPlacement === 'left' ? '50%' : undefined,
            bottom: tooltipPlacement === 'left' ? undefined : 'calc(100% + 10px)',
            zIndex: 60,
            width: 142,
            padding: 8,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.96)',
            border: '1px solid var(--blue-200)',
            boxShadow: '0 12px 30px rgba(70,127,207,0.2)',
            opacity: 0,
            transform: tooltipPlacement === 'left' ? 'translateY(-50%) scale(0.96)' : 'translateY(6px) scale(0.96)',
            pointerEvents: 'none',
            transition: 'opacity 0.18s ease, transform 0.18s ease',
          }}
        >
          <img src={qrCodeUrl} alt={`${link.title}内推码`} style={{ display: 'block', width: '100%', borderRadius: 7 }} />
        <span style={{ display: 'block', marginTop: 6, color: 'var(--neutral-700)', fontSize: 11, fontWeight: 700, textAlign: 'center' }}>
          扫码内推投递
        </span>
        <span style={{ position: 'absolute', right: 12, bottom: -5, width: 10, height: 10, background: 'rgba(255,255,255,0.96)', borderRight: '1px solid var(--blue-200)', borderBottom: '1px solid var(--blue-200)', transform: 'rotate(45deg)' }} />
        </span>
      )}
    </span>
  );
};

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
  const rippleRef = useRef<HTMLDivElement>(null);
  const mottoRef = useRef<HTMLSpanElement>(null);
  const scrambleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
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

      <TrackApplicationButton link={link} corner />

      {/* Favicon（可点击跳转）*/}
      <a
        href={link.url} target="_blank" rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        aria-label={`${link.title}的网站图标`}
        style={{ textDecoration: 'none', marginBottom: CARD_H < 350 ? 8 : 12, flexShrink: 0, position: 'relative', display: 'block' }}
        onMouseEnter={handleFaviconEnter} onMouseLeave={handleFaviconLeave}
      >
        <div ref={glowRef} style={{
          position: 'absolute', inset: -12, borderRadius: '50%',
          background: 'radial-gradient(circle, var(--pink-400) 0%, transparent 70%)',
          opacity: 0, pointerEvents: 'none',
        }} />
        <div ref={faviconWrapRef} style={{
          width: CARD_H < 350 ? 68 : 88,
          height: CARD_H < 350 ? 68 : 88,
          borderRadius: CARD_H < 350 ? 18 : 22,
          background: 'linear-gradient(135deg, var(--pink-50), var(--blue-50))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 20px var(--pink-400), inset 0 1px 0 rgba(255,255,255,0.95)',
        }}>
          <img src={getFavicon(link.url)} alt={link.title}
            style={{
              width: CARD_H < 350 ? 42 : 52,
              height: CARD_H < 350 ? 42 : 52,
              objectFit: 'contain',
              borderRadius: 10,
            }}
            onError={handleImgError}
            onLoad={handleFaviconLoad} />
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
        height: CARD_H < 350 ? 54 : 72,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: CARD_H < 350 ? 6 : 8,
        padding: '0 4px', flexShrink: 0,
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
      <div style={{ display: 'flex', gap: 8, marginTop: 'auto', width: '100%' }}>
        {link.referralUrl ? <ReferralApplyLink link={link} /> : (
          <a
            ref={visitBtnRef}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => { e.stopPropagation(); btnClick(visitBtnRef.current); }}
            onMouseEnter={() => btnEnter(visitBtnRef.current)}
            onMouseLeave={() => btnLeave(visitBtnRef.current)}
            aria-label={`立即投递${link.title}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: CARD_H < 350 ? '8px 7px' : '8px 10px',
              borderRadius: 999,
              background: 'linear-gradient(135deg, var(--pink-500), var(--pink-400))',
              color: 'oklch(0.99 0.008 350)', fontSize: 13, fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 4px 14px var(--pink-400)',
              flex: 1,
              justifyContent: 'center',
              minWidth: 0,
              whiteSpace: 'nowrap',
            }}
          >
            ↗ 立即投递
          </a>
        )}
        <button
          ref={shareBtnRef}
          onClick={(e) => { onShare(e, link.url); btnClick(shareBtnRef.current); }}
          onMouseEnter={() => btnEnter(shareBtnRef.current)}
          onMouseLeave={() => btnLeave(shareBtnRef.current)}
          aria-label={`分享${link.title}`}
          style={{
            padding: CARD_H < 350 ? '8px 12px' : '8px 16px',
            borderRadius: 999,
            background: 'var(--blue-100)',
            border: '1.5px solid var(--blue-400)',
            color: 'var(--blue-500)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          ⬡ 分享
        </button>
      </div>
    </div>
  );
};

interface IBookmarkTableProps {
  links: ILink[];
  onShare: (e: React.MouseEvent, url: string) => void;
  innerRef: (el: HTMLDivElement | null) => void;
}

const BookmarkTable: React.FC<IBookmarkTableProps> = ({ links, onShare, innerRef }) => (
  <div
    ref={innerRef}
    className="bookmark-table-panel mx-6 mb-4 flex-1 overflow-hidden"
    style={{
      borderRadius: 18,
      border: '1px solid rgba(255,255,255,0.8)',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.54), rgba(255,246,250,0.34))',
      boxShadow: '0 18px 52px rgba(255,107,158,0.14), inset 0 1px 0 rgba(255,255,255,0.82)',
      backdropFilter: 'blur(22px) saturate(1.25)',
      WebkitBackdropFilter: 'blur(22px) saturate(1.25)',
    }}
  >
    <div className="h-full overflow-auto">
      <div className="bookmark-mobile-list">
        {links.map((link, index) => {
          const hostname = getHostname(link.url);
          return (
            <article
              key={`${link.title}-${link.url}-mobile`}
              className="bookmark-mobile-item"
            >
              <div className="bookmark-mobile-rank">{String(index + 1).padStart(2, '0')}</div>
              <div className="bookmark-mobile-logo">
                <img
                  src={getFavicon(link.url)}
                  alt=""
                  onError={handleImgError}
                  onLoad={handleFaviconLoad}
                />
              </div>
              <div className="bookmark-mobile-info">
                <div className="bookmark-mobile-title">{link.title}</div>
                <div className="bookmark-mobile-domain">{hostname}</div>
                <a
                  className="bookmark-mobile-url"
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.url}
                </a>
              </div>
              <div className="bookmark-mobile-actions">
                <TrackApplicationButton link={link} />
                {link.referralUrl ? <ReferralApplyLink link={link} compact /> : (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`立即投递${link.title}`}
                    title="立即投递"
                  >
                    <ExternalLink size={16} />
                  </a>
                )}
                <button
                  onClick={(e) => onShare(e, link.url)}
                  aria-label={`分享${link.title}`}
                  title="分享"
                >
                  <Share2 size={16} />
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <table className="bookmark-desktop-table" style={{ width: '100%', minWidth: 720, borderCollapse: 'separate', borderSpacing: 0 }}>
        <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
          <tr style={{ background: 'rgba(255,246,250,0.96)', color: 'var(--neutral-700)' }}>
            <th style={{ width: 64, padding: '14px 18px', textAlign: 'left', fontSize: 12, fontWeight: 800 }}>#</th>
            <th style={{ padding: '14px 18px', textAlign: 'left', fontSize: 12, fontWeight: 800 }}>名称</th>
            <th style={{ padding: '14px 18px', textAlign: 'left', fontSize: 12, fontWeight: 800 }}>域名</th>
            <th style={{ padding: '14px 18px', textAlign: 'left', fontSize: 12, fontWeight: 800 }}>链接</th>
            <th style={{ width: 178, padding: '14px 18px', textAlign: 'right', fontSize: 12, fontWeight: 800 }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {links.map((link, index) => {
            const hostname = getHostname(link.url);
            return (
              <tr
                key={`${link.title}-${link.url}`}
                className="bookmark-table-row"
                style={{
                  background: index % 2 === 0 ? 'rgba(255,255,255,0.52)' : 'rgba(255,255,255,0.34)',
                }}
              >
                <td data-label="#" style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,183,197,0.28)', color: 'var(--neutral-500)', fontWeight: 700 }}>
                  {String(index + 1).padStart(2, '0')}
                </td>
                <td data-label="名称" style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,183,197,0.28)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <span
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, var(--pink-50), var(--blue-50))',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)',
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={getFavicon(link.url)}
                        alt=""
                        style={{ width: 20, height: 20, objectFit: 'contain', borderRadius: 4 }}
                        onError={handleImgError}
                        onLoad={handleFaviconLoad}
                      />
                    </span>
                    <span style={{ color: 'var(--neutral-800)', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {link.title}
                    </span>
                  </div>
                </td>
                <td data-label="域名" style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,183,197,0.28)', color: 'var(--neutral-700)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
                  {hostname}
                </td>
                <td data-label="链接" style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,183,197,0.28)' }}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: 'var(--blue-500)',
                      fontSize: 13,
                      fontFamily: 'var(--font-mono)',
                      textDecoration: 'none',
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: 420,
                    }}
                    title={link.url}
                  >
                    {link.url}
                  </a>
                </td>
                <td data-label="操作" style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,183,197,0.28)', textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <TrackApplicationButton link={link} />
                    {link.referralUrl ? <ReferralApplyLink link={link} compact tooltipPlacement="left" /> : (
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`立即投递${link.title}`}
                        title="立即投递"
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--pink-600)',
                          background: 'var(--pink-100)',
                          border: '1px solid var(--pink-200)',
                        }}
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
                    <button
                      onClick={(e) => onShare(e, link.url)}
                      aria-label={`分享${link.title}`}
                      title="分享"
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--blue-500)',
                        background: 'var(--blue-100)',
                        border: '1px solid var(--blue-400)',
                        cursor: 'pointer',
                      }}
                    >
                      <Share2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

const AutumnLaunchNotice: React.FC = () => {
  const noticeRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const beamRef = useRef<HTMLSpanElement>(null);
  const copyRef = useRef<HTMLSpanElement>(null);
  const sparklesRef = useRef<HTMLSpanElement>(null);

  const replay = useCallback(() => {
    const notice = noticeRef.current;
    if (!notice) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(notice, { opacity: 1, y: 0, rotateX: 0, rotateY: 0, clipPath: 'none' });
      gsap.set([iconRef.current, copyRef.current, sparklesRef.current], { opacity: 1, x: 0, scale: 1, rotate: 0 });
      return;
    }

    const timeline = gsap.timeline({ defaults: { overwrite: 'auto' } });
    timeline
      .set(notice, { opacity: 1, y: 0, rotateX: 0, rotateY: 0 })
      .fromTo(notice, { clipPath: 'inset(0 100% 0 0)', y: -12 }, { clipPath: 'inset(0 0% 0 0)', y: 0, duration: 0.5, ease: 'power3.out' })
      .fromTo(iconRef.current, { scale: 0.4, rotate: -28, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, duration: 0.42, ease: 'back.out(2.2)' }, '<0.08')
      .fromTo(copyRef.current, { x: -18, opacity: 0 }, { x: 0, opacity: 1, duration: 0.38, ease: 'power3.out' }, '<0.04')
      .fromTo(sparklesRef.current, { scale: 0.45, opacity: 0, rotate: -20 }, { scale: 1, opacity: 1, rotate: 0, duration: 0.38, ease: 'back.out(2.4)' }, '<0.08')
      .fromTo(beamRef.current, { xPercent: -135, opacity: 0 }, { xPercent: 175, opacity: 0.9, duration: 0.75, ease: 'power2.inOut' }, '<0.05')
      .to(beamRef.current, { opacity: 0, duration: 0.12 });
  }, []);

  useEffect(() => {
    replay();
  }, [replay]);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const element = noticeRef.current;
    if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const bounds = element.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    gsap.to(element, { rotateY: x * 2.4, rotateX: y * -2.4, y: -2, duration: 0.25, ease: 'power2.out', overwrite: 'auto' });
  };

  return (
    <div className="autumn-launch-wrap px-8 pb-3 flex-shrink-0">
      <div
        ref={noticeRef}
        className="autumn-launch-notice"
        role="status"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => gsap.to(noticeRef.current, { rotateX: 0, rotateY: 0, y: 0, duration: 0.35, ease: 'power3.out', overwrite: 'auto' })}
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          maxWidth: '100%',
          padding: '10px 11px 10px 14px',
          overflow: 'hidden',
          transformStyle: 'preserve-3d',
          borderRadius: 16,
          color: 'var(--pink-600)',
          background: 'linear-gradient(110deg, rgba(255,240,246,0.8), rgba(235,245,255,0.7))',
          border: '1px solid rgba(255,183,197,0.72)',
          boxShadow: '0 8px 24px rgba(255,107,158,0.12), inset 0 1px 0 rgba(255,255,255,0.9)',
          backdropFilter: 'blur(16px) saturate(1.18)',
          WebkitBackdropFilter: 'blur(16px) saturate(1.18)',
        }}
      >
        <span
          ref={beamRef}
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: -16,
            bottom: -16,
            left: 0,
            width: 56,
            pointerEvents: 'none',
            background: 'linear-gradient(100deg, transparent, rgba(255,255,255,0.9), transparent)',
            transform: 'skewX(-20deg)',
          }}
        />
        <span
          ref={iconRef}
          style={{
            position: 'relative',
            width: 28,
            height: 28,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 9,
            background: 'linear-gradient(135deg, var(--pink-400), var(--blue-400))',
            color: 'white',
            flexShrink: 0,
            boxShadow: '0 5px 14px rgba(255,107,158,0.28)',
          }}
        >
          <Sparkles size={15} />
        </span>
        <span ref={copyRef} className="autumn-launch-copy" style={{ position: 'relative', fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap' }}>
          秋招专场现已上线，每天自动更新秋招公司
        </span>
        <button
          type="button"
          onClick={replay}
          aria-label="重播秋招专场上线动画"
          title="重播上线动画"
          style={{
            position: 'relative',
            width: 30,
            height: 30,
            padding: 0,
            borderRadius: 9,
            border: '1px solid rgba(255,255,255,0.88)',
            background: 'rgba(255,255,255,0.56)',
            color: 'var(--pink-600)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <span ref={sparklesRef} style={{ display: 'inline-flex' }}><RotateCcw size={14} /></span>
        </button>
      </div>
    </div>
  );
};

// ── BookmarkGrid ──────────────────────────────────────────────────────────────
const BookmarkGrid: React.FC<IBookmarkGridProps> = ({ category, allCategories, onShare }) => {
  const [displayedCategory, setDisplayedCategory] = useState<ICategory>(category);
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [activeGroupId, setActiveGroupId] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isComposing, setIsComposing] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const isMountRef = useRef<boolean>(true);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const activeIndexRef = useRef(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardsWrapRef = useRef<HTMLDivElement>(null);
  const tableWrapRef = useRef<HTMLDivElement | null>(null);

  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoPlayRef = useRef<gsap.core.Tween | null>(null);
  const isAutoPlayingRef = useRef(false);
  const AUTO_DELAY = 30_000;

  const dragStartXRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  const groups = useMemo(
    () => buildLinkGroups(displayedCategory.id, displayedCategory.links),
    [displayedCategory.id, displayedCategory.links],
  );
  const activeGroup = groups.find((group) => group.id === activeGroupId) ?? groups[0];
  const filteredLinks = useMemo(() => {
    const keyword = normalizeText(searchTerm);
    const sourceLinks = activeGroup?.links ?? displayedCategory.links;
    if (!keyword) return sourceLinks;
    return sourceLinks.filter((link) => {
      const hostname = getHostname(link.url);
      return normalizeText(`${link.title} ${hostname} ${link.url}`).includes(keyword);
    });
  }, [activeGroup, displayedCategory.links, searchTerm]);
  const links = filteredLinks;
  const total = links.length;
  const isCardsView = viewMode === 'cards';
  const isAutumnCategory = displayedCategory.id === 'autumn';
  const getCurrentContent = useCallback(() => (
    viewMode === 'cards' ? (stageRef.current ?? cardsWrapRef.current) : tableWrapRef.current
  ), [viewMode]);

  const animateCards = useCallback((centerIdx: number, duration = 0.55) => {
    if (total === 0) return;
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
    if (total === 0) return;
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
    if (total === 0) return;
    const next = ((idx % total) + total) % total;
    activeIndexRef.current = next;
    setActiveIndex(next);
    animateCards(next, duration);
  }, [total, animateCards]);

  const resetIdleTimer = useCallback(() => {
    if (autoPlayRef.current) { autoPlayRef.current.kill(); autoPlayRef.current = null; }
    isAutoPlayingRef.current = false;
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    if (total === 0) return;
    autoTimerRef.current = setTimeout(() => {
      isAutoPlayingRef.current = true;
      const tick = () => {
        if (!isAutoPlayingRef.current) return;
        setActiveIndex((prev) => {
          const next = (prev + 1) % total;
          activeIndexRef.current = next;
          animateCards(next, 1.2);
          return next;
        });
        autoPlayRef.current = gsap.delayedCall(2.5, tick);
      };
      autoPlayRef.current = gsap.delayedCall(0, tick);
    }, AUTO_DELAY);
  }, [total, animateCards]);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    setActiveGroupId('all');
    setSearchInput('');
    setSearchTerm('');
  }, [displayedCategory.id]);

  useEffect(() => {
    if (isComposing) return;
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
    }, 220);
    return () => clearTimeout(timer);
  }, [isComposing, searchInput]);

  useEffect(() => {
    setActiveIndex(0);
    activeIndexRef.current = 0;
    cardRefs.current = cardRefs.current.slice(0, links.length);
    const raf = requestAnimationFrame(() => {
      initCards(0);
      if (viewMode === 'cards') {
        cardRefs.current.forEach((el) => { if (el) gsap.set(el, { opacity: 0 }); });
        animateCards(0, 0.45);
        resetIdleTimer();
      }
      if (viewMode === 'table' && tableWrapRef.current) {
        const rows = tableWrapRef.current.querySelectorAll('tbody tr');
        gsap.fromTo(rows, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.22, stagger: 0.012, ease: 'power2.out', overwrite: 'auto' });
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [links, viewMode, animateCards, initCards, resetIdleTimer]);

  useEffect(() => {
    setActiveIndex(0);
    activeIndexRef.current = 0;
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

  useLayoutEffect(() => {
    if (viewMode === 'cards') {
      const raf = requestAnimationFrame(() => {
        if (!stageRef.current || !cardsWrapRef.current) return;
        const currentIndex = activeIndexRef.current;
        initCards(currentIndex);
        cardRefs.current.forEach((el) => { if (el) gsap.set(el, { opacity: 0 }); });
        gsap.fromTo(
          stageRef.current,
          { opacity: 0, x: 28, scale: 0.975, filter: 'blur(8px)' },
          { opacity: 1, x: 0, scale: 1, filter: 'blur(0px)', duration: 0.38, ease: 'power3.out', overwrite: 'auto' },
        );
        gsap.fromTo(
          cardsWrapRef.current,
          { y: 18, rotateX: -5 },
          { y: 0, rotateX: 0, duration: 0.48, ease: 'power3.out', overwrite: 'auto' },
        );
        animateCards(currentIndex, 0.58);
        resetIdleTimer();
      });
      return () => cancelAnimationFrame(raf);
    }

    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    if (autoPlayRef.current) { autoPlayRef.current.kill(); autoPlayRef.current = null; }
    isAutoPlayingRef.current = false;

    const raf = requestAnimationFrame(() => {
      const table = tableWrapRef.current;
      if (!table) return;
      const rows = table.querySelectorAll('tbody tr');
      gsap.fromTo(
        table,
        { opacity: 0, x: -24, scale: 0.985, filter: 'blur(8px)' },
        { opacity: 1, x: 0, scale: 1, filter: 'blur(0px)', duration: 0.36, ease: 'power3.out', overwrite: 'auto' },
      );
      gsap.fromTo(
        rows,
        { opacity: 0, x: -14 },
        { opacity: 1, x: 0, duration: 0.26, ease: 'power2.out', stagger: 0.018, overwrite: 'auto' },
      );
    });
    return () => cancelAnimationFrame(raf);
  }, [viewMode, animateCards, initCards, resetIdleTimer]);

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
        activeIndexRef.current = next;
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
        activeIndexRef.current = next;
        animateCards(next);
        return next;
      });
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      resetIdleTimer();
      setActiveIndex((prev) => {
        const next = (prev + 1) % total;
        activeIndexRef.current = next;
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
    tl.to(getCurrentContent(), { x: exitDir * 120, opacity: 0, duration: 0.25, ease: 'power2.in' }, '<');
    tl.call(() => {
      setDisplayedCategory(nextCategory);
      // 立刻把入场起始位置设好（React 会在下一 tick 渲染新卡片）
      requestAnimationFrame(() => {
        const enterDir = -exitDir;
        gsap.set(headerRef.current, { x: enterDir * 80, opacity: 0 });
        gsap.to(headerRef.current, { x: 0, opacity: 1, duration: 0.35, ease: 'power3.out' });
        gsap.set(getCurrentContent(), { x: enterDir * 120, opacity: 0 });
        gsap.to(getCurrentContent(), { x: 0, opacity: 1, duration: 0.38, ease: 'power3.out', delay: 0.04 });
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
      onPointerDown={isCardsView ? handlePointerDown : undefined}
      onPointerMove={isCardsView ? handlePointerMove : undefined}
      onPointerUp={isCardsView ? handlePointerUp : undefined}
      onKeyDown={isCardsView ? handleKeyDown : undefined}
    >
      {/* strokePulse keyframes */}
      <style>{`
        @keyframes strokePulse {
          0%   { box-shadow: 0 0 0 0px rgba(161,196,253,0.7),  0 12px 40px rgba(161,196,253,0.25); }
          50%  { box-shadow: 0 0 0 7px rgba(161,196,253,0),    0 12px 40px rgba(161,196,253,0.25); }
          100% { box-shadow: 0 0 0 0px rgba(161,196,253,0),    0 12px 40px rgba(161,196,253,0.25); }
        }
        .referral-apply-wrap:hover .referral-qr-tooltip,
        .referral-apply-wrap:focus-within .referral-qr-tooltip {
          opacity: 1 !important;
          transform: translateY(0) scale(1) !important;
        }
        .referral-apply-wrap:hover .referral-qr-tooltip-left,
        .referral-apply-wrap:focus-within .referral-qr-tooltip-left {
          transform: translateY(-50%) scale(1) !important;
        }
        .bookmark-toolbar-scroll::-webkit-scrollbar { display: none; }
        .bookmark-toolbar-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .bookmark-mobile-list { display: none; }
        @media (max-width: 768px) {
          .bookmark-section-header {
            padding: 16px 16px 0 !important;
            margin-bottom: 12px !important;
            gap: 10px !important;
          }
          .bookmark-section-title {
            font-size: 1.18rem !important;
          }
          .bookmark-count-pill {
            display: none !important;
          }
          .bookmark-filter-bar {
            padding: 0 16px 12px !important;
            gap: 10px !important;
          }
          .autumn-launch-wrap {
            padding: 0 16px 12px !important;
          }
          .autumn-launch-notice {
            min-height: 44px;
            padding: 9px 12px !important;
            border-radius: 14px !important;
            align-items: flex-start !important;
          }
          .autumn-launch-copy {
            white-space: normal !important;
            font-size: 12px !important;
            line-height: 1.45 !important;
          }
          .bookmark-search-box {
            width: 100% !important;
            min-width: 0 !important;
            order: 1;
          }
          .bookmark-group-tabs {
            width: 100% !important;
            order: 2;
          }
          .bookmark-table-panel {
            margin: 0 12px 12px !important;
            border-radius: 16px !important;
            background: rgba(255,255,255,0.2) !important;
            border: 1px solid rgba(255,255,255,0.45) !important;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.45) !important;
            backdrop-filter: blur(18px) saturate(1.18) !important;
            -webkit-backdrop-filter: blur(18px) saturate(1.18) !important;
          }
          .bookmark-card-stage {
            margin-top: 10px;
            margin-bottom: 12px;
          }
          .bookmark-card-indicators {
            padding-top: 12px !important;
            padding-bottom: 12px !important;
          }
          .bookmark-desktop-table { display: none; }
          .bookmark-mobile-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: 0 2px 14px;
          }
          .bookmark-mobile-item {
            position: relative;
            display: grid;
            grid-template-columns: 46px minmax(0, 1fr) auto;
            gap: 11px;
            align-items: center;
            padding: 13px 12px 13px 14px;
            border-radius: 18px;
            border: 1px solid rgba(255,255,255,0.82);
            background: linear-gradient(135deg, rgba(255,255,255,0.58), rgba(255,246,250,0.36));
            backdrop-filter: blur(18px) saturate(1.22);
            -webkit-backdrop-filter: blur(18px) saturate(1.22);
            box-shadow: 0 12px 30px rgba(255,107,158,0.14), inset 0 1px 0 rgba(255,255,255,0.88);
            overflow: hidden;
          }
          .bookmark-mobile-item::after {
            content: "";
            position: absolute;
            inset: 1px 1px auto 5px;
            height: 38%;
            border-radius: 16px 16px 22px 22px;
            background: linear-gradient(180deg, rgba(255,255,255,0.42), transparent);
            pointer-events: none;
          }
          .bookmark-mobile-item::before {
            content: "";
            position: absolute;
            inset: 0 auto 0 0;
            width: 4px;
            background: linear-gradient(180deg, var(--pink-400), var(--blue-400));
            opacity: 0.82;
          }
          .bookmark-mobile-rank {
            position: absolute;
            right: 12px;
            top: 8px;
            color: rgba(176,96,112,0.32);
            font-size: 11px;
            font-weight: 900;
            font-family: var(--font-mono);
          }
          .bookmark-mobile-logo {
            width: 44px;
            height: 44px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, var(--pink-50), var(--blue-50));
            box-shadow: 0 6px 16px rgba(255,107,158,0.16), inset 0 1px 0 rgba(255,255,255,0.9);
            z-index: 1;
          }
          .bookmark-mobile-logo img {
            width: 27px;
            height: 27px;
            object-fit: contain;
            border-radius: 7px;
          }
          .bookmark-mobile-info {
            min-width: 0;
            z-index: 1;
          }
          .bookmark-mobile-title {
            padding-right: 28px;
            color: var(--neutral-800);
            font-size: 14px;
            font-weight: 900;
            line-height: 1.35;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .bookmark-mobile-domain {
            margin-top: 2px;
            color: var(--neutral-600);
            font-size: 12px;
            font-weight: 700;
            font-family: var(--font-mono);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .bookmark-mobile-url {
            display: block;
            margin-top: 5px;
            max-width: 100%;
            color: var(--blue-500);
            font-size: 11px;
            line-height: 1.35;
            font-family: var(--font-mono);
            text-decoration: none;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .bookmark-mobile-actions {
            display: flex;
            flex-direction: column;
            gap: 8px;
            z-index: 1;
          }
          .bookmark-mobile-actions a,
          .bookmark-mobile-actions button {
            width: 34px;
            height: 34px;
            border-radius: 12px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(255,255,255,0.86);
            background: rgba(255,255,255,0.54);
            backdrop-filter: blur(12px) saturate(1.18);
            -webkit-backdrop-filter: blur(12px) saturate(1.18);
            color: var(--pink-600);
            box-shadow: 0 5px 14px rgba(255,107,158,0.1);
            cursor: pointer;
          }
          .bookmark-mobile-actions button {
            color: var(--blue-500);
            padding: 0;
          }
        }
      `}</style>

      {/* 标题行 */}
      <header ref={headerRef} className="bookmark-section-header mb-4 flex items-center gap-3 flex-shrink-0 px-8 pt-6" style={{ flexWrap: 'wrap' }}>
        <Hash size={24} style={{ color: 'var(--pink-400)' }} />
        <h2 className="bookmark-section-title" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--neutral-800)' }}>{displayedCategory.name}</h2>
        <div
          role="group"
          aria-label="视图切换"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: 4,
            borderRadius: 14,
            background: 'rgba(255,255,255,0.58)',
            border: '1px solid rgba(255,255,255,0.85)',
            boxShadow: '0 6px 22px rgba(255,107,158,0.12)',
          }}
        >
          {[
            { id: 'cards' as const, icon: <Grid3X3 size={16} />, label: '卡片' },
            { id: 'table' as const, icon: <List size={17} />, label: '表格' },
          ].map((option) => {
            const selected = viewMode === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  if (option.id === viewMode) return;
                  const content = getCurrentContent();
                  if (!content) {
                    setViewMode(option.id);
                    return;
                  }
                  gsap.to(content, {
                    opacity: 0,
                    x: option.id === 'cards' ? 26 : -26,
                    scale: 0.985,
                    filter: 'blur(8px)',
                    duration: 0.18,
                    ease: 'power2.in',
                    overwrite: 'auto',
                    onComplete: () => setViewMode(option.id),
                  });
                }}
                aria-pressed={selected}
                title={option.label}
                style={{
                  height: 34,
                  minWidth: 64,
                  borderRadius: 10,
                  border: selected ? '1px solid var(--pink-400)' : '1px solid transparent',
                  background: selected ? 'linear-gradient(135deg, var(--pink-50), var(--blue-50))' : 'transparent',
                  color: selected ? 'var(--pink-600)' : 'var(--neutral-600)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: selected ? '0 4px 14px rgba(255,107,158,0.18)' : 'none',
                }}
              >
                {option.icon}
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
        <div className="bookmark-count-pill" style={{
          marginLeft: 'auto',
          fontSize: '0.875rem',
          color: 'var(--neutral-600)',
          background: 'rgba(255,255,255,0.5)',
          padding: '0.375rem 1rem',
          borderRadius: '9999px',
          border: '1px solid rgba(255,255,255,0.8)'
        }}>
          {links.length === displayedCategory.links.length
            ? `共 ${displayedCategory.links.length} 个内容`
            : `${links.length}/${displayedCategory.links.length} 个内容`}
        </div>
      </header>

      {isAutumnCategory && (
        <AutumnLaunchNotice />
      )}

      <div
        className="bookmark-filter-bar flex items-center gap-3 flex-shrink-0 px-8 pb-4"
        style={{ flexWrap: 'wrap' }}
      >
        <div
          className="bookmark-search-box"
          style={{
            width: 280,
            minWidth: 220,
            height: 38,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 12px',
            borderRadius: 14,
            background: 'rgba(255,255,255,0.62)',
            border: '1px solid rgba(255,255,255,0.86)',
            boxShadow: '0 6px 22px rgba(255,107,158,0.1)',
          }}
        >
          <Search size={16} style={{ color: 'var(--pink-500)', flexShrink: 0 }} />
          <input
            value={searchInput}
            onChange={(e) => {
              const next = e.target.value;
              setSearchInput(next);
              if (!isComposing && next === '') setSearchTerm('');
            }}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={(e) => {
              setIsComposing(false);
              setSearchInput(e.currentTarget.value);
              setSearchTerm(e.currentTarget.value);
            }}
            placeholder="搜索公司、域名或链接"
            aria-label="搜索公司、域名或链接"
            style={{
              flex: 1,
              minWidth: 0,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: 'var(--neutral-800)',
              fontSize: 13,
              fontWeight: 600,
            }}
          />
          {searchInput && (
            <button
              type="button"
              aria-label="清空搜索"
              onClick={() => {
                setSearchInput('');
                setSearchTerm('');
              }}
              style={{
                width: 24,
                height: 24,
                borderRadius: 8,
                border: 'none',
                background: 'rgba(255,183,197,0.25)',
                color: 'var(--pink-600)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div
          className="bookmark-group-tabs bookmark-toolbar-scroll"
          role="tablist"
          aria-label={`${displayedCategory.name}分类`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            overflowX: 'auto',
            padding: '2px',
            flex: 1,
            minWidth: 0,
          }}
        >
          {groups.map((group) => {
            const selected = group.id === activeGroupId;
            return (
              <button
                key={group.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveGroupId(group.id)}
                style={{
                  height: 34,
                  padding: '0 13px',
                  borderRadius: 999,
                  border: selected ? '1px solid var(--pink-400)' : '1px solid rgba(255,255,255,0.85)',
                  background: selected ? 'linear-gradient(135deg, var(--pink-50), var(--blue-50))' : 'rgba(255,255,255,0.56)',
                  color: selected ? 'var(--pink-600)' : 'var(--neutral-600)',
                  boxShadow: selected ? '0 5px 16px rgba(255,107,158,0.16)' : 'none',
                  fontSize: 12,
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>{group.name}</span>
                <span style={{ color: selected ? 'var(--pink-500)' : 'var(--neutral-400)' }}>{group.links.length}</span>
              </button>
            );
          })}
        </div>
      </div>

      {links.length === 0 ? (
        <div
          className="mx-6 mb-4 flex-1"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 220,
            borderRadius: 18,
            border: '1px dashed rgba(255,107,158,0.36)',
            background: 'rgba(255,255,255,0.42)',
            color: 'var(--neutral-600)',
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          没有匹配的内容
        </div>
      ) : isCardsView ? (
        <>
          {/* 轮播舞台 */}
          <div
            ref={stageRef}
            className="bookmark-card-stage flex-1 relative"
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
          <div className="bookmark-card-indicators flex items-center justify-center gap-2 pt-4 pb-2 flex-shrink-0">
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
        </>
      ) : (
        <BookmarkTable
          links={links}
          onShare={onShare}
          innerRef={(el) => { tableWrapRef.current = el; }}
        />
      )}
    </section>
  );
};

export default React.memo(BookmarkGrid);
