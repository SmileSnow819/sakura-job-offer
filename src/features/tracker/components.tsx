import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, Check, GripVertical, Plus, Trash2, X } from 'lucide-react';
import { getFavicon } from '../../utils/getFavicon';
import { uid, validateFlow, type StageDefinition } from './model';

export function CompanyLogo({ name, website }: { name: string; website: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [website]);
  return (
    <span className="tracker-logo" aria-hidden="true">
      {website && !failed ? (
        <img
          src={getFavicon(website)}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          onLoad={(e) => {
            if (e.currentTarget.naturalWidth <= 16) setFailed(true);
          }}
        />
      ) : (
        (Array.from(name)[0] ?? '?')
      )}
    </span>
  );
}

export function Modal({
  title,
  subtitle,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    dialog?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    return () => {
      dialog?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`tracker-dialog ${wide ? 'wide' : ''}`}
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) {
          const bounds = ref.current.getBoundingClientRect();
          if (
            e.clientX < bounds.left ||
            e.clientX > bounds.right ||
            e.clientY < bounds.top ||
            e.clientY > bounds.bottom
          )
            onClose();
        }
      }}
    >
      <header className="tracker-dialog-header">
        <div>
          <h2 id={id}>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button
          type="button"
          className="tracker-icon-button"
          aria-label="关闭弹窗"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </header>
      {children}
    </dialog>
  );
}

export function FlowEditor({
  initial,
  onSave,
  onCancel,
  hasHistory = false,
}: {
  initial: StageDefinition[];
  onSave: (stages: StageDefinition[]) => void;
  onCancel: () => void;
  hasHistory?: boolean;
}) {
  const [stages, setStages] = useState(() => initial.map((s) => ({ ...s })));
  const [error, setError] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const drag = useRef<number | null>(null);
  const deleted = initial.filter((s) => !stages.some((n) => n.id === s.id));
  function move(from: number, to: number) {
    if (to < 0 || to >= stages.length || from === to) return;
    const next = [...stages];
    next.splice(to, 0, next.splice(from, 1)[0]);
    setStages(next);
  }
  function save() {
    try {
      validateFlow(stages);
      if (hasHistory && deleted.length && !acknowledged)
        throw new Error('请确认删除阶段及其历史记录');
      onSave(stages.map((s) => ({ ...s, name: s.name.trim() })));
    } catch (cause) {
      setError((cause as Error).message);
    }
  }
  return (
    <div className="tracker-flow-editor">
      <p className="tracker-help">
        拖动左侧手柄或使用上下箭头调整顺序。勾选末尾的 offer 阶段后，完成该阶段才会计为拿到 offer。
      </p>
      <div className="tracker-flow-list">
        {stages.map((stage, i) => (
          <div
            className="tracker-flow-row"
            key={stage.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (drag.current !== null) move(drag.current, i);
              drag.current = null;
            }}
          >
            <span
              className="tracker-drag"
              draggable
              onDragStart={(e) => {
                drag.current = i;
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', stage.id);
              }}
              onDragEnd={() => {
                drag.current = null;
              }}
              title="拖动排序"
            >
              <GripVertical size={18} />
            </span>
            <span className="tracker-step-number">{String(i + 1).padStart(2, '0')}</span>
            <input
              aria-label={`阶段 ${i + 1} 名称`}
              maxLength={30}
              value={stage.name}
              onChange={(e) =>
                setStages(
                  stages.map((s) => (s.id === stage.id ? { ...s, name: e.target.value } : s)),
                )
              }
            />
            <label className="tracker-check compact">
              <input
                type="checkbox"
                checked={stage.isOffer}
                onChange={(e) =>
                  setStages(
                    stages.map((s) => ({
                      ...s,
                      isOffer: s.id === stage.id ? e.target.checked : false,
                    })),
                  )
                }
              />
              offer
            </label>
            <button
              type="button"
              className="tracker-icon-button"
              disabled={i === 0}
              aria-label={`上移${stage.name}`}
              onClick={() => move(i, i - 1)}
            >
              <ArrowUp size={16} />
            </button>
            <button
              type="button"
              className="tracker-icon-button"
              disabled={i === stages.length - 1}
              aria-label={`下移${stage.name}`}
              onClick={() => move(i, i + 1)}
            >
              <ArrowDown size={16} />
            </button>
            <button
              type="button"
              className="tracker-icon-button danger"
              disabled={stages.length === 1}
              aria-label={`删除阶段${stage.name}`}
              onClick={() => {
                setStages(stages.filter((s) => s.id !== stage.id));
                setAcknowledged(false);
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="tracker-button dashed"
        disabled={stages.length >= 30}
        onClick={() => {
          const next = [...stages];
          const last = next.at(-1);
          next.splice(last?.isOffer ? next.length - 1 : next.length, 0, {
            id: uid(),
            name: '',
            isOffer: false,
          });
          setStages(next);
        }}
      >
        <Plus size={16} />
        添加阶段
      </button>
      {hasHistory && deleted.length > 0 && (
        <label className="tracker-warning tracker-check">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
          />
          确认删除「{deleted.map((s) => s.name).join('、')}」及其日期、备注
        </label>
      )}
      {error && (
        <p role="alert" className="tracker-error">
          {error}
        </p>
      )}
      <div className="tracker-actions">
        <button type="button" className="tracker-button" onClick={onCancel}>
          取消
        </button>
        <button type="button" className="tracker-button primary" onClick={save}>
          <Check size={16} />
          使用此流程
        </button>
      </div>
    </div>
  );
}
