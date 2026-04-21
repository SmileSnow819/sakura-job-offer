import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import gsap from 'gsap';
import interviewsRaw from '../interviews.json';
import { IInterview } from '../types/bookmark';
import InterviewTimeline from '../components/InterviewTimeline';

const interviews = interviewsRaw as IInterview[];

function parseDate(timeStr: string) {
  const [year, dateRaw] = timeStr.split('_');
  const month = dateRaw.slice(0, 2);
  const day = dateRaw.slice(2);
  return `${year}-${month}-${day}`;
}

const InterviewsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeDate = searchParams.get('date');
  const headerRef = useRef<HTMLDivElement>(null);

  const filtered = activeDate ? interviews.filter((iv) => parseDate(iv.time) === activeDate) : interviews;

  useEffect(() => {
    gsap.fromTo(headerRef.current, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out' });
  }, []);

  const handleDateClick = (date: string) => {
    if (activeDate === date) {
      setSearchParams({});
    } else {
      setSearchParams({ date });
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div
        ref={headerRef}
        style={{
          padding: '16px 20px 12px',
          flexShrink: 0,
          borderBottom: '1px solid oklch(0.92 0.01 350 / 0.5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 900,
                color: 'oklch(0.25 0.02 350)',
                letterSpacing: -0.3,
                lineHeight: 1.2,
                fontFamily: 'var(--font-sans)',
              }}
            >
              面经时间线
            </h1>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: 12,
                fontWeight: 500,
                color: 'oklch(0.55 0.015 350)',
                letterSpacing: 0.1,
              }}
            >
              {filtered.length}/{interviews.length} 篇
            </p>
          </div>
          {activeDate && (
            <button
              onClick={() => setSearchParams({})}
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'oklch(0.50 0.15 350)',
                background: 'oklch(0.96 0.02 350)',
                border: '1px solid oklch(0.90 0.04 350)',
                borderRadius: 999,
                padding: '5px 14px',
                cursor: 'pointer',
                lineHeight: 1.4,
              }}
            >
              清除筛选
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 16px' }}>
        <InterviewTimeline interviews={filtered} activeDate={activeDate} onDateClick={handleDateClick} />
      </div>
    </div>
  );
};

export default InterviewsPage;
