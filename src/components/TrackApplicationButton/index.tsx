import { useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardPlus } from 'lucide-react';
import type { ILink } from '../../types/bookmark';
import styles from './index.module.css';

export default function TrackApplicationButton({
  link,
  corner = false,
}: {
  link: ILink;
  corner?: boolean;
}) {
  const navigate = useNavigate();
  const tooltipId = useId();
  return (
    <span className={`${styles.root} ${corner ? styles.corner : ''}`}>
      <button
        type="button"
        className={styles.button}
        title={corner ? undefined : '添加到我的投递～'}
        aria-label={`添加${link.title}到我的投递`}
        aria-describedby={corner ? tooltipId : undefined}
        onClick={(e) => {
          e.stopPropagation();
          void navigate(
            `/tracker?${new URLSearchParams({ company: link.title, website: link.url })}`,
          );
        }}
      >
        <ClipboardPlus size={16} />
      </button>
      {corner && (
        <span id={tooltipId} role="tooltip" className={styles.tooltip}>
          添加到我的投递～
        </span>
      )}
    </span>
  );
}
