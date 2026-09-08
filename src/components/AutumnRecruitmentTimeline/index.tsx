import { CalendarClock, ExternalLink } from 'lucide-react';
import React, { useMemo } from 'react';

import type { ILink } from '../../types/bookmark';
import { buildRecruitmentTimeline } from '../../utils/recruitmentTimeline';
import styles from './index.module.css';

interface IAutumnRecruitmentTimelineProps {
  links: ILink[];
}

/** 秋招开放时间线：按实际开放日期展示最近上线的招聘公司。 */
const AutumnRecruitmentTimeline: React.FC<IAutumnRecruitmentTimelineProps> = ({ links }) => {
  const items = useMemo(() => buildRecruitmentTimeline(links), [links]);

  return (
    <section className={styles.timeline} aria-label="秋招公司开放时间线">
      <div className={styles.heading}>
        <span className={styles.headingIcon} aria-hidden="true">
          <CalendarClock size={17} />
        </span>
        <div>
          <h3>最近开放</h3>
          <p>按招聘正式开放时间更新</p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className={styles.empty}>最近一周暂无新开放公司</p>
      ) : (
        <div className={styles.scroller}>
          <ol className={styles.items}>
            {items.map(({ dateLabel, link, openedAt }) => (
              <li key={`${link.url}-${openedAt}`} className={styles.item}>
                <time dateTime={openedAt}>{dateLabel}</time>
                <span className={styles.dot} aria-hidden="true" />
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  <span>{link.title}</span>
                  <ExternalLink size={13} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
};

export default React.memo(AutumnRecruitmentTimeline);
