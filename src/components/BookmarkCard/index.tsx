import React from 'react';
import { ExternalLink, Share2 } from 'lucide-react';

import { ILink } from '../../types/bookmark';
import { getFavicon, handleImgError } from '../../utils/getFavicon';
import styles from './index.module.css';

interface IBookmarkCardProps {
  link: ILink;
  onShare: (e: React.MouseEvent, url: string) => void;
}

/**
 * 轮播卡片 - 二次元粉蓝风格竖版卡片
 */
const BookmarkCard: React.FC<IBookmarkCardProps> = ({ link, onShare }) => {
  const hostname = (() => {
    try { return new URL(link.url).hostname.replace('www.', ''); }
    catch { return link.url; }
  })();

  return (
    <div className={styles['bookmark-card']}>
      <div className={styles['card-glow']} />

      <div className={styles['card-favicon-wrap']}>
        <img
          src={getFavicon(link.url)}
          alt={link.title}
          className={styles['card-favicon']}
          onError={handleImgError}
        />
        <div className={styles['card-favicon-halo']} />
      </div>

      <div className={styles['card-info']}>
        <h3 className={styles['card-title']}>{link.title}</h3>
        <p className={styles['card-domain']}>{hostname}</p>
      </div>

      <div className={styles['card-actions']}>
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${styles['card-btn']} ${styles['card-btn-primary']}`}
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink size={14} />
          <span>访问</span>
        </a>
        <button
          className={`${styles['card-btn']} ${styles['card-btn-secondary']}`}
          onClick={(e) => onShare(e, link.url)}
          title="复制链接"
        >
          <Share2 size={14} />
        </button>
      </div>
    </div>
  );
};

export default React.memo(BookmarkCard);
