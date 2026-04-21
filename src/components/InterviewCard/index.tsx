import React, { useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import gsap from 'gsap';
import { IInterview } from '../../types/bookmark';

interface IInterviewCardProps {
  interview: IInterview;
  index: number;
  previewHeight?: number;
}

function parseTime(timeStr: string) {
  const [year, dateRaw, time] = timeStr.split('_');
  const month = dateRaw.slice(0, 2);
  const day = dateRaw.slice(2);
  return { display: `${year}.${month}.${day}`, time };
}

const TAG_COLORS = [
  { bg: 'rgba(15, 23, 42, 0.06)', color: '#334155', border: 'rgba(100,116,139,0.25)' },
  { bg: 'rgba(59, 130, 246, 0.08)', color: '#1d4ed8', border: 'rgba(59,130,246,0.22)' },
  { bg: 'rgba(168, 85, 247, 0.08)', color: '#7e22ce', border: 'rgba(168,85,247,0.22)' },
  { bg: 'rgba(16, 185, 129, 0.08)', color: '#047857', border: 'rgba(16,185,129,0.22)' },
];

const OFFER_TAG_COLORS = [
  { bg: 'rgba(245, 158, 11, 0.1)', color: '#d97706', border: 'rgba(245,158,11,0.3)' },
  { bg: 'rgba(249, 115, 22, 0.1)', color: '#ea580c', border: 'rgba(249,115,22,0.25)' },
  { bg: 'rgba(234, 179, 8, 0.1)', color: '#ca8a04', border: 'rgba(234,179,8,0.25)' },
  { bg: 'rgba(251, 191, 36, 0.1)', color: '#b45309', border: 'rgba(251,191,36,0.3)' },
];

const InterviewCard: React.FC<IInterviewCardProps> = ({
  interview,
  index,
  previewHeight = 96,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const { display, time } = parseTime(interview.time);
  const isOffer = !!interview.isOffer;

  const normalizedContent = useMemo(() => {
    return interview.content.replace(/^##\s.+\n+/m, '').trim();
  }, [interview.content]);

  const dedupedTags = useMemo(() => {
    return Array.from(new Set(interview.tags.map((tag) => tag.trim())));
  }, [interview.tags]);

  const tagColors = isOffer ? OFFER_TAG_COLORS : TAG_COLORS;

  const handleMouseEnter = () => {
    gsap.to(cardRef.current, {
      y: -4,
      scale: 1.01,
      boxShadow: isOffer
        ? '0 14px 30px rgba(245,158,11,0.22)'
        : '0 14px 26px rgba(15,23,42,0.16)',
      duration: 0.2,
      ease: 'power2.out',
    });
  };

  const handleMouseLeave = () => {
    gsap.to(cardRef.current, {
      y: 0,
      scale: 1,
      boxShadow: isOffer
        ? '0 4px 16px rgba(245,158,11,0.15)'
        : '0 2px 10px rgba(15,23,42,0.08)',
      duration: 0.2,
      ease: 'power2.out',
    });
  };

  return (
    <div
      ref={cardRef}
      className={isOffer ? 'offer-rainbow-border' : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => setExpanded((prev) => !prev)}
      style={{
        background: 'oklch(0.99 0.008 350)',
        borderRadius: 16,
        border: isOffer ? 'none' : '1px solid rgba(15,23,42,0.06)',
        boxShadow: isOffer
          ? '0 4px 16px rgba(245,158,11,0.15)'
          : '0 2px 10px rgba(15,23,42,0.08)',
        overflow: 'hidden',
        cursor: 'pointer',
        marginBottom: 10,
        breakInside: 'avoid',
        position: 'relative',
      }}
    >
      {isOffer && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 16,
            pointerEvents: 'none',
            background: 'linear-gradient(135deg, rgba(245,158,11,0.04) 0%, transparent 40%, rgba(234,179,8,0.04) 100%)',
            zIndex: 0,
          }}
        />
      )}

      {isOffer && (
        <div
          style={{
            height: 3,
            background: 'linear-gradient(90deg, #f59e0b, #f97316, #eab308)',
            animation: 'offerShine 2s ease-in-out infinite',
          }}
        />
      )}

      <div style={{ padding: '10px 10px 11px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: isOffer
                  ? 'linear-gradient(135deg, #f59e0b, #f97316)'
                  : '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 9,
                color: 'oklch(0.99 0.008 350)',
                fontWeight: 800,
              }}
            >
              {interview.author[0]}
            </div>
            <span style={{ fontSize: 10, color: '#475569', fontWeight: 700 }}>{interview.author}</span>
            {isOffer && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 2,
                  fontSize: 9,
                  fontWeight: 900,
                  color: 'oklch(0.99 0.008 350)',
                  background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                  padding: '1px 7px',
                  borderRadius: 999,
                  boxShadow: '0 2px 6px rgba(245,158,11,0.3)',
                  letterSpacing: 0.8,
                  animation: 'offerShine 2s ease-in-out infinite',
                }}
              >
                🎉 OFFER
              </span>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: isOffer ? '#d97706' : '#64748b' }}>{display}</div>
            <div style={{ fontSize: 10, color: isOffer ? '#f59e0b' : '#94a3b8' }}>{time}</div>
          </div>
        </div>

        <div style={{
          fontSize: 13,
          fontWeight: 800,
          color: isOffer ? '#92400e' : '#0f172a',
          marginBottom: 5,
        }}>
          {interview.company}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
          {dedupedTags.map((tag, ti) => {
            const c = tagColors[ti % tagColors.length];
            return (
              <span
                key={tag}
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '1px 7px',
                  borderRadius: 999,
                  background: c.bg,
                  color: c.color,
                  border: `1px solid ${c.border}`,
                }}
              >
                {tag}
              </span>
            );
          })}
        </div>

        <div
          style={{
            fontSize: 11,
            lineHeight: 1.58,
            color: '#334155',
            maxHeight: expanded ? 'none' : previewHeight,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ className, children, ...props }) {
                const isBlock = className?.includes('language-');
                if (isBlock) {
                  return (
                    <pre
                      style={{
                        background: '#0f172a',
                        borderRadius: 7,
                        padding: '8px 9px',
                        overflowX: 'auto',
                        fontSize: 10,
                        lineHeight: 1.5,
                        border: '1px solid rgba(148,163,184,0.25)',
                        margin: '6px 0',
                      }}
                    >
                      <code style={{ color: '#e2e8f0', fontFamily: 'monospace' }} {...props}>
                        {children}
                      </code>
                    </pre>
                  );
                }
                return (
                  <code
                    style={{
                      background: isOffer ? 'rgba(245,158,11,0.1)' : 'rgba(99,102,241,0.1)',
                      color: isOffer ? '#d97706' : '#4f46e5',
                      padding: '1px 4px',
                      borderRadius: 4,
                      fontSize: 10,
                      fontFamily: 'monospace',
                    }}
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              h2({ children }) {
                return <h2 style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', marginTop: 8, marginBottom: 3 }}>{children}</h2>;
              },
              h3({ children }) {
                return <h3 style={{ fontSize: 11, fontWeight: 700, color: '#334155', marginTop: 6, marginBottom: 3 }}>{children}</h3>;
              },
              blockquote({ children }) {
                return (
                  <blockquote
                    style={{
                      borderLeft: isOffer ? '2px solid #f59e0b' : '2px solid #93c5fd',
                      margin: '5px 0',
                      color: '#475569',
                      background: isOffer ? 'rgba(245,158,11,0.06)' : 'rgba(147,197,253,0.12)',
                      borderRadius: '0 6px 6px 0',
                      padding: '4px 8px',
                    }}
                  >
                    {children}
                  </blockquote>
                );
              },
              table({ children }) {
                return (
                  <div style={{ overflowX: 'auto', margin: '5px 0' }}>
                    <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 10 }}>{children}</table>
                  </div>
                );
              },
              th({ children }) {
                return <th style={{ background: 'rgba(148,163,184,0.16)', padding: '3px 6px', borderBottom: '1px solid rgba(148,163,184,0.3)', textAlign: 'left', fontWeight: 700 }}>{children}</th>;
              },
              td({ children }) {
                return <td style={{ padding: '3px 6px', borderBottom: '1px solid rgba(148,163,184,0.2)' }}>{children}</td>;
              },
              strong({ children }) {
                return <strong style={{ color: isOffer ? '#d97706' : '#4338ca', fontWeight: 800 }}>{children}</strong>;
              },
              li({ children }) {
                return <li style={{ marginBottom: 1 }}>{children}</li>;
              },
            }}
          >
            {normalizedContent}
          </ReactMarkdown>

          {!expanded && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 24,
                background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.96))',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewCard;
