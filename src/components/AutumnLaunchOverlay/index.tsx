import React, { useEffect, useRef } from 'react';
import { CalendarDays, Sparkles } from 'lucide-react';
import gsap from 'gsap';

interface IAutumnLaunchOverlayProps {
  onComplete: () => void;
}

const AutumnLaunchOverlay: React.FC<IAutumnLaunchOverlayProps> = ({ onComplete }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const bloomRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const iconRef = useRef<HTMLSpanElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const shimmerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      const timer = window.setTimeout(onComplete, 900);
      return () => window.clearTimeout(timer);
    }

    const timeline = gsap.timeline({
      onComplete: () => {
        gsap.to(overlay, { opacity: 0, duration: 0.38, ease: 'power2.in', onComplete });
      },
    });

    gsap.set([iconRef.current, titleRef.current, subtitleRef.current, lineRef.current], {
      opacity: 0,
    });
    gsap.set(bloomRefs.current, { opacity: 0, scale: 0, rotate: -30 });
    timeline
      .to(overlay, { opacity: 1, duration: 0.24, ease: 'power2.out' })
      .to(
        bloomRefs.current,
        { opacity: 1, scale: 1, rotate: 0, duration: 0.5, stagger: 0.06, ease: 'back.out(2.2)' },
        '<0.05',
      )
      .to(iconRef.current, { opacity: 1, scale: 1, duration: 0.42, ease: 'back.out(2.4)' }, '<0.12')
      .fromTo(
        titleRef.current,
        { clipPath: 'inset(0 100% 0 0)', y: 18 },
        { opacity: 1, clipPath: 'inset(0 0% 0 0)', y: 0, duration: 0.64, ease: 'power4.out' },
        '<0.12',
      )
      .to(lineRef.current, { opacity: 1, width: 116, duration: 0.38, ease: 'power3.out' }, '<0.2')
      .fromTo(
        subtitleRef.current,
        { y: 12 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' },
        '<0.08',
      )
      .fromTo(
        shimmerRef.current,
        { xPercent: -150, opacity: 0 },
        { xPercent: 170, opacity: 0.9, duration: 0.75, ease: 'power2.inOut' },
        '<0.05',
      )
      .to(shimmerRef.current, { opacity: 0, duration: 0.1 })
      .to({}, { duration: 1.15 });

    return () => timeline.kill();
  }, [onComplete]);

  const blooms = [
    { left: '13%', top: '18%', size: 30, delay: 0 },
    { left: '25%', top: '69%', size: 18, delay: 0 },
    { left: '78%', top: '22%', size: 25, delay: 0 },
    { left: '86%', top: '67%', size: 35, delay: 0 },
    { left: '63%', top: '77%', size: 16, delay: 0 },
  ];

  return (
    <div
      ref={overlayRef}
      aria-live="polite"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 35,
        opacity: 0,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background:
          'linear-gradient(135deg, rgba(255,237,246,0.94), rgba(234,244,255,0.92) 52%, rgba(255,228,240,0.94))',
        backdropFilter: 'blur(22px) saturate(1.18)',
        WebkitBackdropFilter: 'blur(22px) saturate(1.18)',
      }}
    >
      {blooms.map((bloom, index) => (
        <span
          key={index}
          ref={(element) => {
            bloomRefs.current[index] = element;
          }}
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: bloom.left,
            top: bloom.top,
            width: bloom.size,
            height: bloom.size,
            borderRadius: '55% 45% 55% 45%',
            transform: 'rotate(45deg)',
            background: index % 2 === 0 ? 'rgba(255,107,158,0.42)' : 'rgba(161,196,253,0.5)',
            boxShadow:
              index % 2 === 0
                ? '0 0 24px rgba(255,107,158,0.22)'
                : '0 0 24px rgba(161,196,253,0.26)',
          }}
        />
      ))}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '32px 28px 116px',
          textAlign: 'center',
        }}
      >
        <span
          ref={iconRef}
          style={{
            width: 72,
            height: 72,
            marginBottom: 20,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 23,
            color: 'white',
            background: 'linear-gradient(135deg, var(--pink-400), var(--blue-400))',
            boxShadow: '0 14px 34px rgba(255,107,158,0.27)',
          }}
        >
          <CalendarDays size={31} />
        </span>
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <span
            ref={shimmerRef}
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: -18,
              bottom: -18,
              left: 0,
              width: 48,
              background:
                'linear-gradient(100deg, transparent, rgba(255,255,255,0.98), transparent)',
              transform: 'skewX(-20deg)',
            }}
          />
          <h1
            ref={titleRef}
            style={{
              margin: 0,
              color: 'var(--neutral-800)',
              fontSize: 'clamp(1.7rem, 5vw, 3rem)',
              fontWeight: 900,
              letterSpacing: 0,
              lineHeight: 1.2,
            }}
          >
            秋招专场现已上线
          </h1>
        </div>
        <div
          ref={lineRef}
          style={{
            width: 0,
            height: 2,
            margin: '17px 0 15px',
            borderRadius: 999,
            background: 'linear-gradient(90deg, var(--pink-400), var(--blue-400))',
          }}
        />
        <p
          ref={subtitleRef}
          style={{ margin: 0, color: 'var(--neutral-700)', fontSize: 14, fontWeight: 700 }}
        >
          每天自动更新秋招公司
        </p>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 18,
            color: 'var(--pink-500)',
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          <Sparkles size={14} /> LIVE UPDATE
        </span>
      </div>
    </div>
  );
};

export default AutumnLaunchOverlay;
