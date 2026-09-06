import { useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ClipboardPlus, X } from 'lucide-react';
import type { ILink } from '../../types/bookmark';
import styles from './index.module.css';

export default function TrackApplicationButton({
  link,
  corner = false,
  isAdded,
  onAdd,
  onRemove,
}: {
  link: ILink;
  corner?: boolean;
  isAdded?: boolean;
  onAdd?: () => boolean;
  onRemove?: () => boolean;
}) {
  const navigate = useNavigate();
  const tooltipId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState('');
  const directAdd = onAdd && onRemove;
  const closeDialog = () => dialogRef.current?.close();
  return (
    <span className={`${styles.root} ${corner ? styles.corner : ''}`}>
      <button
        type="button"
        className={`${styles.button} ${isAdded ? styles.added : ''}`}
        title={corner ? undefined : isAdded ? '已添加到我的投递' : '添加到我的投递～'}
        aria-label={`${isAdded ? '移除' : '添加'}${link.title}${isAdded ? '的职位记录' : '到我的投递'}`}
        aria-pressed={directAdd ? isAdded : undefined}
        aria-describedby={corner ? tooltipId : undefined}
        onClick={(e) => {
          e.stopPropagation();
          if (directAdd) {
            setError('');
            if (isAdded) dialogRef.current?.showModal();
            else if (!onAdd()) setError('添加失败，请查看页面提示');
            return;
          }
          void navigate(
            `/tracker?${new URLSearchParams({ company: link.title, website: link.url })}`,
          );
        }}
      >
        {isAdded ? <Check size={17} /> : <ClipboardPlus size={16} />}
      </button>
      {corner && (
        <span id={tooltipId} role="tooltip" className={styles.tooltip}>
          {isAdded ? '已添加到我的投递' : '添加到我的投递～'}
        </span>
      )}
      {error && <span className={styles.error}>{error}</span>}
      {directAdd && (
        <dialog
          ref={dialogRef}
          className={styles.dialog}
          onClick={(event) => event.stopPropagation()}
          onCancel={() => setError('')}
        >
          <button
            type="button"
            className={styles.close}
            aria-label="关闭确认弹窗"
            onClick={closeDialog}
          >
            <X size={18} />
          </button>
          <strong>确认移除此职位？</strong>
          <p>只会移除从秋招专场添加的这条职位记录，同公司的其他职位不会受影响。</p>
          {error && (
            <p role="alert" className={styles.dialogError}>
              {error}
            </p>
          )}
          <div className={styles.actions}>
            <button type="button" onClick={closeDialog}>
              取消
            </button>
            <button
              type="button"
              className={styles.danger}
              onClick={() => {
                if (onRemove()) closeDialog();
                else setError('移除失败，请查看页面提示');
              }}
            >
              确认移除
            </button>
          </div>
        </dialog>
      )}
    </span>
  );
}
