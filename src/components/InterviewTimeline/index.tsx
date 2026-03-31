import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { IInterview } from '../../types/bookmark';

interface IInterviewTimelineProps {
  interviews: IInterview[];
  activeDate: string | null;
  onDateClick: (date: string) => void;
}

function parseTime(timeStr: string) {
  const [year, dateRaw, time] = timeStr.split('_');
  const month = dateRaw.slice(0, 2);
  const day = dateRaw.slice(2);
  return {
    date: `${year}-${month}-${day}`,
    display: `${month}/${day}`,
    full: `${year}.${month}.${day} ${time}`,
  };
}

const InterviewTimeline: React.FC<IInterviewTimelineProps> = ({ interviews, activeDate, onDateClick }) => {
  const lineRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const dateGroups = Array.from(
    new Map(
      interviews.map((iv) => {
        const p = parseTime(iv.time);
        return [p.date, { date: p.date, display: p.display, count: interviews.filter((i) => parseTime(i.time).date === p.date).length }];
      }),
    ).values(),
  ).sort((a, b) => a.date.localeCompare(b.date));

  useEffect(() => {
    gsap.set(lineRef.current, { scaleY: 0, transformOrigin: 'top center' });
    gsap.set(dotRefs.current, { scale: 0, opacity: 0 });
    gsap.set(itemRefs.current, { x: -12, opacity: 0 });

    const tl = gsap.timeline({ delay: 0.1 });
    tl.to(lineRef.current, { scaleY: 1, duration: 0.7, ease: 'power3.out' })
      .to(dotRefs.current, { scale: 1, opacity: 1, stagger: 0.06, duration: 0.28, ease: 'back.out(2)' }, '-=0.45')
      .to(itemRefs.current, { x: 0, opacity: 1, stagger: 0.05, duration: 0.24, ease: 'power2.out' }, '-=0.38');

    return () => tl.kill();
  }, []);

  const handleClick = (date: string, idx: number) => {
    onDateClick(date);
    const dot = dotRefs.current[idx];
    if (!dot) return;
    gsap.fromTo(dot, { scale: 1 }, { scale: 1.35, duration: 0.15, yoyo: true, repeat: 1, ease: 'power2.out' });
  };

  return (
    <div style={{ position: 'relative', padding: '8px 0', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#4f46e5',
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 999,
            padding: '3px 10px',
          }}
        >
          Timeline · {interviews.length}
        </span>
      </div>

      <div style={{ position: 'relative', padding: '4px 0' }}>
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
            background: 'linear-gradient(180deg, #6366f1 0%, #22d3ee 55%, #a78bfa 100%)',
            boxShadow: '0 0 10px rgba(99,102,241,0.24)',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
          {dateGroups.map((g, i) => {
            const isActive = activeDate === g.date;
            return (
              <div
                key={g.date}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  minHeight: 30,
                }}
              >
                <button
                  ref={(el) => {
                    dotRefs.current[i] = el;
                  }}
                  onClick={() => handleClick(g.date, i)}
                  style={{
                    width: isActive ? 16 : 12,
                    height: isActive ? 16 : 12,
                    borderRadius: '50%',
                    border: isActive ? '3px solid #4f46e5' : '2px solid #fff',
                    background: isActive ? '#6366f1' : '#22d3ee',
                    boxShadow: isActive ? '0 0 0 4px rgba(99,102,241,0.2)' : '0 2px 8px rgba(34,211,238,0.28)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    zIndex: 2,
                    padding: 0,
                  }}
                />

                <button
                  onClick={() => handleClick(g.date, i)}
                  style={{
                    border: 'none',
                    background: isActive ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.72)',
                    color: isActive ? '#4338ca' : '#475569',
                    fontSize: isActive ? 12 : 11,
                    fontWeight: isActive ? 800 : 700,
                    padding: isActive ? '4px 10px' : '3px 9px',
                    borderRadius: 999,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 4px 14px rgba(99,102,241,0.18)' : '0 2px 8px rgba(15,23,42,0.06)',
                  }}
                >
                  {g.display}
                  {g.count > 1 ? ` ×${g.count}` : ''}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default InterviewTimeline;
