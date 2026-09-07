import React, { useCallback, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import gsap from 'gsap';

import styles from './index.module.css';
import { BACKGROUND_MARQUEE_ROWS, ENTRY_ARTWORK } from '../../utils/launchArtwork.ts';

interface ILoadingScreenProps {
  onComplete: () => void;
}

/** 首次访问的品牌开场：以樱花书签串起五个功能入口。 */
const LoadingScreen: React.FC<ILoadingScreenProps> = ({ onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sealRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const mainArtworkRef = useRef<HTMLImageElement>(null);
  const floatingArtworkRefs = useRef<(HTMLImageElement | null)[]>([]);
  const bloomRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const completedRef = useRef(false);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    const container = containerRef.current;
    if (!container) {
      onComplete();
      return;
    }
    gsap.to(container, { opacity: 0, duration: 0.36, ease: 'power2.in', onComplete });
  }, [onComplete]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const timer = window.setTimeout(finish, 900);
      return () => window.clearTimeout(timer);
    }

    const timeline = gsap.timeline({ onComplete: finish });
    gsap.set([sealRef.current, copyRef.current], { opacity: 0, y: 22 });
    gsap.set(mainArtworkRef.current, { opacity: 0, y: 28, rotate: -5, scale: 0.92 });
    gsap.set(floatingArtworkRefs.current, { opacity: 0, scale: 0.78 });
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
      .to(sealRef.current, { opacity: 1, y: 0, duration: 0.58, ease: 'power4.out' }, '<0.1')
      .to(copyRef.current, { opacity: 1, y: 0, duration: 0.48, ease: 'power3.out' }, '<0.12')
      .to(
        mainArtworkRef.current,
        { opacity: 1, y: 0, rotate: 0, scale: 1, duration: 0.64, ease: 'power4.out' },
        '<0.03',
      )
      .to(
        floatingArtworkRefs.current,
        { opacity: 0.34, scale: 1, duration: 0.5, stagger: 0.08, ease: 'power3.out' },
        '<0.18',
      )
      .to({}, { duration: 0.55 });
    return () => timeline.kill();
  }, [finish]);

  const blooms = [
    { top: '13%', left: '12%', size: 34 },
    { top: '20%', left: '82%', size: 25 },
    { top: '72%', left: '8%', size: 22 },
    { top: '77%', left: '88%', size: 38 },
    { top: '48%', left: '93%', size: 17 },
  ];

  return (
    <section ref={containerRef} className={styles.screen} aria-label="Sakura Job Offer 品牌开场">
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
        <img
          ref={mainArtworkRef}
          className={styles.mainArtwork}
          src={ENTRY_ARTWORK[0].src}
          alt=""
        />
        <div className={styles.floatingArtwork} aria-hidden="true">
          {ENTRY_ARTWORK.slice(1).map(({ id, src }, index) => (
            <img
              key={id}
              ref={(element) => {
                floatingArtworkRefs.current[index] = element;
              }}
              src={src}
              alt=""
            />
          ))}
        </div>
      </div>
      <button type="button" className={styles.skip} onClick={finish}>
        跳过开场
      </button>
    </section>
  );
};

export default LoadingScreen;
