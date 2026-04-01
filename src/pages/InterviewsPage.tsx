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
      <div ref={headerRef} style={{ padding: '8px 12px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              boxShadow: '0 4px 10px rgba(79,70,229,0.2)',
            }}
          >
            📝
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#334155', letterSpacing: 0.2 }}>面经时间线</div>
            <div style={{ fontSize: 10, color: '#64748b' }}>{filtered.length}/{interviews.length} 篇</div>
          </div>
          {activeDate && (
            <button
              onClick={() => setSearchParams({})}
              style={{
                marginLeft: 'auto',
                fontSize: 10,
                fontWeight: 700,
                color: '#4f46e5',
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 999,
                padding: '3px 10px',
                cursor: 'pointer',
              }}
            >
              清除筛选 ×
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px 10px' }}>
        <InterviewTimeline interviews={filtered} activeDate={activeDate} onDateClick={handleDateClick} />
      </div>
    </div>
  );
};

export default InterviewsPage;
