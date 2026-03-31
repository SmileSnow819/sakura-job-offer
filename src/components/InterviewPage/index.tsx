import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import interviewsRaw from '../../interviews.json';
import { IInterview } from '../../types/bookmark';
import InterviewTimeline from '../InterviewTimeline';
import InterviewCard from '../InterviewCard';

const interviews = interviewsRaw as IInterview[];

function parseDate(timeStr: string) {
  const [year, dateRaw] = timeStr.split('_');
  const month = dateRaw.slice(0, 2);
  const day = dateRaw.slice(2);
  return `${year}-${month}-${day}`;
}

const InterviewPage: React.FC = () => {
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const col1Ref = useRef<HTMLDivElement>(null);
  const col2Ref = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // 按日期筛选
  const filtered = activeDate
    ? interviews.filter((iv) => parseDate(iv.time) === activeDate)
    : interviews;

  // 瀑布流：奇偶分两列
  const col1 = filtered.filter((_, i) => i % 2 === 0);
  const col2 = filtered.filter((_, i) => i % 2 === 1);

  // 进场动画
  useEffect(() => {
    gsap.fromTo(headerRef.current,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }
    );
  }, []);

  // 切换筛选时卡片重新入场
  useEffect(() => {
    const cols = [col1Ref.current, col2Ref.current];
    gsap.fromTo(cols,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power3.out' }
    );
  }, [activeDate]);

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* 页面头部 */}
      <div ref={headerRef} style={{ padding: '20px 24px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #FF6B9E, #c58aff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, boxShadow: '0 4px 12px rgba(255,107,158,0.3)',
          }}>📝</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#3D2B1F', letterSpacing: 0.5 }}>
              面经分享
            </div>
            <div style={{ fontSize: 12, color: '#A08070', marginTop: 1 }}>
              {interviews.length} 篇真实面经 · 点击时间轴筛选日期
            </div>
          </div>
          {activeDate && (
            <button
              onClick={() => setActiveDate(null)}
              style={{
                marginLeft: 'auto',
                fontSize: 11, fontWeight: 700,
                color: '#FF6B9E', background: 'rgba(255,107,158,0.1)',
                border: '1px solid rgba(255,107,158,0.25)',
                borderRadius: 999, padding: '4px 14px', cursor: 'pointer',
              }}
            >
              清除筛选 ×
            </button>
          )}
        </div>
      </div>

      {/* 时间轴 */}
      <div style={{ padding: '16px 24px 0', flexShrink: 0 }}>
        <InterviewTimeline
          interviews={interviews}
          activeDate={activeDate}
          onDateClick={(d) => setActiveDate(prev => prev === d ? null : d)}
        />
      </div>

      {/* 瀑布流卡片区 */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '0 24px 24px',
        scrollbarWidth: 'none',
      }}>
        <style>{`.interview-scroll::-webkit-scrollbar { display: none; }`}</style>
        {filtered.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: 200, color: '#C0A090',
            fontSize: 14, gap: 8,
          }}>
            <span style={{ fontSize: 36 }}>🌸</span>
            <span>暂无该日期的面经</span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
            <div ref={col1Ref}>
              {col1.map((iv, i) => (
                <InterviewCard key={iv.id} interview={iv} index={i * 2} />
              ))}
            </div>
            <div ref={col2Ref}>
              {col2.map((iv, i) => (
                <InterviewCard key={iv.id} interview={iv} index={i * 2 + 1} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewPage;
