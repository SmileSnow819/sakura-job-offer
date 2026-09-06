import { Fragment, useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronRight, Minus, X } from 'lucide-react';
import { CompanyLogo } from './components';
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
  onStageChange: (applicationId: string, stageId: string, status: StageStatus) => boolean;
}

export default function ApplicationTable({
  records,
  selected,
  onSelect,
  onDetail,
  onStageChange,
}: ApplicationTableProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [editingStage, setEditingStage] = useState<{
    applicationId: string;
    stageId: string;
  } | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const actionPanel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const prefix = useId();

  useEffect(() => {
    if (editingStage)
      actionPanel.current
        ?.querySelector<HTMLButtonElement>('[data-stage-action]:not(:disabled)')
        ?.focus();
  }, [editingStage]);

  function closeActions() {
    setEditingStage(null);
    setSaveFailed(false);
    trigger.current?.focus();
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
                <tr className={open ? 'tracker-record-expanded' : undefined}>
                  <td className="tracker-expand-column">
                    <button
                      type="button"
                      className="tracker-row-toggle"
                      aria-label={`${open ? '收起' : '展开'}${company.name} ${positionLabel(application.position)}的招聘流程`}
                      aria-expanded={open}
                      aria-controls={timelineId}
                      onClick={() => toggle(application.id)}
                    >
                      <ChevronRight size={16} aria-hidden="true" />
                    </button>
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`选择${company.name} ${positionLabel(application.position)}`}
                      checked={selected.includes(application.id)}
                      onChange={() => onSelect(application.id)}
                    />
                  </td>
                  <td>
                    <div className="tracker-table-company">
                      <CompanyLogo name={company.name} website={company.website} />
                      <div>
                        <strong>{company.name}</strong>
                        <p>{positionLabel(application.position)}</p>
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
                    <button
                      type="button"
                      className="tracker-text-button"
                      onClick={() => onDetail(application.id)}
                    >
                      查看详情
                    </button>
                  </td>
                </tr>
                <tr className="tracker-timeline-row" hidden={!open}>
                  <td colSpan={8}>
                    <div
                      id={timelineId}
                      className="tracker-row-timeline"
                      role="region"
                      aria-label={`${company.name} ${positionLabel(application.position)}的招聘流程`}
                    >
                      {open && (
                        <>
                          <div className="tracker-row-timeline-heading">
                            <span>招聘流程</span>
                            <small>点击阶段更新状态</small>
                            {application.withdrawn && (
                              <small>已取消投递 · 修改阶段不会恢复投递</small>
                            )}
                          </div>
                          <div
                            className="tracker-row-timeline-scroll"
                            tabIndex={0}
                            aria-label="横向招聘时间轴，可左右滚动"
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
                                  <button
                                    type="button"
                                    className="tracker-inline-stage-button"
                                    aria-label={`更新${stage.name}状态，当前${STAGE_LABELS[stage.status]}`}
                                    aria-expanded={chosenStage?.id === stage.id}
                                    aria-controls={`${timelineId}-actions`}
                                    onClick={(event) => {
                                      trigger.current = event.currentTarget;
                                      setSaveFailed(false);
                                      setEditingStage(
                                        chosenStage?.id === stage.id
                                          ? null
                                          : { applicationId: application.id, stageId: stage.id },
                                      );
                                    }}
                                  >
                                    <span
                                      className="tracker-inline-stage-marker"
                                      aria-hidden="true"
                                    >
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
                          <div id={`${timelineId}-actions`} hidden={!chosenStage}>
                            {chosenStage && (
                              <div
                                ref={actionPanel}
                                className="tracker-stage-actions"
                                role="group"
                                aria-label={`设置${chosenStage.name}状态`}
                                onKeyDown={(event) => {
                                  if (event.key === 'Escape') {
                                    event.stopPropagation();
                                    closeActions();
                                  }
                                }}
                              >
                                <div className="tracker-stage-actions-heading">
                                  <strong>{chosenStage.name}</strong>
                                  <span>选择新状态，自动保存</span>
                                  <button
                                    type="button"
                                    className="tracker-icon-button"
                                    aria-label="关闭阶段状态选择"
                                    onClick={closeActions}
                                  >
                                    <X size={15} />
                                  </button>
                                </div>
                                <div className="tracker-inline-actions">
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
                                      className={`tracker-button small${chosenStage.status === status ? ' primary' : ''}`}
                                      disabled={chosenStage.status === status}
                                      aria-pressed={chosenStage.status === status}
                                      onClick={() => {
                                        if (onStageChange(application.id, chosenStage.id, status))
                                          closeActions();
                                        else setSaveFailed(true);
                                      }}
                                    >
                                      {STAGE_LABELS[status]}
                                    </button>
                                  ))}
                                </div>
                                <p className="tracker-help">
                                  完成或跳过会进入下一阶段；直接推进会跳过之前未完成的阶段，回退会重置后续状态，保留备注。
                                </p>
                                {saveFailed && (
                                  <p className="tracker-error" role="alert">
                                    未能保存，原状态已保留。请查看页面上的存储错误提示后重试。
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </>
                      )}
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
