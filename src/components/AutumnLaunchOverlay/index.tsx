import React, { useCallback, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import gsap from 'gsap';

import styles from './index.module.css';
import { getAutumnArtwork } from '../../utils/launchArtwork.ts';

interface IAutumnLaunchOverlayProps {
  onComplete: () => void;
}

/** 品牌开场的第二幕：沿用书签与樱花构图，将注意力收束到秋招专场。 */
const AutumnLaunchOverlay: React.FC<IAutumnLaunchOverlayProps> = ({ onComplete }) => {
  const overlayRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const completedRef = useRef(false);
  const autumnArtwork = getAutumnArtwork();

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    const overlay = overlayRef.current;
    if (!overlay) {
      onComplete();
      return;
    }
    gsap.to(overlay, { opacity: 0, duration: 0.34, ease: 'power2.in', onComplete });
  }, [onComplete]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const timer = window.setTimeout(finish, 900);
      return () => window.clearTimeout(timer);
    }
    const timeline = gsap.timeline({ onComplete: finish });
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
    return () => timeline.kill();
  }, [finish]);

  return (
    <section ref={overlayRef} className={styles.overlay} aria-label="秋招专场开场">
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
      <button type="button" className={styles.skip} onClick={finish}>
        跳过开场
      </button>
    </section>
  );
};

export default AutumnLaunchOverlay;
