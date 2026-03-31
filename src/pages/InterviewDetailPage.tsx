import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import gsap from 'gsap';
import interviewsRaw from '../interviews.json';
import { IInterview } from '../types/bookmark';

const interviews = interviewsRaw as IInterview[];

function parseTime(timeStr: string) {
  const [year, dateRaw, time] = timeStr.split('_');
  const month = dateRaw.slice(0, 2);
  const day = dateRaw.slice(2);
  return { display: `${year}.${month}.${day}`, time };
}

const TAG_COLORS = [
  { bg: 'rgba(255,107,158,0.1)', color: '#FF6B9E', border: 'rgba(255,107,158,0.25)' },
  { bg: 'rgba(161,196,253,0.12)', color: '#5B8FD4', border: 'rgba(161,196,253,0.3)' },
  { bg: 'rgba(197,138,255,0.1)', color: '#9B59D0', border: 'rgba(197,138,255,0.25)' },
];

const InterviewDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const pageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const interview = interviews.find((iv) => iv.id === id);

  useEffect(() => {
    gsap.fromTo(pageRef.current,
      { opacity: 0, x: 40 },
      { opacity: 1, x: 0, duration: 0.45, ease: 'power3.out' }
    );
    gsap.fromTo(contentRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, delay: 0.1, ease: 'power2.out' }
    );
  }, [id]);

  if (!interview) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#C0A090', gap: 12 }}>
        <span style={{ fontSize: 48 }}>🌸</span>
        <span style={{ fontSize: 16, fontWeight: 700 }}>面经不存在</span>
        <button onClick={() => navigate('/interviews')} style={{ color: '#FF6B9E', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>← 返回列表</button>
      </div>
    );
  }

  const { display, time } = parseTime(interview.time);
  const index = interviews.findIndex(iv => iv.id === id);

  return (
    <div ref={pageRef} style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* 顶部导航 */}
      <div style={{
        flexShrink: 0, padding: '16px 24px 0',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button
          onClick={() => navigate('/interviews')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 13, fontWeight: 700, color: '#8D6E63',
            background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,183,197,0.3)',
            borderRadius: 999, padding: '6px 14px', cursor: 'pointer',
            backdropFilter: 'blur(8px)',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#FF6B9E'; e.currentTarget.style.borderColor = 'rgba(255,107,158,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#8D6E63'; e.currentTarget.style.borderColor = 'rgba(255,183,197,0.3)'; }}
        >
          ← 返回列表
        </button>
        <div style={{ fontSize: 11, color: '#B0A090' }}>面经详情</div>
      </div>

      {/* 内容区 */}
      <div ref={contentRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 24px 24px', scrollbarWidth: 'none' }}>
        {/* 卡片头部 */}
        <div style={{
          background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)',
          borderRadius: 20, border: '1px solid rgba(255,183,197,0.25)',
          overflow: 'hidden', marginBottom: 16,
        }}>
          <div style={{
            height: 6,
            background: `linear-gradient(90deg, hsl(${340 - index * 25},80%,65%), hsl(${220 + index * 20},75%,70%))`,
          }} />
          <div style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#3D2B1F', marginBottom: 4 }}>
                  {interview.company}
                </div>
                <div style={{ fontSize: 14, color: '#8D6E63' }}>{interview.department}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#8D6E63' }}>{display}</div>
                <div style={{ fontSize: 12, color: '#B09080' }}>{time}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {interview.tags.map((tag, ti) => {
                const c = TAG_COLORS[ti % TAG_COLORS.length];
                return (
                  <span key={tag} style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 11px', borderRadius: 999,
                    background: c.bg, color: c.color, border: `1px solid ${c.border}`,
                  }}>{tag}</span>
                );
              })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: `linear-gradient(135deg, hsl(${340 - index * 25},80%,70%), hsl(${220 + index * 20},75%,75%))`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, color: '#fff', fontWeight: 800,
              }}>{interview.author[0]}</div>
              <span style={{ fontSize: 13, color: '#8D6E63', fontWeight: 600 }}>{interview.author}</span>
            </div>
          </div>
        </div>

        {/* Markdown 正文 */}
        <div style={{
          background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(16px)',
          borderRadius: 20, border: '1px solid rgba(255,183,197,0.2)',
          padding: '24px 28px', fontSize: 14, lineHeight: 1.8, color: '#4A3728',
        }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ className, children, ...props }) {
                const isBlock = className?.includes('language-');
                if (isBlock) {
                  return (
                    <pre style={{
                      background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                      borderRadius: 12, padding: '16px 18px', overflowX: 'auto',
                      fontSize: 13, lineHeight: 1.65,
                      border: '1px solid rgba(255,183,197,0.15)', margin: '12px 0',
                    }}>
                      <code style={{ color: '#e8d5f5', fontFamily: 'monospace' }} {...props}>{children}</code>
                    </pre>
                  );
                }
                return <code style={{ background: 'rgba(255,107,158,0.08)', color: '#c058a0', padding: '2px 7px', borderRadius: 5, fontSize: 13, fontFamily: 'monospace', border: '1px solid rgba(255,107,158,0.15)' }} {...props}>{children}</code>;
              },
              h2({ children }) {
                return <h2 style={{ fontSize: 18, fontWeight: 800, color: '#3D2B1F', marginTop: 20, marginBottom: 8, borderBottom: '2px solid rgba(255,183,197,0.3)', paddingBottom: 6 }}>{children}</h2>;
              },
              h3({ children }) {
                return <h3 style={{ fontSize: 15, fontWeight: 700, color: '#5D3A28', marginTop: 14, marginBottom: 6 }}>{children}</h3>;
              },
              blockquote({ children }) {
                return <blockquote style={{ borderLeft: '4px solid #FFB7C5', paddingLeft: 14, margin: '12px 0', color: '#8D6E63', fontStyle: 'italic', background: 'rgba(255,183,197,0.06)', borderRadius: '0 10px 10px 0', padding: '8px 14px' }}>{children}</blockquote>;
              },
              table({ children }) {
                return <div style={{ overflowX: 'auto', margin: '12px 0' }}><table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>{children}</table></div>;
              },
              th({ children }) {
                return <th style={{ background: 'rgba(255,183,197,0.15)', padding: '7px 12px', borderBottom: '2px solid rgba(255,183,197,0.3)', textAlign: 'left', fontWeight: 700 }}>{children}</th>;
              },
              td({ children }) {
                return <td style={{ padding: '7px 12px', borderBottom: '1px solid rgba(255,183,197,0.15)' }}>{children}</td>;
              },
              strong({ children }) {
                return <strong style={{ color: '#E05080', fontWeight: 800 }}>{children}</strong>;
              },
            }}
          >
            {interview.content}
          </ReactMarkdown>
        </div>

        {/* 上一篇 / 下一篇 */}
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          {index > 0 && (
            <button
              onClick={() => navigate(`/interviews/${interviews[index - 1].id}`)}
              style={{
                flex: 1, padding: '12px 16px', borderRadius: 14,
                background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,183,197,0.3)',
                color: '#8D6E63', fontSize: 13, fontWeight: 700, cursor: 'pointer', textAlign: 'left',
                backdropFilter: 'blur(8px)',
              }}
            >
              ← {interviews[index - 1].company} · {interviews[index - 1].department.split(' - ')[1]}
            </button>
          )}
          {index < interviews.length - 1 && (
            <button
              onClick={() => navigate(`/interviews/${interviews[index + 1].id}`)}
              style={{
                flex: 1, padding: '12px 16px', borderRadius: 14,
                background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,183,197,0.3)',
                color: '#8D6E63', fontSize: 13, fontWeight: 700, cursor: 'pointer', textAlign: 'right',
                backdropFilter: 'blur(8px)',
              }}
            >
              {interviews[index + 1].company} · {interviews[index + 1].department.split(' - ')[1]} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewDetailPage;
