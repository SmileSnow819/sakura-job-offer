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

const COLORS = [
  'oklch(0.55 0.18 350)',
  'oklch(0.58 0.14 320)',
  'oklch(0.52 0.16 10)',
  'oklch(0.55 0.12 340)',
  'oklch(0.50 0.15 355)',
  'oklch(0.60 0.13 330)',
];

const COLORS_HEX = ['#d4618c', '#b565a7', '#c75050', '#a8567a', '#c24068', '#c87aab'];

const OFFER_GRADIENT = 'linear-gradient(135deg, oklch(0.75 0.15 85) 0%, oklch(0.70 0.16 70) 40%, oklch(0.78 0.13 90) 100%)';

const OfferBadge: React.FC = () => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      fontSize: 10,
      fontWeight: 900,
      color: 'oklch(0.99 0.005 85)',
      background: OFFER_GRADIENT,
      padding: '2px 8px',
      borderRadius: 999,
      boxShadow: '0 2px 8px oklch(0.70 0.15 85 / 0.35)',
      letterSpacing: 1,
      animation: 'offerShine 2s ease-in-out infinite',
    }}
  >
    OFFER
  </span>
);

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
        background: 'oklch(0.15 0.02 350 / 0.5)',
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
          background: 'oklch(0.99 0.005 350 / 0.97)',
          backdropFilter: 'blur(20px)',
          borderRadius: 16,
          maxWidth: 600,
          width: '100%',
          maxHeight: '85vh',
          overflow: 'hidden',
          boxShadow: isOffer
            ? '0 24px 64px oklch(0.70 0.15 85 / 0.18), 0 0 0 1px oklch(0.75 0.12 85 / 0.12)'
            : '0 24px 64px oklch(0.20 0.02 350 / 0.16)',
          border: isOffer ? 'none' : '1px solid oklch(0.90 0.01 350)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        <div style={{
          height: 2,
          background: isOffer ? OFFER_GRADIENT : 'oklch(0.65 0.18 350)',
          flexShrink: 0,
        }} />

        <div style={{
          padding: '16px 20px 12px',
          borderBottom: '1px solid oklch(0.92 0.01 350 / 0.5)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: 'oklch(0.22 0.02 350)' }}>
                {interview.company}
              </span>
              {isOffer && <OfferBadge />}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'oklch(0.55 0.015 350)' }}>
              <span>{interview.department}</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>{displayDate} {time}</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>{interview.author}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
              {interview.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: 'oklch(0.96 0.01 350)',
                    color: 'oklch(0.45 0.02 350)',
                    border: '1px solid oklch(0.92 0.01 350)',
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
              border: '1px solid oklch(0.90 0.01 350)',
              background: 'oklch(0.97 0.005 350)',
              cursor: 'pointer',
              fontSize: 16,
              color: 'oklch(0.55 0.015 350)',
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

        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px 24px',
          fontSize: 13,
          lineHeight: 1.75,
          color: 'oklch(0.35 0.02 350)',
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
                      background: 'oklch(0.15 0.01 350)',
                      borderRadius: 8,
                      padding: '28px 14px 14px',
                      overflowX: 'auto',
                      fontSize: 12,
                      lineHeight: 1.6,
                      border: '1px solid oklch(0.30 0.01 350)',
                      margin: '12px 0',
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: 10,
                        left: 12,
                        display: 'flex',
                        gap: 6,
                      }}>
                        {['oklch(0.60 0.20 25)', 'oklch(0.75 0.15 95)', 'oklch(0.65 0.18 155)'].map((c, ci) => (
                          <div
                            key={ci}
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: c,
                              opacity: 0.7,
                            }}
                          />
                        ))}
                      </div>
                      <code style={{ color: 'oklch(0.88 0.01 350)', fontFamily: 'var(--font-mono)' }} {...props}>{children}</code>
                    </pre>
                  );
                }
                return (
                  <code style={{
                    background: 'oklch(0.96 0.02 350)',
                    color: 'oklch(0.45 0.15 350)',
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontFamily: 'var(--font-mono)',
                    border: '1px solid oklch(0.92 0.01 350)',
                  }} {...props}>{children}</code>
                );
              },
              h2({ children }) {
                return <h2 style={{ fontSize: 16, fontWeight: 800, color: 'oklch(0.22 0.02 350)', marginTop: 20, marginBottom: 8, borderBottom: '1px solid oklch(0.92 0.01 350)', paddingBottom: 6 }}>{children}</h2>;
              },
              h3({ children }) {
                return <h3 style={{ fontSize: 14, fontWeight: 700, color: 'oklch(0.35 0.02 350)', marginTop: 16, marginBottom: 6 }}>{children}</h3>;
              },
              blockquote({ children }) {
                return (
                  <blockquote style={{
                    position: 'relative',
                    padding: '10px 14px 10px 20px',
                    margin: '10px 0',
                    background: 'oklch(0.97 0.008 350)',
                    borderRadius: 8,
                    border: '1px solid oklch(0.92 0.01 350)',
                    fontSize: 12,
                    lineHeight: 1.6,
                    color: 'oklch(0.45 0.02 350)',
                  }}>
                    <span style={{
                      position: 'absolute',
                      left: 7,
                      top: 8,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 14,
                      color: 'oklch(0.65 0.12 350)',
                      opacity: 0.5,
                    }}>
                      &gt;
                    </span>
                    {children}
                  </blockquote>
                );
              },
              strong({ children }) {
                return <strong style={{ color: 'oklch(0.40 0.15 350)', fontWeight: 800 }}>{children}</strong>;
              },
              li({ children }) {
                return <li style={{ marginBottom: 3 }}>{children}</li>;
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

interface IMiniCardProps {
  interview: IInterview;
  color: string;
  colorHex: string;
  isOffer: boolean;
  onViewDetail: (iv: IInterview) => void;
}

const MiniCard: React.FC<IMiniCardProps> = ({ interview, color, colorHex, isOffer, onViewDetail }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { time } = parseTime(interview.time);
  const previewText = toPlainText(interview.content).slice(0, 90);

  const handleMouseEnter = () => {
    gsap.to(ref.current, { scale: 1.02, y: -2, duration: 0.2, ease: 'power2.out' });
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
        borderRadius: 12,
        overflow: 'hidden',
        background: 'oklch(0.99 0.005 350)',
        border: isOffer ? 'none' : '1px solid oklch(0.92 0.01 350)',
        boxShadow: isOffer
          ? '0 4px 16px oklch(0.70 0.15 85 / 0.15)'
          : '0 2px 8px oklch(0.20 0.02 350 / 0.06)',
        position: 'relative',
      }}
    >
      <div
        style={{
          background: headerBg,
          color: 'oklch(0.99 0.005 350)',
          fontSize: 11,
          fontWeight: 800,
          padding: '6px 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>{interview.company}</span>
        <span style={{ fontSize: 10, opacity: 0.85, fontWeight: 600 }}>{time}</span>
      </div>
      <div style={{ padding: '8px 10px 10px' }}>
        {isOffer && (
          <div style={{ marginBottom: 6 }}>
            <OfferBadge />
          </div>
        )}
        <p
          style={{
            margin: 0,
            fontSize: 11,
            lineHeight: 1.55,
            color: 'oklch(0.45 0.015 350)',
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
            marginTop: 8,
            fontSize: 11,
            fontWeight: 700,
            color: isOffer ? 'oklch(0.55 0.14 85)' : color,
            border: isOffer
              ? '1px solid oklch(0.80 0.10 85 / 0.3)'
              : `1px solid ${colorHex}33`,
            background: isOffer
              ? 'oklch(0.95 0.03 85)'
              : `${colorHex}08`,
            borderRadius: 999,
            padding: '4px 12px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            lineHeight: 1.4,
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

interface IDayModalProps {
  date: string;
  list: IInterview[];
  color: string;
  colorHex: string;
  onClose: () => void;
  onViewDetail: (iv: IInterview) => void;
}

const DayModal: React.FC<IDayModalProps> = ({ date, list, color, colorHex, onClose, onViewDetail }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25 });
    gsap.fromTo(contentRef.current, { opacity: 0, scale: 0.92, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'power4.out' });

    const tl = gsap.timeline({ delay: 0.2 });
    itemRefs.current.forEach((el, i) => {
      if (!el) return;
      tl.fromTo(el,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' },
        `-=${i === 0 ? 0 : 0.15}`,
      );
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
        background: 'oklch(0.15 0.02 350 / 0.4)',
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
          background: 'oklch(0.99 0.005 350 / 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: 16,
          padding: '20px 20px 18px',
          maxWidth: 480,
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 24px 56px oklch(0.20 0.02 350 / 0.18)',
          border: '1px solid oklch(0.92 0.01 350)',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: 'oklch(0.22 0.02 350)' }}>{date}</div>
            <div style={{ fontSize: 11, color: 'oklch(0.55 0.015 350)', marginTop: 2 }}>{list.length} 场面试</div>
          </div>
          <button
            onClick={handleClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: '1px solid oklch(0.90 0.01 350)',
              background: 'oklch(0.97 0.005 350)',
              cursor: 'pointer',
              fontSize: 14,
              color: 'oklch(0.55 0.015 350)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map((iv, i) => {
            const isOffer = !!iv.isOffer;

            return (
              <div
                key={iv.id}
                ref={(el) => { itemRefs.current[i] = el; }}
              >
                <MiniCard
                  interview={iv}
                  color={color}
                  colorHex={colorHex}
                  isOffer={isOffer}
                  onViewDetail={(v) => {
                    onClose();
                    setTimeout(() => onViewDetail(v), 300);
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const LINE_WIDTH = 2;
const DOT_SIZE = 8;
const DOT_SIZE_OFFER = 10;

const InterviewTimeline: React.FC<IInterviewTimelineProps> = ({ interviews, activeDate, onDateClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
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
    gsap.set(itemRefs.current.filter(Boolean), { opacity: 0, y: 20 });

    const tl = gsap.timeline({ delay: 0.08 });

    itemRefs.current.forEach((el, i) => {
      if (!el) return;
      const isLeft = i % 2 === 0;
      tl.fromTo(
        el,
        { opacity: 0, x: isLeft ? -16 : 16, y: 8 },
        { opacity: 1, x: 0, y: 0, duration: 0.35, ease: 'power2.out' },
        `-=${i === 0 ? 0 : 0.22}`,
      );
    });

    return () => { tl.kill(); };
  }, [groups.length]);

  const onSelect = useCallback((date: string) => {
    onDateClick(date);
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
          50% { filter: brightness(1.08); }
        }
      `}</style>

      <div ref={containerRef} style={{ width: '100%', position: 'relative', padding: '8px 0 16px' }}>
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: LINE_WIDTH,
            transform: 'translateX(-50%)',
            background: 'oklch(0.88 0.03 350)',
            borderRadius: 999,
            zIndex: 0,
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, position: 'relative' }}>
          {groups.map((g, i) => {
            const isLeft = i % 2 === 0;
            const isActive = activeDate === g.date;
            const color = COLORS[i % COLORS.length];
            const colorHex = COLORS_HEX[i % COLORS_HEX.length];
            const visibleList = g.list.slice(0, MAX_VISIBLE_CARDS);
            const hasMore = g.list.length > MAX_VISIBLE_CARDS;
            const hasOffer = g.hasOffer;

            const dotSz = hasOffer ? DOT_SIZE_OFFER : DOT_SIZE;

            const cardContent = (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  onClick={() => onSelect(g.date)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 8,
                    textAlign: isLeft ? 'right' : 'left',
                    justifyContent: isLeft ? 'flex-end' : 'flex-start',
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 900,
                      color: isActive ? color : 'oklch(0.35 0.02 350)',
                      letterSpacing: -0.2,
                    }}
                  >
                    {g.year}.{g.display}
                  </span>
                  <span style={{ fontSize: 11, color: 'oklch(0.60 0.01 350)', fontWeight: 500 }}>
                    {g.list.length} 场
                  </span>
                </button>

                {visibleList.map((iv) => (
                  <MiniCard
                    key={iv.id}
                    interview={iv}
                    color={color}
                    colorHex={colorHex}
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
                      border: `1px solid ${colorHex}33`,
                      background: `${colorHex}08`,
                      borderRadius: 999,
                      padding: '5px 14px',
                      cursor: 'pointer',
                      alignSelf: isLeft ? 'flex-end' : 'flex-start',
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
                  gridTemplateColumns: '1fr 1fr',
                  gap: 32,
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: 6,
                    width: dotSz,
                    height: dotSz,
                    borderRadius: '50%',
                    transform: 'translateX(-50%)',
                    background: hasOffer ? OFFER_GRADIENT : (isActive ? color : 'oklch(0.99 0.005 350)'),
                    border: hasOffer ? 'none' : `${LINE_WIDTH}px solid ${isActive ? color : colorHex}`,
                    boxShadow: hasOffer
                      ? '0 0 0 3px oklch(0.75 0.12 85 / 0.2)'
                      : (isActive ? `0 0 0 3px ${colorHex}25` : 'none'),
                    zIndex: 1,
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: 16 }}>
                  {isLeft ? cardContent : null}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-start', paddingLeft: 16 }}>
                  {!isLeft ? cardContent : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {expandedGroup && (
        <DayModal
          date={expandedGroup.date}
          list={expandedGroup.list}
          color={COLORS[groups.indexOf(expandedGroup) % COLORS.length]}
          colorHex={COLORS_HEX[groups.indexOf(expandedGroup) % COLORS_HEX.length]}
          onClose={() => setExpandedDate(null)}
          onViewDetail={(iv) => {
            setExpandedDate(null);
            setTimeout(() => setDetailInterview(iv), 300);
          }}
        />
      )}

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
