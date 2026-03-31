import React, { useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import gsap from 'gsap';
import interviewsRaw from '../interviews.json';
import { IInterview } from '../types/bookmark';
import InterviewTimeline from '../components/InterviewTimeline';
import InterviewCard from '../components/InterviewCard';

const interviews = interviewsRaw as IInterview[];

function parseDate(timeStr: string) {
  const [year, dateRaw] = timeStr.split('_');
  const month = dateRaw.slice(0, 2);
  const day = dateRaw.slice(2);
  return `${year}-${month}-${day}`;
}

const HEIGHT_PATTERN = [84, 96, 112, 88, 120, 92, 106, 90, 114, 98];

const InterviewsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeDate = searchParams.get('date');
  const headerRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  const filtered = activeDate ? interviews.filter((iv) => parseDate(iv.time) === activeDate) : interviews;

  const listData = useMemo(() => {
    return filtered.map((item, i) => ({
      item,
      previewHeight: HEIGHT_PATTERN[i % HEIGHT_PATTERN.length],
    }));
  }, [filtered]);

  const leftCards = listData.filter((_, i) => i % 2 === 0);
  const rightCards = listData.filter((_, i) => i % 2 === 1);

  useEffect(() => {
    gsap.fromTo(headerRef.current, { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
  }, []);

  useEffect(() => {
    gsap.fromTo(leftRef.current?.children ?? [], { opacity: 0, x: -26, y: 12 }, { opacity: 1, x: 0, y: 0, duration: 0.34, stagger: 0.05, ease: 'power2.out' });
    gsap.fromTo(rightRef.current?.children ?? [], { opacity: 0, x: 26, y: 12 }, { opacity: 1, x: 0, y: 0, duration: 0.34, stagger: 0.05, ease: 'power2.out' });
  }, [activeDate]);

  const handleDateClick = (date: string) => {
    if (activeDate === date) {
      setSearchParams({});
    } else {
      setSearchParams({ date });
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div ref={headerRef} style={{ padding: '12px 14px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              boxShadow: '0 4px 12px rgba(79,70,229,0.28)',
            }}
          >
            📝
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#334155', letterSpacing: 0.3 }}>面经分享</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{interviews.length} 篇 · 竖向时间轴筛选</div>
          </div>
          {activeDate && (
            <button
              onClick={() => setSearchParams({})}
              style={{
                marginLeft: 'auto',
                fontSize: 11,
                fontWeight: 700,
                color: '#4f46e5',
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 999,
                padding: '4px 12px',
                cursor: 'pointer',
              }}
            >
              清除筛选 ×
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px 12px' }}>
        {listData.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: 260,
              color: '#94a3b8',
              fontSize: 14,
              gap: 8,
            }}
          >
            <span style={{ fontSize: 34 }}>🌸</span>
            <span>暂无该日期的面经</span>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0,1fr) 220px minmax(0,1fr)',
              gap: 10,
              alignItems: 'start',
            }}
          >
            <div ref={leftRef} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {leftCards.map(({ item, previewHeight }, i) => (
                <InterviewCard key={item.id} interview={item} index={i * 2} previewHeight={previewHeight} />
              ))}
            </div>

            <div style={{ position: 'sticky', top: 0, alignSelf: 'start' }}>
              <InterviewTimeline interviews={interviews} activeDate={activeDate} onDateClick={handleDateClick} />
            </div>

            <div ref={rightRef} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {rightCards.map(({ item, previewHeight }, i) => (
                <InterviewCard key={item.id} interview={item} index={i * 2 + 1} previewHeight={previewHeight} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewsPage;
