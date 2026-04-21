import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface ILoadingScreenProps {
  onComplete: () => void;
}

const TITLE = 'Sakura · job offer';
const SUBTITLE = '精心整理的校招春招资源，为你助力';
const TAGS = ['春招', '秋招', '实习', 'Offer'];

const LoadingScreen: React.FC<ILoadingScreenProps> = ({ onComplete }) => {
  const [canSkip, setCanSkip] = React.useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sakuraRefs = useRef<(HTMLDivElement | null)[]>([]);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const subCharRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const tagRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const sparkleRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const orbitRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const skipTimer = setTimeout(() => setCanSkip(true), 1500);
    const tl = gsap.timeline();

    gsap.set([emojiRef.current, progressBarRef.current], { opacity: 0, y: 24 });
    gsap.set(charRefs.current, { opacity: 0, y: 50, rotateX: 90 });
    gsap.set(subCharRefs.current, { opacity: 0, y: 20, scale: 0.7 });
    gsap.set(tagRefs.current, { opacity: 0, x: -30, scale: 0.8 });
    gsap.set(sakuraRefs.current, { opacity: 0, scale: 0 });
    gsap.set(sparkleRefs.current, { opacity: 0, scale: 0 });
    gsap.set(dotRefs.current, { opacity: 0 });

    tl.to(sakuraRefs.current, { opacity: 1, scale: 1, stagger: 0.055, duration: 0.45, ease: 'back.out(1.6)' })
      .to(emojiRef.current, { opacity: 1, y: 0, duration: 0.5, ease: 'back.out(2.5)' }, '-=0.15')
      .to(dotRefs.current, { opacity: 1, stagger: 0.04, duration: 0.3, ease: 'power2.out' }, '-=0.2')
      .to(orbitRef.current, { rotation: 360, duration: 4, ease: 'none', repeat: -1 }, '<')
      .to(charRefs.current, { opacity: 1, y: 0, rotateX: 0, stagger: 0.038, duration: 0.5, ease: 'back.out(1.8)', transformOrigin: '50% 50%' }, '-=3.5')
      .to(subCharRefs.current, { opacity: 1, y: 0, scale: 1, stagger: 0.03, duration: 0.28, ease: 'back.out(2)' }, '-=0.1')
      .to(tagRefs.current, { opacity: 1, x: 0, scale: 1, stagger: 0.08, duration: 0.38, ease: 'back.out(2)' }, '-=0.2')
      .to(progressBarRef.current, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, '-=0.1')
      .to(progressBarRef.current?.querySelector('.bar-fill') ?? null, { width: '100%', duration: 1.5, ease: 'power1.inOut' })
      .to(sparkleRefs.current, { opacity: 1, scale: 1, stagger: 0.07, duration: 0.28, ease: 'back.out(2)' }, '-=1.1')
      .to(sparkleRefs.current, { opacity: 0, scale: 0, stagger: 0.05, duration: 0.22, ease: 'power2.in' }, '-=0.55')
      .to(sakuraRefs.current, { y: 80, opacity: 0, stagger: 0.03, duration: 0.38, ease: 'power2.in' }, '-=0.2')
      .to(containerRef.current, { opacity: 0, scale: 0.97, duration: 0.42, ease: 'power2.in', onComplete }, '-=0.08');

    return () => {
      tl.kill();
      clearTimeout(skipTimer);
    };
  }, [onComplete]);

  // ── 静态数据 ─────────────────────────────────────────────────────────────────

  const petals = [
    { top: '10%', left: '14%', size: 44, rotate: 20 },
    { top: '6%',  left: '52%', size: 36, rotate: -18 },
    { top: '18%', left: '82%', size: 50, rotate: 42 },
    { top: '68%', left: '8%',  size: 38, rotate: -28 },
    { top: '78%', left: '74%', size: 46, rotate: 60 },
    { top: '52%', left: '90%', size: 32, rotate: -8 },
    { top: '38%', left: '4%',  size: 36, rotate: 75 },
    { top: '88%', left: '40%', size: 42, rotate: -52 },
    { top: '30%', left: '94%', size: 28, rotate: 30 },
    { top: '82%', left: '22%', size: 34, rotate: -40 },
  ];

  const orbitDots = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * 360;
    const rad = (angle * Math.PI) / 180;
    const r = 72;
    return { x: Math.cos(rad) * r, y: Math.sin(rad) * r };
  });

  const sparklePositions = [
    { top: '28%', left: '28%' }, { top: '22%', left: '64%' },
    { top: '62%', left: '20%' }, { top: '68%', left: '70%' },
    { top: '42%', left: '84%' }, { top: '48%', left: '10%' },
    { top: '15%', left: '44%' }, { top: '78%', left: '55%' },
  ];

  const MARQUEE_WORDS = ['上岸', 'Offer', 'OC', 'Dream Job', '意向书'];
  const ROW_THEMES = [
    { color: '#FF6B9E', stroke: '#FFB7C5' },
    { color: '#a1c4fd', stroke: '#6B9ADE' },
    { color: '#c58aff', stroke: '#9B59D0' },
    { color: '#FFD700', stroke: '#E6A800' },
    { color: '#FF6B9E', stroke: '#FFB7C5' },
    { color: '#a1c4fd', stroke: '#6B9ADE' },
    { color: '#ff9eb5', stroke: '#FF6B9E' },
  ];
  const marqueeRows = Array.from({ length: 3 }, (_, row) => ({
    row,
    dir: row % 2 === 0 ? 1 : -1,
    speed: 4 + row * 1.2,
    fontSize: 100 + (row % 2) * 18,
    theme: ROW_THEMES[row % ROW_THEMES.length],
    words: Array.from({ length: 10 }, (__, k) => MARQUEE_WORDS[(row * 2 + k) % MARQUEE_WORDS.length]),
    top: `${15 + row * 32}%`,
  }));

  // ── JSX ──────────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'linear-gradient(135deg, #fff0f5 0%, #e8f0ff 45%, #ffe0ef 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* ── 跑马灯背景层（zIndex:0，在内容后面） ── */}
      <style>{`
        @keyframes marqueeL { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes marqueeR { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
      `}</style>
      {marqueeRows.map((r) => (
        <div
          key={r.row}
          style={{
            position: 'absolute', top: r.top, left: 0, width: '100%',
            overflow: 'hidden', pointerEvents: 'none', lineHeight: 1.1, zIndex: 0,
          }}
        >
          <div style={{
            display: 'inline-flex', whiteSpace: 'nowrap',
            animation: `${r.dir === 1 ? 'marqueeL' : 'marqueeR'} ${r.speed}s linear infinite`,
            willChange: 'transform',
          }}>
            {[0, 1].map((pass) => (
              <span key={pass} style={{ display: 'inline-flex', gap: '0.6em', paddingRight: '0.6em' }}>
                {r.words.map((word, wi) => (
                  <span
                    key={wi}
                    style={{
                      fontSize: r.fontSize, fontWeight: 900,
                      color: wi % 3 === 1 ? 'transparent' : (wi % 3 === 0 ? r.theme.color : r.theme.color + 'cc'),
                      WebkitTextStroke: wi % 3 === 1 ? `2px ${r.theme.stroke}` : '0px transparent',
                      letterSpacing: '0.04em', opacity: 0.45,
                      textShadow: wi % 3 === 0 ? `0 0 18px ${r.theme.color}55` : 'none',
                      userSelect: 'none', paddingRight: '0.5em',
                    }}
                  >{word}</span>
                ))}
              </span>
            ))}
          </div>
        </div>
      ))}

      {/* ── 磨砂遮罩（zIndex:1，隔开跑马灯与内容） ── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: 'rgba(255,245,250,0.18)',
        backdropFilter: 'blur(1px)',
        WebkitBackdropFilter: 'blur(1px)',
        pointerEvents: 'none',
      }} />

      {/* ── 背景花瓣（absolute，zIndex:2） ── */}
      {petals.map((p, i) => (
        <div
          key={i}
          ref={(el) => { sakuraRefs.current[i] = el; }}
          style={{ position: 'absolute', top: p.top, left: p.left, transform: `rotate(${p.rotate}deg)`, zIndex: 2 }}
        >
          <svg viewBox="0 0 100 100" width={p.size} height={p.size} fill="none">
            {[0, 72, 144, 216, 288].map((rot, j) => (
              <ellipse key={j} cx="50" cy="30" rx="18" ry="28"
                fill={`rgba(255,183,197,${0.4 + j * 0.03})`}
                transform={`rotate(${rot} 50 50)`} />
            ))}
            <circle cx="50" cy="50" r="8" fill="rgba(255,220,230,0.9)" />
          </svg>
        </div>
      ))}

      {/* ── 闪光粒子（zIndex:1） ── */}
      {sparklePositions.map((s, i) => (
        <span
          key={i}
          ref={(el) => { sparkleRefs.current[i] = el; }}
          style={{
            position: 'absolute', top: s.top, left: s.left, zIndex: 2,
            fontSize: i % 3 === 0 ? 22 : 16,
            color: i % 2 === 0 ? '#FFB7C5' : '#a1c4fd',
            lineHeight: 1, display: 'block', transformOrigin: 'center',
          }}
        >✦</span>
      ))}

      {/* ── 中心内容（zIndex:2，永远在跑马灯前面） ── */}
      <div style={{ position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* 轨道圆点系统 */}
        <div style={{ position: 'relative', width: 180, height: 180, marginBottom: 8, flexShrink: 0 }}>
          <div style={{ position: 'absolute', inset: 4, borderRadius: '50%', border: '1.5px dashed rgba(255,183,197,0.3)' }} />
          <div ref={orbitRef} style={{ position: 'absolute', inset: 0 }}>
            {orbitDots.map((dot, i) => (
              <div
                key={i}
                ref={(el) => { dotRefs.current[i] = el; }}
                style={{
                  position: 'absolute',
                  width: i % 3 === 0 ? 8 : 5,
                  height: i % 3 === 0 ? 8 : 5,
                  borderRadius: '50%',
                  background: i % 2 === 0
                    ? `rgba(255,107,158,${0.5 + (i % 4) * 0.12})`
                    : `rgba(161,196,253,${0.5 + (i % 4) * 0.12})`,
                  left: '50%', top: '50%',
                  transform: `translate(calc(-50% + ${dot.x}px), calc(-50% + ${dot.y}px))`,
                  boxShadow: i % 3 === 0 ? '0 0 6px rgba(255,107,158,0.6)' : 'none',
                }}
              />
            ))}
          </div>
          <div
            ref={emojiRef}
            style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, lineHeight: 1 }}
          >🌸</div>
        </div>

        {/* 主标题 */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 0, marginBottom: 10, perspective: 600 }}>
          {TITLE.split('').map((ch, i) => (
            <span
              key={i}
              ref={(el) => { charRefs.current[i] = el; }}
              style={{
                display: 'inline-block',
                fontSize: ch === ' ' ? 14 : (ch === '·' ? 32 : 34),
                fontWeight: 900, letterSpacing: 1,
                background: `linear-gradient(135deg, hsl(${340 + i * 8},90%,65%) 0%, hsl(${200 + i * 6},85%,68%) 100%)`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                transformOrigin: '50% 100%', lineHeight: 1.2,
                minWidth: ch === ' ' ? 10 : undefined,
              }}
            >{ch === ' ' ? '\u00A0' : ch}</span>
          ))}
        </div>

        {/* 副标题 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
          {SUBTITLE.split('').map((ch, i) => (
            <span
              key={i}
              ref={(el) => { subCharRefs.current[i] = el; }}
              style={{ display: 'inline-block', fontSize: 15, color: '#c07888', letterSpacing: 0.5 }}
            >{ch}</span>
          ))}
          <span style={{ fontSize: 15, marginLeft: 4 }}>✨</span>
        </div>

        {/* 标签行 */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
          {TAGS.map((tag, i) => (
            <span
              key={tag}
              ref={(el) => { tagRefs.current[i] = el; }}
              style={{
                fontSize: 12, fontWeight: 700,
                padding: '4px 14px', borderRadius: 999,
                background: i % 2 === 0
                  ? 'linear-gradient(135deg, rgba(255,183,197,0.3), rgba(255,183,197,0.1))'
                  : 'linear-gradient(135deg, rgba(161,196,253,0.3), rgba(161,196,253,0.1))',
                border: `1.5px solid ${i % 2 === 0 ? 'rgba(255,183,197,0.55)' : 'rgba(161,196,253,0.55)'}`,
                color: i % 2 === 0 ? '#d06080' : '#6090d0',
                backdropFilter: 'blur(1px)',
              }}
            >{tag}</span>
          ))}
        </div>

        {/* 进度条 */}
        <div
          ref={progressBarRef}
          style={{ width: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}
        >
          <div style={{
            width: '100%', height: 7, borderRadius: 999,
            background: 'rgba(255,183,197,0.18)', border: '1px solid rgba(255,183,197,0.35)',
            overflow: 'hidden', position: 'relative',
          }}>
            <div
              className="bar-fill"
              style={{
                width: '0%', height: '100%', borderRadius: 999,
                background: 'linear-gradient(90deg, #FF6B9E, #c58aff, #a1c4fd)',
                boxShadow: '0 0 10px rgba(255,107,158,0.55)',
              }}
            />
          </div>
          <span style={{ fontSize: 12, color: '#C090A0', letterSpacing: 0.8 }}>资源加载中…</span>
        </div>

        {canSkip && (
          <button
            onClick={onComplete}
            style={{
              marginTop: 16,
              padding: '8px 20px',
              borderRadius: 999,
              border: '1.5px solid rgba(255,183,197,0.4)',
              background: 'rgba(255,255,255,0.6)',
              color: '#C090A0',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
            }}
          >
            跳过动画
          </button>
        )}

      </div>{/* end 中心内容 */}
    </div>
  );
};

export default LoadingScreen;
