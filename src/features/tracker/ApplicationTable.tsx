import { Fragment, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Check, ChevronRight, FileText, Minus, Trash2, X } from 'lucide-react';
import { CompanyLogo } from './components';
import { trackerTimelineMotion } from './motion';
import {
  currentStage,
  outcome,
  OUTCOME_LABELS,
  positionLabel,
  STAGE_LABELS,
  type Application,
  type Company,
  type StageStatus,
} from './model';

interface ApplicationTableProps {
  records: { application: Application; company: Company }[];
  selected: string[];
  onSelect: (id: string) => void;
  onDetail: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onStageChange: (applicationId: string, stageId: string, status: StageStatus) => boolean;
}

export default function ApplicationTable({
  records,
  selected,
  onSelect,
  onDetail,
  onDelete,
  onEdit,
  onStageChange,
}: ApplicationTableProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [editingStage, setEditingStage] = useState<{
    applicationId: string;
    stageId: string;
  } | null>(null);
  const [actionPosition, setActionPosition] = useState<{ left: number; top: number } | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const actionPanel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const timelinePanels = useRef(new Map<string, HTMLDivElement>());
  const timelineToggles = useRef(new Map<string, HTMLButtonElement>());
  const stageButtons = useRef(new Map<string, HTMLButtonElement>());
  const prefix = useId();

  useLayoutEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const motion = trackerTimelineMotion(reduced);
    for (const { application } of records) {
      const panel = timelinePanels.current.get(application.id);
      const toggleButton = timelineToggles.current.get(application.id);
      if (!panel || !toggleButton) continue;
      const open = expanded.has(application.id);
      panel.inert = !open;
      gsap.killTweensOf([panel, toggleButton.querySelector('svg')]);
      gsap.to(toggleButton.querySelector('svg'), {
        rotation: open ? 90 : 0,
        duration: motion.expandDuration * 0.75,
        ease: open ? 'back.out(1.8)' : 'power2.inOut',
      });
      gsap.to(panel, {
        height: open ? 'auto' : 0,
        opacity: open ? 1 : 0,
        duration: motion.expandDuration,
        ease: 'power3.inOut',
        overwrite: true,
      });
      if (open && motion.stageDuration > 0)
        gsap.fromTo(
          panel.querySelectorAll('.tracker-inline-stage'),
          { opacity: 0, x: -motion.stageOffset },
          {
            opacity: 1,
            x: 0,
            duration: motion.stageDuration,
            stagger: motion.stageStagger,
            ease: 'power3.out',
            clearProps: 'opacity,transform',
          },
        );
    }
  }, [expanded, records]);

  useEffect(() => {
    if (editingStage)
      actionPanel.current
        ?.querySelector<HTMLButtonElement>('[data-stage-action]:not(:disabled)')
        ?.focus();
  }, [editingStage]);

  function closeActions() {
    setEditingStage(null);
    setActionPosition(null);
    setSaveFailed(false);
    trigger.current?.focus();
  }

  function updateActionPosition(element = trigger.current) {
    if (!element) return;
    const anchor = element.querySelector('strong') ?? element;
    const textNode = anchor.firstChild;
    const range = textNode ? document.createRange() : null;
    if (range && textNode) range.selectNodeContents(textNode);
    const rect = range?.getBoundingClientRect() ?? anchor.getBoundingClientRect();
    setActionPosition({ left: rect.right + 10, top: rect.top + rect.height / 2 });
  }

  function toggle(id: string) {
    if (editingStage?.applicationId === id) setEditingStage(null);
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="tracker-table-wrap">
      <table className="tracker-table">
        <thead>
          <tr>
            <th className="tracker-expand-column">
              <span className="sr-only">展开流程</span>
            </th>
            <th>选择</th>
            <th>公司 / 岗位</th>
            <th>投递日期</th>
            <th>当前阶段</th>
            <th>状态</th>
            <th>最近更新</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {records.map(({ application, company }) => {
            const open = expanded.has(application.id);
            const timelineId = `${prefix}-timeline-${application.id}`;
            const chosenStage =
              editingStage?.applicationId === application.id
                ? application.stages.find((stage) => stage.id === editingStage.stageId)
                : undefined;
            return (
              <Fragment key={application.id}>
                <tr
                  className={open ? 'tracker-record-expanded' : undefined}
                  onClick={() => toggle(application.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      toggle(application.id);
                    }
                  }}
                  tabIndex={0}
                  title="点击展开招聘流程"
                >
                  <td className="tracker-expand-column">
                    <button
                      ref={(element) => {
                        if (element) timelineToggles.current.set(application.id, element);
                        else timelineToggles.current.delete(application.id);
                      }}
                      type="button"
                      className="tracker-row-toggle"
                      aria-label={`${open ? '收起' : '展开'}${company.name} ${positionLabel(application.position)}的招聘流程`}
                      aria-expanded={open}
                      aria-controls={timelineId}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggle(application.id);
                      }}
                    >
                      <ChevronRight size={16} aria-hidden="true" />
                    </button>
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`选择${company.name} ${positionLabel(application.position)}`}
                      checked={selected.includes(application.id)}
                      onClick={(event) => event.stopPropagation()}
                      onChange={() => onSelect(application.id)}
                    />
                  </td>
                  <td>
                    <div className="tracker-table-company">
                      <CompanyLogo name={company.name} website={company.website} />
                      <div>
                        <strong>{company.name}</strong>
                        <div className="tracker-table-position">
                          <p>{positionLabel(application.position)}</p>
                          {positionLabel(application.position) === '待设置岗位' && (
                            <button
                              type="button"
                              className="tracker-position-edit"
                              onClick={(event) => {
                                event.stopPropagation();
                                onEdit(application.id);
                              }}
                            >
                              设置岗位
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{application.appliedAt}</td>
                  <td>{currentStage(application)?.name ?? '流程已结束'}</td>
                  <td>
                    <span className={`tracker-badge ${outcome(application)}`}>
                      {OUTCOME_LABELS[outcome(application)]}
                      {application.archived ? ' · 已归档' : ''}
                    </span>
                  </td>
                  <td>{new Date(application.updatedAt).toLocaleDateString('zh-CN')}</td>
                  <td>
                    <div className="tracker-card-actions tracker-table-actions">
                      <button
                        type="button"
                        className="tracker-card-action"
                        aria-label={`查看${company.name}详情`}
                        onClick={(event) => {
                          event.stopPropagation();
                          onDetail(application.id);
                        }}
                      >
                        <FileText size={17} strokeWidth={1.8} />
                        <span>详情</span>
                      </button>
                      <button
                        type="button"
                        className="tracker-card-action danger"
                        aria-label={`删除${company.name}投递记录`}
                        onClick={(event) => {
                          event.stopPropagation();
                          onDelete(application.id);
                        }}
                      >
                        <Trash2 size={17} strokeWidth={1.8} />
                        <span>删除</span>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr className="tracker-timeline-row" aria-hidden={!open}>
                  <td colSpan={8}>
                    <div
                      ref={(element) => {
                        if (element) {
                          element.inert = !open;
                          timelinePanels.current.set(application.id, element);
                        } else timelinePanels.current.delete(application.id);
                      }}
                      id={timelineId}
                      className={`tracker-row-timeline${open ? ' is-open' : ''}`}
                      role="region"
                      aria-label={`${company.name} ${positionLabel(application.position)}的招聘流程`}
                    >
                      <div className="tracker-row-timeline-inner">
                        <div className="tracker-row-timeline-heading">
                          <span>
                            <i aria-hidden="true">✦</i> 招聘旅程
                          </span>
                          <small>点击阶段更新状态 · 双击标记完成 · ← → 切换阶段</small>
                          {application.withdrawn && (
                            <small>已取消投递 · 修改阶段不会恢复投递</small>
                          )}
                        </div>
                        <div
                          className="tracker-row-timeline-scroll"
                          tabIndex={0}
                          aria-label="横向招聘时间轴，可左右滚动"
                          onScroll={() => updateActionPosition()}
                        >
                          <ol className="tracker-inline-timeline">
                            {application.stages.map((stage, index) => (
                              <li
                                key={stage.id}
                                className={`tracker-inline-stage ${stage.status}`}
                                aria-current={
                                  stage.status === 'active' && !application.withdrawn
                                    ? 'step'
                                    : undefined
                                }
                              >
                                {chosenStage?.id === stage.id && (
                                  <div
                                    ref={actionPanel}
                                    className="tracker-stage-actions tracker-stage-actions-popover"
                                    id={`${timelineId}-actions`}
                                    style={
                                      actionPosition
                                        ? {
                                            position: 'fixed',
                                            left: actionPosition.left,
                                            top: actionPosition.top,
                                            transform: 'translateY(-50%)',
                                            zIndex: 1000,
                                          }
                                        : undefined
                                    }
                                    hidden={!actionPosition}
                                    role="group"
                                    aria-label={`设置${stage.name}状态`}
                                    onKeyDown={(event) => {
                                      if (event.key === 'Escape') {
                                        event.stopPropagation();
                                        closeActions();
                                      }
                                    }}
                                  >
                                    <strong>{stage.name}</strong>
                                    {(
                                      [
                                        'active',
                                        'completed',
                                        'skipped',
                                        'rejected',
                                        'pending',
                                      ] as StageStatus[]
                                    ).map((status) => (
                                      <button
                                        type="button"
                                        key={status}
                                        data-stage-action
                                        className={`tracker-button small${stage.status === status ? ' primary' : ''}`}
                                        disabled={stage.status === status}
                                        aria-pressed={stage.status === status}
                                        onClick={() => {
                                          if (onStageChange(application.id, stage.id, status))
                                            closeActions();
                                          else setSaveFailed(true);
                                        }}
                                      >
                                        {STAGE_LABELS[status]}
                                      </button>
                                    ))}
                                  </div>
                                )}
                                <button
                                  type="button"
                                  ref={(element) => {
                                    const key = application.id + ':' + stage.id;
                                    if (element) stageButtons.current.set(key, element);
                                    else stageButtons.current.delete(key);
                                  }}
                                  className="tracker-inline-stage-button"
                                  aria-label={`更新${stage.name}状态，当前${STAGE_LABELS[stage.status]}`}
                                  aria-expanded={chosenStage?.id === stage.id}
                                  aria-controls={`${timelineId}-actions`}
                                  onClick={(event) => {
                                    trigger.current = event.currentTarget;
                                    setSaveFailed(false);
                                    if (chosenStage?.id === stage.id) closeActions();
                                    else {
                                      updateActionPosition(event.currentTarget);
                                      setEditingStage({
                                        applicationId: application.id,
                                        stageId: stage.id,
                                      });
                                    }
                                  }}
                                  onDoubleClick={() => {
                                    if (onStageChange(application.id, stage.id, 'completed')) {
                                      closeActions();
                                    }
                                  }}
                                  onKeyDown={(event) => {
                                    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')
                                      return;
                                    event.preventDefault();
                                    const nextIndex = index + (event.key === 'ArrowRight' ? 1 : -1);
                                    const nextStage = application.stages[nextIndex];
                                    if (nextStage)
                                      stageButtons.current
                                        .get(application.id + ':' + nextStage.id)
                                        ?.focus();
                                  }}
                                >
                                  <span className="tracker-inline-stage-marker" aria-hidden="true">
                                    {stage.status === 'completed' ? (
                                      <Check size={13} />
                                    ) : stage.status === 'skipped' ? (
                                      <Minus size={13} />
                                    ) : stage.status === 'rejected' ? (
                                      <X size={13} />
                                    ) : (
                                      index + 1
                                    )}
                                  </span>
                                  <strong>{stage.name}</strong>
                                  <span className="tracker-inline-stage-status">
                                    {STAGE_LABELS[stage.status]}
                                  </span>
                                  {stage.completedAt && (
                                    <time dateTime={stage.completedAt}>{stage.completedAt}</time>
                                  )}
                                </button>
                                {index < application.stages.length - 1 && (
                                  <span className="tracker-inline-connector" aria-hidden="true">
                                    <ChevronRight size={12} />
                                  </span>
                                )}
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
