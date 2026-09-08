import React, { useCallback, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import gsap from 'gsap';

import styles from './index.module.css';
import {
  BACKGROUND_MARQUEE_ROWS,
  ENTRY_ARTWORK,
  JOURNAL_CARD_REVEAL_ORDER,
  JOURNAL_EXIT_START_SECONDS,
  JOURNAL_INTRO_DURATION_SECONDS,
  JOURNAL_PAGE_REVEAL_SECONDS,
  MARQUEE_DURATION_SECONDS,
} from '../../utils/launchArtwork.ts';

interface ILoadingScreenProps {
  onComplete: () => void;
  onExitStart: () => void;
  onRevealStart: () => void;
}

/** 首次访问的品牌开场：以樱花书签串起五个功能入口。 */
const LoadingScreen: React.FC<ILoadingScreenProps> = ({
  onComplete,
  onExitStart,
  onRevealStart,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sealRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const mainArtworkRef = useRef<HTMLElement>(null);
  const floatingArtworkRefs = useRef<(HTMLElement | null)[]>([]);
  const bloomRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const completedRef = useRef(false);
  const exitStartedRef = useRef(false);
  const revealStartedRef = useRef(false);

  const startExit = useCallback(() => {
    if (exitStartedRef.current) return;
    exitStartedRef.current = true;
    onExitStart();
  }, [onExitStart]);

  const startReveal = useCallback(() => {
    if (revealStartedRef.current) return;
    revealStartedRef.current = true;
    onRevealStart();
  }, [onRevealStart]);

  const complete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [onComplete]);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    const container = containerRef.current;
    if (!container) {
      complete();
      return;
    }
    gsap.to(container, { opacity: 0, duration: 0.36, ease: 'power2.in', onComplete: complete });
  }, [complete]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const timer = window.setTimeout(finish, 900);
      return () => window.clearTimeout(timer);
    }

    const timeline = gsap.timeline({ onComplete: complete });
    const cards = [mainArtworkRef.current, ...floatingArtworkRefs.current];
    const captions = cards.map((card) => card?.querySelector('figcaption') ?? null);
    gsap.set([sealRef.current, copyRef.current], { opacity: 0, y: 22 });
    gsap.set(containerRef.current, {
      clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
      opacity: 1,
    });
    gsap.set(stageRef.current, { perspective: 1100 });
    gsap.set(cards, { opacity: 0, transformStyle: 'preserve-3d' });
    gsap.set(captions, { opacity: 0, y: 8 });
    gsap.set(bloomRefs.current, { opacity: 0, scale: 0, rotate: -24 });
    timeline
      .to(bloomRefs.current, {
        opacity: 1,
        scale: 1,
        rotate: 0,
        duration: 0.55,
        stagger: 0.07,
        ease: 'back.out(1.8)',
      })
      .to(sealRef.current, { opacity: 1, y: 0, duration: 0.5, ease: 'power4.out' }, 0.2)
      .to(copyRef.current, { opacity: 1, y: 0, duration: 0.58, ease: 'power3.out' }, 0.42);

    JOURNAL_CARD_REVEAL_ORDER.forEach((cardIndex, revealIndex) => {
      const card = cards[cardIndex];
      const caption = captions[cardIndex];
      const isLeft = cardIndex === 1 || cardIndex === 3;
      const isMain = cardIndex === 0;
      const settledRotations = [0, -10, 9, 7, -7];
      const startTime = 0.92 + revealIndex * 0.38;
      timeline.fromTo(
        card,
        {
          opacity: 0,
          x: isMain ? 0 : isLeft ? -48 : 48,
          y: isMain ? 38 : 24,
          rotateX: isMain ? -18 : 8,
          rotateY: isMain ? 0 : isLeft ? 72 : -72,
          rotateZ: isMain ? -4 : isLeft ? -9 : 9,
          scale: isMain ? 0.88 : 0.82,
          filter: 'blur(7px)',
          transformOrigin: isLeft ? 'left center' : 'right center',
        },
        {
          opacity: 1,
          x: 0,
          y: 0,
          rotateX: 0,
          rotateY: 0,
          rotateZ: settledRotations[cardIndex],
          scale: 1,
          filter: 'blur(0px)',
          duration: isMain ? 0.82 : 0.7,
          ease: 'back.out(1.35)',
        },
        startTime,
      );
      if (caption) {
        timeline.to(
          caption,
          { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out' },
          startTime + 0.42,
        );
      }
    });

    timeline
      .call(startExit, [], JOURNAL_EXIT_START_SECONDS)
      .to(
        stageRef.current,
        {
          rotateX: 5,
          rotateY: -12,
          x: -28,
          y: -14,
          scale: 0.975,
          duration: 0.45,
          ease: 'power2.inOut',
        },
        JOURNAL_EXIT_START_SECONDS,
      )
      .call(startReveal, [], JOURNAL_PAGE_REVEAL_SECONDS)
      .to(
        containerRef.current,
        {
          clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)',
          duration: JOURNAL_INTRO_DURATION_SECONDS - JOURNAL_EXIT_START_SECONDS,
          ease: 'power3.inOut',
        },
        JOURNAL_EXIT_START_SECONDS,
      );
    return () => timeline.kill();
  }, [complete, finish, startExit, startReveal]);

  const blooms = [
    { top: '13%', left: '12%', size: 34 },
    { top: '20%', left: '82%', size: 25 },
    { top: '72%', left: '8%', size: 22 },
    { top: '77%', left: '88%', size: 38 },
    { top: '48%', left: '93%', size: 17 },
  ];

  return (
    <section
      ref={containerRef}
      className={styles.screen}
      style={{ '--marquee-duration': `${MARQUEE_DURATION_SECONDS}s` } as React.CSSProperties}
      aria-label="Sakura Job Offer 品牌开场"
    >
      <div className={styles.halo} aria-hidden="true" />
      <div className={styles.grain} aria-hidden="true" />
      <div className={styles.marquees} aria-hidden="true">
        {BACKGROUND_MARQUEE_ROWS.map(({ direction, words }, index) => (
          <div key={index} className={`${styles.marqueeRow} ${styles[`row${index + 1}`]}`}>
            <div
              className={`${styles.marqueeTrack} ${direction === 'left' ? styles.toLeft : styles.toRight}`}
            >
              {[...words, ...words].map((word, wordIndex) => (
                <span key={`${word}-${wordIndex}`}>{word}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      {blooms.map((bloom, index) => (
        <span
          key={index}
          ref={(element) => {
            bloomRefs.current[index] = element;
          }}
          className={styles.bloom}
          style={{ top: bloom.top, left: bloom.left, width: bloom.size, height: bloom.size }}
          aria-hidden="true"
        />
      ))}
      <div className={styles.content}>
        <div ref={sealRef} className={styles.seal}>
          <Sparkles size={27} strokeWidth={1.8} />
          <span>SAKURA</span>
        </div>
        <div ref={copyRef} className={styles.copy}>
          <p>让每一次投递，都有清楚的去处</p>
          <h1>Sakura Job Offer</h1>
        </div>
        <div ref={stageRef} className={styles.artworkStage}>
          <div className={styles.mainArtworkSlot}>
            <figure ref={mainArtworkRef} className={styles.mainArtwork}>
              <img src={ENTRY_ARTWORK[0].src} alt="" />
              <figcaption>{ENTRY_ARTWORK[0].label}</figcaption>
            </figure>
          </div>
          <div className={styles.floatingArtwork} aria-hidden="true">
            {ENTRY_ARTWORK.slice(1).map(({ id, label, src }, index) => (
              <figure
                key={id}
                ref={(element) => {
                  floatingArtworkRefs.current[index] = element;
                }}
              >
                <img src={src} alt="" />
                <figcaption>{label}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
      <button type="button" className={styles.skip} onClick={finish}>
        跳过开场
      </button>
    </section>
  );
};

export default LoadingScreen;
