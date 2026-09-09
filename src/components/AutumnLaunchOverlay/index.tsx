import React, { useCallback, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import gsap from 'gsap';

import styles from './index.module.css';
import {
  getAutumnArtwork,
  LAUNCH_EXIT_MOTION,
  LAUNCH_HERO_SRC,
} from '../../utils/launchArtwork.ts';

interface IAutumnLaunchOverlayProps {
  active: boolean;
  onComplete: () => void;
  onRevealStart: () => void;
}

/** 品牌开场的第二幕：沿用书签与樱花构图，将注意力收束到秋招专场。 */
const AutumnLaunchOverlay: React.FC<IAutumnLaunchOverlayProps> = ({
  active,
  onComplete,
  onRevealStart,
}) => {
  const overlayRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const entranceTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const exitTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const completedRef = useRef(false);
  const exitStartedRef = useRef(false);
  const revealStartedRef = useRef(false);
  const autumnArtwork = getAutumnArtwork();

  const complete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [onComplete]);

  const startReveal = useCallback(() => {
    if (revealStartedRef.current) return;
    revealStartedRef.current = true;
    onRevealStart();
  }, [onRevealStart]);

  const startExit = useCallback(() => {
    if (exitStartedRef.current) return;
    exitStartedRef.current = true;
    entranceTimelineRef.current?.kill();

    const overlay = overlayRef.current;
    if (!overlay) {
      startReveal();
      complete();
      return;
    }

    const timeline = gsap.timeline({ onComplete: complete });
    exitTimelineRef.current = timeline;
    timeline
      .to(
        cardRef.current,
        {
          rotateX: 5,
          rotateY: -12,
          x: -28,
          y: -14,
          scale: 0.975,
          duration: 0.45,
          ease: 'power2.inOut',
        },
        0,
      )
      .call(startReveal, [], LAUNCH_EXIT_MOTION.revealDelaySeconds)
      .to(
        overlay,
        {
          clipPath: LAUNCH_EXIT_MOTION.clipPath,
          duration: LAUNCH_EXIT_MOTION.durationSeconds,
          ease: LAUNCH_EXIT_MOTION.ease,
        },
        0,
      );
  }, [complete, startReveal]);

  useEffect(() => {
    if (!active) {
      // 预挂载阶段只露出第二幕背景，正式切换后再启动卡片与文案。
      gsap.set(overlayRef.current, {
        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
        opacity: 1,
      });
      gsap.set([cardRef.current, copyRef.current], { opacity: 0, y: 20 });
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const timer = window.setTimeout(startExit, 900);
      return () => window.clearTimeout(timer);
    }
    const timeline = gsap.timeline({ onComplete: startExit });
    entranceTimelineRef.current = timeline;
    gsap.set(overlayRef.current, {
      clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
      opacity: 1,
    });
    gsap.set(cardRef.current, { perspective: 1100, transformStyle: 'preserve-3d' });
    gsap.set([cardRef.current, copyRef.current], { opacity: 0, y: 20 });
    timeline
      .to(overlayRef.current, { opacity: 1, duration: 0.22, ease: 'power2.out' })
      .to(cardRef.current, { opacity: 1, y: 0, duration: 0.56, ease: 'power4.out' }, '<0.05')
      .to(copyRef.current, { opacity: 1, y: 0, duration: 0.42, ease: 'power3.out' }, '<0.14')
      .to(cardRef.current, {
        scale: 1.025,
        duration: 0.38,
        repeat: 1,
        yoyo: true,
        ease: 'sine.inOut',
      })
      .to({}, { duration: 0.55 });
    return () => {
      timeline.kill();
      exitTimelineRef.current?.kill();
    };
  }, [active, startExit]);

  const handleSkip = useCallback(() => startExit(), [startExit]);

  return (
    <section
      ref={overlayRef}
      className={styles.overlay}
      style={{ '--launch-hero-image': `url("${LAUNCH_HERO_SRC}")` } as React.CSSProperties}
      aria-label="秋招专场开场"
    >
      <span className={`${styles.bloom} ${styles.bloomOne}`} aria-hidden="true" />
      <span className={`${styles.bloom} ${styles.bloomTwo}`} aria-hidden="true" />
      <div ref={cardRef} className={styles.card}>
        <img className={styles.artwork} src={autumnArtwork.src} alt="" />
        <div ref={copyRef}>
          <span className={styles.eyebrow}>
            <Sparkles size={13} /> AUTUMN LETTER
          </span>
          <h1>秋招专场</h1>
          <p>从这一页，开启你的下一段旅程</p>
        </div>
      </div>
      <button type="button" className={styles.skip} onClick={handleSkip}>
        跳过开场
      </button>
    </section>
  );
};

export default AutumnLaunchOverlay;
