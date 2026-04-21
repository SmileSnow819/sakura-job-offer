import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import gsap from 'gsap';
import { IInterview } from '../../types/bookmark';

interface IInterviewTimelineProps {
  interviews: IInterview[];
  activeDate: string | null;
  onDateClick: (date: string) => void;
}

const MAX_VISIBLE_CARDS = 2;

function parseTime(timeStr: string) {
  const [year, dateRaw, time] = timeStr.split('_');
  const month = dateRaw.slice(0, 2);
  const day = dateRaw.slice(2);
  return {
    date: `${year}-${month}-${day}`,
    display: `${month}/${day}`,
    time: time ?? '',
    year,
  };
}

function toPlainText(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/^#+\s*/gm, '')
    .replace(/[>*_\-]/g, ' ')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const COLORS = ['#6366f1', '#06b6d4', '#8b5cf6', '#10b981', '#ef4444', '#ec4899'];
const OFFER_GRADIENT = 'linear-gradient(135deg, #f59e0b 0%, #f97316 40%, #eab308 100%)';

/* ── Offer 徽章 ────────────────────────────────────────────────────────────── */
const OfferBadge: React.FC = () => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      fontSize: 10,
      fontWeight: 900,
      color: 'oklch(0.99 0.008 350)',
      background: OFFER_GRADIENT,
      padding: '2px 8px',
      borderRadius: 999,
      boxShadow: '0 2px 8px rgba(245,158,11,0.4)',
      letterSpacing: 1,
      animation: 'offerShine 2s ease-in-out infinite',
    }}
  >
    OFFER
  </span>
);

/* ── 完整面经弹窗 ──────────────────────────────────────────────────────── */
interface IDetailModalProps {
  interview: IInterview;
  onClose: () => void;
}

const DetailModal: React.FC<IDetailModalProps> = ({ interview, onClose }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { time } = parseTime(interview.time);
  const [year, dateRaw] = interview.time.split('_');
  const month = dateRaw.slice(0, 2);
  const day = dateRaw.slice(2);
  const displayDate = `${year}.${month}.${day}`;
  const isOffer = !!interview.isOffer;

  useEffect(() => {
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25 });
    gsap.fromTo(contentRef.current,
      { opacity: 0, scale: 0.9, y: 40 },
      { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: 'power4.out' },
    );

    return () => {
      gsap.killTweensOf(overlayRef.current);
      gsap.killTweensOf(contentRef.current);
    };
  }, []);

  const handleClose = () => {
    gsap.to(contentRef.current, { opacity: 0, scale: 0.92, y: 20, duration: 0.2, ease: 'power2.in' });
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.25, delay: 0.05, onComplete: onClose });
  };

  const normalizedContent = interview.content.replace(/^##\s.+\n+/m, '').trim();

  return (
    <div
      ref={overlayRef}
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(15,23,42,0.5)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        ref={contentRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(20px)',
          borderRadius: 22,
          maxWidth: 600,
          width: '100%',
          maxHeight: '85vh',
          overflow: 'hidden',
          boxShadow: isOffer
            ? '0 30px 70px rgba(245,158,11,0.2), 0 0 0 1px rgba(245,158,11,0.15)'
            : '0 30px 70px rgba(15,23,42,0.2)',
          border: isOffer ? 'none' : '1px solid rgba(99,102,241,0.12)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* 顶部金色线 */}
        <div style={{
          height: isOffer ? 1 : 2,
          background: isOffer
            ? OFFER_GRADIENT
            : 'linear-gradient(90deg, #6366f1, #06b6d4, #8b5cf6)',
          flexShrink: 0,
        }} />

        {/* 头部 */}
        <div style={{
          padding: '16px 20px 12px',
          borderBottom: '1px solid rgba(15,23,42,0.06)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#1e293b' }}>
                {interview.company}
              </span>
              {isOffer && <OfferBadge />}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748b' }}>
              <span>{interview.department}</span>
              <span>·</span>
              <span>{displayDate} {time}</span>
              <span>·</span>
              <span>{interview.author}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
              {interview.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '1px 8px',
                    borderRadius: 999,
                    background: 'rgba(15,23,42,0.05)',
                    color: '#475569',
                    border: '1px solid rgba(15,23,42,0.08)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '1px solid rgba(15,23,42,0.1)',
              background: 'rgba(15,23,42,0.04)',
              cursor: 'pointer',
              fontSize: 16,
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { gsap.to(e.currentTarget, { scale: 1.1, duration: 0.15 }); }}
            onMouseLeave={(e) => { gsap.to(e.currentTarget, { scale: 1, duration: 0.15 }); }}
          >
            ×
          </button>
        </div>

        {/* Markdown 正文 */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px 20px',
          fontSize: 13,
          lineHeight: 1.75,
          color: '#334155',
          scrollbarWidth: 'thin',
        }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ className, children, ...props }) {
                const isBlock = className?.includes('language-');
                if (isBlock) {
                  return (
                    <pre style={{
                      position: 'relative',
                      background: '#0a0e1a',
                      borderRadius: 8,
                      padding: '22px 14px 12px',
                      overflowX: 'auto',
                      fontSize: 12,
                      lineHeight: 1.6,
                      border: '1px solid rgba(148,163,184,0.2)',
                      margin: '10px 0',
                      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
                    }}>
                      {/* 终端三点装饰 */}
                      <div style={{
                        position: 'absolute',
                        top: 8,
                        left: 12,
                        display: 'flex',
                        gap: 6,
                      }}>
                        {['#ef4444', '#eab308', '#10b981'].map((color, i) => (
                          <div
                            key={i}
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              background: color,
                              opacity: 0.6,
                            }}
                          />
                        ))}
                      </div>
                      <code style={{ color: '#e2e8f0', fontFamily: 'var(--font-mono)' }} {...props}>{children}</code>
                    </pre>
                  );
                }
                return (
                  <code style={{
                    background: 'rgba(99,102,241,0.1)',
                    color: '#4f46e5',
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontFamily: 'var(--font-mono)',
                    border: '1px solid rgba(15,23,42,0.1)',
                  }} {...props}>{children}</code>
                );
              },
              h2({ children }) {
                return <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', marginTop: 16, marginBottom: 6, borderBottom: '1px solid rgba(99,102,241,0.15)', paddingBottom: 4 }}>{children}</h2>;
              },
              h3({ children }) {
                return <h3 style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginTop: 12, marginBottom: 4 }}>{children}</h3>;
              },
              blockquote({ children }) {
                return (
                  <blockquote style={{
                    position: 'relative',
                    padding: '8px 12px 8px 20px',
                    margin: '8px 0',
                    background: 'linear-gradient(135deg, rgba(15,23,42,0.03), rgba(99,102,241,0.04))',
                    borderRadius: 6,
                    border: '1px solid rgba(99,102,241,0.12)',
                    fontSize: '12px',
                    lineHeight: '1.6',
                    color: '#475569',
                  }}>
                    <span style={{
                      position: 'absolute',
                      left: 6,
                      top: 6,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 14,
                      color: '#6366f1',
                      opacity: 0.6,
                    }}>
                      &gt;
                    </span>
                    {children}
                  </blockquote>
                );
              },
              strong({ children }) {
                return <strong style={{ color: '#4338ca', fontWeight: 800 }}>{children}</strong>;
              },
              li({ children }) {
                return <li style={{ marginBottom: 2 }}>{children}</li>;
              },
            }}
          >
            {normalizedContent}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

/* ── 单个面经小卡片 ─────────────────────────────────────────────────────── */
interface IMiniCardProps {
  interview: IInterview;
  color: string;
  isOffer: boolean;
  onViewDetail: (iv: IInterview) => void;
}

const MiniCard: React.FC<IMiniCardProps> = ({ interview, color, isOffer, onViewDetail }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { time } = parseTime(interview.time);
  const previewText = toPlainText(interview.content).slice(0, 80);

  const handleMouseEnter = () => {
    gsap.to(ref.current, { scale: 1.03, y: -2, duration: 0.2, ease: 'power2.out' });
  };
  const handleMouseLeave = () => {
    gsap.to(ref.current, { scale: 1, y: 0, duration: 0.2, ease: 'power2.out' });
  };

  const headerBg = isOffer ? OFFER_GRADIENT : color;

  return (
    <div
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        borderRadius: 10,
        overflow: 'hidden',
        background: 'oklch(0.99 0.008 350)',
        border: isOffer ? 'none' : '1px solid rgba(15,23,42,0.08)',
        boxShadow: isOffer
          ? '0 4px 16px rgba(245,158,11,0.18)'
          : '0 2px 10px rgba(15,23,42,0.07)',
        position: 'relative',
      }}
    >
      <div
        style={{
          background: headerBg,
          color: 'oklch(0.99 0.008 350)',
          fontSize: 11,
          fontWeight: 800,
          padding: '5px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>{interview.company}</span>
        <span style={{ fontSize: 10, opacity: 0.9, fontWeight: 600 }}>{time}</span>
      </div>
      <div style={{ padding: '6px 8px' }}>
        {isOffer && (
          <div style={{ marginBottom: 4 }}>
            <OfferBadge />
          </div>
        )}
        <p
          style={{
            margin: 0,
            fontSize: 10,
            lineHeight: 1.5,
            color: '#475569',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {previewText}...
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewDetail(interview);
          }}
          style={{
            marginTop: 6,
            fontSize: 10,
            fontWeight: 700,
            color: isOffer ? '#d97706' : color,
            border: `1px solid ${isOffer ? 'rgba(245,158,11,0.3)' : `${color}44`}`,
            background: isOffer ? 'rgba(245,158,11,0.06)' : `${color}0a`,
            borderRadius: 999,
            padding: '2px 10px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
          onMouseEnter={(e) => { gsap.to(e.currentTarget, { scale: 1.05, duration: 0.12 }); }}
          onMouseLeave={(e) => { gsap.to(e.currentTarget, { scale: 1, duration: 0.12 }); }}
        >
          查看完整面经 →
        </button>
      </div>
    </div>
  );
};

/* ── 日内 Timeline 弹窗（竖向一左一右） ──────────────────────────────────── */
interface IDayModalProps {
  date: string;
  list: IInterview[];
  color: string;
  onClose: () => void;
  onViewDetail: (iv: IInterview) => void;
}

const DayModal: React.FC<IDayModalProps> = ({ date, list, color, onClose, onViewDetail }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25 });
    gsap.fromTo(contentRef.current, { opacity: 0, scale: 0.92, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'power4.out' });

    const tl = gsap.timeline({ delay: 0.2 });
    tl.fromTo(lineRef.current, { scaleY: 0 }, { scaleY: 1, transformOrigin: 'top center', duration: 0.5, ease: 'power3.out' });
    itemRefs.current.forEach((el, i) => {
      if (!el) return;
      const isLeft = i % 2 === 0;
      tl.fromTo(el,
        { opacity: 0, x: isLeft ? -30 : 30 },
        { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' },
        `-=${i === 0 ? 0.2 : 0.15}`,
      );
    });
    dotRefs.current.forEach((el) => {
      if (!el) return;
      tl.fromTo(el, { scale: 0 }, { scale: 1, duration: 0.25, ease: 'power4.out' }, `-=${0.2}`);
    });

    return () => { tl.kill(); };
  }, []);

  const handleClose = () => {
    gsap.to(contentRef.current, { opacity: 0, scale: 0.92, y: 20, duration: 0.2, ease: 'power2.in' });
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.25, delay: 0.05, onComplete: onClose });
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(15,23,42,0.4)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        ref={contentRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: 20,
          padding: '20px 18px 18px',
          maxWidth: 520,
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 25px 60px rgba(15,23,42,0.2)',
          border: '1px solid rgba(99,102,241,0.12)',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 15,
                color: 'oklch(0.99 0.008 350)',
                fontWeight: 900,
                boxShadow: `0 4px 12px ${color}44`,
              }}
            >
              📅
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#1e293b' }}>{date}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{list.length} 场面试</div>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: '1px solid rgba(15,23,42,0.1)',
              background: 'rgba(15,23,42,0.04)',
              cursor: 'pointer',
              fontSize: 14,
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ position: 'relative', padding: '4px 0' }}>
          <div
            ref={lineRef}
            style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              bottom: 0,
              width: 2,
              transform: 'translateX(-50%)',
              borderRadius: 999,
              background: `linear-gradient(180deg, ${color} 0%, ${color}66 100%)`,
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {list.map((iv, i) => {
              const isLeft = i % 2 === 0;
              const isOffer = !!iv.isOffer;
              const { time } = parseTime(iv.time);
              const cardColor = isOffer ? OFFER_GRADIENT : color;
              const dotBg = isOffer ? OFFER_GRADIENT : color;

              const cardEl = (
                <div
                  onClick={() => onViewDetail(iv)}
                  style={{
                    width: '100%',
                    maxWidth: 200,
                    borderRadius: 10,
                    overflow: 'hidden',
                    background: 'oklch(0.99 0.008 350)',
                    border: isOffer ? 'none' : `1px solid rgba(15,23,42,0.08)`,
                    boxShadow: isOffer ? '0 4px 16px rgba(245,158,11,0.18)' : '0 2px 8px rgba(15,23,42,0.06)',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  <div style={{
                    background: cardColor,
                    color: 'oklch(0.99 0.008 350)',
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '4px 8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <span>{iv.company}</span>
                    <span style={{ fontSize: 9, opacity: 0.85 }}>{time}</span>
                  </div>
                  <div style={{ padding: '5px 8px' }}>
                    {isOffer && <div style={{ marginBottom: 3 }}><OfferBadge /></div>}
                    <p style={{ margin: 0, fontSize: 10, lineHeight: 1.4, color: '#475569', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {toPlainText(iv.content).slice(0, 60)}...
                    </p>
                  </div>
                </div>
              );

              return (
                <div
                  key={iv.id}
                  ref={(el) => { itemRefs.current[i] = el; }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(180px, 1.2fr) 40px minmax(200px, 1fr)',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    {isLeft ? cardEl : <div />}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div
                      ref={(el) => { dotRefs.current[i] = el; }}
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: dotBg,
                        border: '2px solid oklch(0.99 0.008 350)',
                        boxShadow: isOffer
                          ? '0 0 0 3px rgba(245,158,11,0.25), 0 2px 8px rgba(245,158,11,0.3)'
                          : `0 2px 6px ${color}44`,
                        zIndex: 2,
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    {!isLeft ? cardEl : <div />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── 主 Timeline ─────────────────────────────────────────────────────────── */
const InterviewTimeline: React.FC<IInterviewTimelineProps> = ({ interviews, activeDate, onDateClick }) => {
  const lineRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dotRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [detailInterview, setDetailInterview] = useState<IInterview | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, IInterview[]>();
    interviews.forEach((iv) => {
      const d = parseTime(iv.time).date;
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(iv);
    });
    return Array.from(map.entries())
      .map(([date, list]) => ({
        date,
        display: parseTime(list[0].time).display,
        year: parseTime(list[0].time).year,
        list,
        hasOffer: list.some((iv) => !!iv.isOffer),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [interviews]);

  useEffect(() => {
    gsap.set(lineRef.current, { scaleY: 0, transformOrigin: 'top center' });
    gsap.set(dotRefs.current.filter(Boolean), { scale: 0, opacity: 0 });
    gsap.set(itemRefs.current.filter(Boolean), { opacity: 0, y: 24 });

    const tl = gsap.timeline({ delay: 0.08 });
    tl.to(lineRef.current, { scaleY: 1, duration: 0.9, ease: 'power3.out' });

    itemRefs.current.forEach((el, i) => {
      if (!el) return;
      const isLeft = i % 2 === 0;
      tl.fromTo(
        el,
        { opacity: 0, x: isLeft ? -20 : 20, y: 10 },
        { opacity: 1, x: 0, y: 0, duration: 0.35, ease: 'power2.out' },
        `-=${i === 0 ? 0.5 : 0.22}`,
      );
    });

    dotRefs.current.forEach((el) => {
      if (!el) return;
      tl.to(el, { scale: 1, opacity: 1, duration: 0.3, ease: 'power4.out' }, `-=${0.25}`);
    });

    return () => { tl.kill(); };
  }, [groups.length]);

  const onSelect = useCallback((date: string, idx: number) => {
    onDateClick(date);
    const dot = dotRefs.current[idx];
    if (dot) {
      gsap.fromTo(dot, { scale: 1 }, { scale: 1.4, duration: 0.15, yoyo: true, repeat: 1, ease: 'power2.out' });
    }
  }, [onDateClick]);

  const handleViewDetail = useCallback((iv: IInterview) => {
    setDetailInterview(iv);
  }, []);

  const expandedGroup = expandedDate ? groups.find((g) => g.date === expandedDate) : null;

  return (
    <>
      <style>{`
        @keyframes offerShine {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.15); }
        }
        @keyframes offerPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.4); }
          50% { box-shadow: 0 0 0 5px rgba(245,158,11,0); }
        }
      `}</style>

      <div style={{ width: '100%', position: 'relative', padding: '4px 0 12px' }}>
        <div
          ref={lineRef}
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: 3,
            transform: 'translateX(-50%)',
            borderRadius: 999,
            background: 'linear-gradient(180deg, #6366f1 0%, #06b6d4 55%, #a78bfa 100%)',
            boxShadow: '0 0 12px rgba(99,102,241,0.25)',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'relative' }}>
          {groups.map((g, i) => {
            const isLeft = i % 2 === 0;
            const isActive = activeDate === g.date;
            const color = COLORS[i % COLORS.length];
            const visibleList = g.list.slice(0, MAX_VISIBLE_CARDS);
            const hasMore = g.list.length > MAX_VISIBLE_CARDS;
            const hasOffer = g.hasOffer;

            const dotColor = hasOffer ? undefined : color;
            const dotBg = hasOffer ? OFFER_GRADIENT : (isActive ? color : color);

            const cardContent = (
              <div style={{ width: 'min(100%, 280px)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {/* 日期标题 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 900,
                      color,
                      letterSpacing: 0.3,
                    }}
                  >
                    {g.year}.{g.display}
                  </span>
                  <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>
                    {g.list.length} 场面试
                  </span>
                </div>

                {visibleList.map((iv) => (
                  <MiniCard
                    key={iv.id}
                    interview={iv}
                    color={color}
                    isOffer={!!iv.isOffer}
                    onViewDetail={handleViewDetail}
                  />
                ))}

                {hasMore && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedDate(g.date);
                    }}
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color,
                      border: `1.5px solid ${color}44`,
                      background: `${color}0a`,
                      borderRadius: 999,
                      padding: '5px 14px',
                      cursor: 'pointer',
                      alignSelf: 'center',
                      backdropFilter: 'blur(4px)',
                    }}
                    onMouseEnter={(e) => {
                      gsap.to(e.currentTarget, { scale: 1.06, duration: 0.15 });
                    }}
                    onMouseLeave={(e) => {
                      gsap.to(e.currentTarget, { scale: 1, duration: 0.15 });
                    }}
                  >
                    查看全部 {g.list.length} 篇 →
                  </button>
                )}
              </div>
            );

            return (
              <div
                key={g.date}
                ref={(el) => { itemRefs.current[i] = el; }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(180px, 1.2fr) 40px minmax(200px, 1fr)',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {/* 左侧 */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {isLeft ? cardContent : <div style={{ width: 'min(100%, 280px)' }} />}
                </div>

                {/* 中间圆点 */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    ref={(el) => { dotRefs.current[i] = el; }}
                    onClick={() => onSelect(g.date, i)}
                    style={{
                      width: isActive ? 18 : 14,
                      height: isActive ? 18 : 14,
                      borderRadius: '50%',
                      border: isActive ? `3px solid ${dotColor ?? '#f59e0b'}` : '2.5px solid oklch(0.99 0.008 350)',
                      background: dotBg,
                      boxShadow: hasOffer
                        ? '0 0 0 3px rgba(245,158,11,0.2), 0 2px 10px rgba(245,158,11,0.3)'
                        : (isActive ? `0 0 0 4px ${color}33` : `0 2px 8px ${color}44`),
                      cursor: 'pointer',
                      padding: 0,
                      zIndex: 2,
                      animation: hasOffer ? 'offerPulse 2s ease-in-out infinite' : undefined,
                    }}
                  />
                </div>

                {/* 右侧 */}
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  {!isLeft ? cardContent : <div style={{ width: 'min(100%, 280px)' }} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 查看更多弹窗 */}
      {expandedGroup && (
        <DayModal
          date={expandedGroup.date}
          list={expandedGroup.list}
          color={COLORS[groups.indexOf(expandedGroup) % COLORS.length]}
          onClose={() => setExpandedDate(null)}
          onViewDetail={(iv) => {
            setExpandedDate(null);
            setTimeout(() => setDetailInterview(iv), 300);
          }}
        />
      )}

      {/* 完整面经弹窗 */}
      {detailInterview && (
        <DetailModal
          interview={detailInterview}
          onClose={() => setDetailInterview(null)}
        />
      )}
    </>
  );
};

export default InterviewTimeline;
