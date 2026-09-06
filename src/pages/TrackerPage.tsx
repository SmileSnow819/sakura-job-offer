import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import gsap from 'gsap';
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Database,
  Download,
  LayoutGrid,
  List,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import bookmarks from '../bookmarks.json';
import {
  changeStage,
  currentStage,
  defaultTemplate,
  normalizeWebsite,
  outcome,
  OUTCOME_LABELS,
  positionLabel,
  progress,
  type Application,
  type Company,
  type StageStatus,
  type TrackerData,
} from '../features/tracker/model';
import { useTracker } from '../features/tracker/useTracker';
import { CompanyLogo, FlowEditor, Modal } from '../features/tracker/components';
import { ApplicationDetail, ApplicationForm } from '../features/tracker/RecordDialogs';
import { ExportDialog } from '../features/tracker/ExportDialog';
import { DataDialog } from '../features/tracker/DataDialog';
import ApplicationTable from '../features/tracker/ApplicationTable';
import { trackerMotion } from '../features/tracker/motion';
import '../features/tracker/tracker.css';

const Analytics = lazy(() => import('../features/tracker/Analytics'));
const catalog: Company[] = [];
for (const category of bookmarks.categories.filter((c) => c.id !== 'interviews')) {
  for (const link of category.links) {
    const name = link.title.replace(/(?:校园招聘|校招|招聘官网|招聘)$/, '').trim();
    if (catalog.some((c) => c.name === name)) continue;
    try {
      catalog.push({
        id: `catalog:${name}`,
        name,
        website: normalizeWebsite(link.url),
        isCustom: false,
      });
    } catch {
      /* Non-web catalog entries cannot be company websites. */
    }
  }
}
type Dialog =
  | { type: 'new'; seed?: { name: string; website: string } }
  | { type: 'detail' | 'edit'; id: string }
  | { type: 'template' | 'export' | 'data' }
  | null;

export default function TrackerPage() {
  const pageRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const contentReadyRef = useRef(false);
  const { data, save, error } = useTracker();
  const [params, setParams] = useSearchParams();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [archive, setArchive] = useState('visible');
  const [sort, setSort] = useState('updated');
  const [view, setView] = useState(() => (window.innerWidth < 700 ? 'cards' : 'table'));
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  const [templateKey, setTemplateKey] = useState(0);
  const [templateInitial, setTemplateInitial] = useState(data.template);
  const [restoreConfirm, setRestoreConfirm] = useState(false);
  useEffect(() => {
    const name = params.get('company');
    if (!name) return;
    setDialog({
      type: 'new',
      seed: {
        name: name
          .replace(/(?:校园招聘|校招|招聘官网|招聘)$/, '')
          .trim()
          .slice(0, 100),
        website: params.get('website') ?? '',
      },
    });
    setParams({}, { replace: true });
  }, [params, setParams]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 3500);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    const closeStaleEditor = () => {
      setDialog(null);
      setNotice('记录已从其他页面同步，请重新打开编辑。');
    };
    window.addEventListener('storage', closeStaleEditor);
    return () => window.removeEventListener('storage', closeStaleEditor);
  }, []);
  const all = useMemo(
    () =>
      data.applications.map((application) => ({
        application,
        company: data.companies.find((c) => c.id === application.companyId)!,
      })),
    [data],
  );
  const filtered = useMemo(
    () =>
      all
        .filter(({ application: a, company: c }) => {
          return (
            (archive === 'all' || (archive === 'archived' ? a.archived : !a.archived)) &&
            (filter === 'all' || outcome(a) === filter) &&
            `${c.name} ${a.position}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
          );
        })
        .sort((a, b) =>
          sort === 'company'
            ? a.company.name.localeCompare(b.company.name, 'zh-CN')
            : sort === 'applied'
              ? b.application.appliedAt.localeCompare(a.application.appliedAt)
              : b.application.updatedAt.localeCompare(a.application.updatedAt),
        ),
    [all, archive, filter, query, sort],
  );
  const picked = all.filter((r) => selected.includes(r.application.id));
  const activeRecords = data.applications.filter((a) => !a.archived);
  useLayoutEffect(() => {
    const page = pageRef.current;
    if (!page) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const motion = trackerMotion(reduced);
    const context = gsap.context(() => {
      const sections = page.querySelectorAll<HTMLElement>('[data-tracker-enter]');
      if (reduced) {
        gsap.set([page, ...sections], { clearProps: 'all' });
        return;
      }
      const timeline = gsap.timeline();
      timeline.fromTo(
        page,
        { opacity: 0 },
        { opacity: 1, duration: motion.enterDuration * 0.7, ease: 'power2.out' },
      );
      timeline.fromTo(
        sections,
        { opacity: 0, y: motion.enterOffset },
        {
          opacity: 1,
          y: 0,
          duration: motion.enterDuration,
          stagger: motion.enterStagger,
          ease: 'power3.out',
          clearProps: 'opacity,transform',
        },
        0.04,
      );
    }, page);
    return () => context.revert();
  }, []);

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    if (!contentReadyRef.current) {
      contentReadyRef.current = true;
      return;
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const motion = trackerMotion(reduced);
    if (reduced) {
      gsap.set(content, { clearProps: 'all' });
      return;
    }
    const tween = gsap.fromTo(
      content,
      { opacity: 0, y: motion.contentOffset },
      {
        opacity: 1,
        y: 0,
        duration: motion.contentDuration,
        ease: 'power2.out',
        overwrite: 'auto',
        clearProps: 'opacity,transform',
      },
    );
    return () => {
      tween.kill();
    };
  }, [archive, filter, filtered.length, query, showAnalytics, sort, view]);
  function commit(next: TrackerData, message: string, close = true) {
    if (!save(next)) return false;
    setNotice(message);
    if (close) setDialog(null);
    return true;
  }
  function saveApplication(company: Company, application: Application) {
    return commit(
      {
        ...data,
        companies: data.companies.some((c) => c.id === company.id)
          ? data.companies.map((c) => (c.id === company.id ? company : c))
          : [...data.companies, company],
        applications: data.applications.some((a) => a.id === application.id)
          ? data.applications.map((a) => (a.id === application.id ? application : a))
          : [...data.applications, application],
      },
      '投递记录已保存',
    );
  }
  function updateStage(applicationId: string, stageId: string, status: StageStatus) {
    const application = data.applications.find((item) => item.id === applicationId);
    if (!application || !application.stages.some((stage) => stage.id === stageId)) return false;
    const updated = {
      ...application,
      stages: changeStage(application.stages, stageId, status),
      updatedAt: new Date().toISOString(),
    };
    return commit(
      {
        ...data,
        applications: data.applications.map((item) => (item.id === applicationId ? updated : item)),
      },
      '阶段状态已保存',
      false,
    );
  }
  const toggleSelected = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  const active =
    dialog && 'id' in dialog ? data.applications.find((a) => a.id === dialog.id) : undefined;
  const badge = (a: Application) => (
    <span className={`tracker-badge ${outcome(a)}`}>
      {OUTCOME_LABELS[outcome(a)]}
      {a.archived ? ' · 已归档' : ''}
    </span>
  );
  return (
    <section ref={pageRef} className="tracker-page" aria-label="我的投递">
      <div className="tracker-container">
        <header className="tracker-header" data-tracker-enter>
          <div>
            <h1>投递记录</h1>
            <p>记录岗位与招聘进度</p>
          </div>
          <button className="tracker-button primary" onClick={() => setDialog({ type: 'new' })}>
            <Plus size={18} />
            新增投递
          </button>
        </header>
        <div className="tracker-stats" data-tracker-enter>
          {[
            {
              label: '投递记录',
              value: activeRecords.length,
              hint: `${new Set(activeRecords.map((a) => a.companyId)).size} 家公司`,
              status: 'all',
            },
            {
              label: '进行中',
              value: activeRecords.filter((a) => outcome(a) === 'active').length,
              hint: '等待后续进展',
              status: 'active',
            },
            {
              label: '已拿 offer',
              value: activeRecords.filter((a) => outcome(a) === 'offer').length,
              hint: '已收到录用通知',
              status: 'offer',
            },
            {
              label: '未通过',
              value: activeRecords.filter((a) => outcome(a) === 'rejected').length,
              hint: '已结束的流程',
              status: 'rejected',
            },
          ].map((stat) => (
            <button
              key={stat.status}
              className={`tracker-stat ${stat.status}`}
              aria-pressed={filter === stat.status && archive === 'visible'}
              onClick={() => {
                setFilter(stat.status);
                setArchive('visible');
              }}
            >
              <span className="tracker-stat-label">{stat.label}</span>
              <strong>{stat.value}</strong>
              <small>{stat.hint}</small>
            </button>
          ))}
        </div>
        <div className="tracker-workspace-heading" data-tracker-enter>
          <h2>
            全部投递 <span>{filtered.length}</span>
          </h2>
          <div className="tracker-inline-actions">
            <button
              className="tracker-button small"
              aria-pressed={showAnalytics}
              onClick={() => setShowAnalytics(!showAnalytics)}
            >
              <BarChart3 size={15} />
              {showAnalytics ? '收起统计' : '统计'}
            </button>
            <button
              className="tracker-button small"
              onClick={() => {
                setTemplateInitial(data.template);
                setTemplateKey((k) => k + 1);
                setRestoreConfirm(false);
                setDialog({ type: 'template' });
              }}
            >
              <SlidersHorizontal size={15} />
              默认流程
            </button>
            <button className="tracker-button small" onClick={() => setDialog({ type: 'data' })}>
              <Database size={15} />
              数据备份
            </button>
            <button
              className="tracker-button small"
              disabled={!all.length}
              onClick={() => setDialog({ type: 'export' })}
            >
              <Download size={15} />
              导出与分享
            </button>
          </div>
        </div>
        {error && (
          <div role="alert" className="tracker-error">
            {error}
            <button className="tracker-button small" onClick={() => setDialog({ type: 'data' })}>
              管理备份
            </button>
          </div>
        )}
        <div className="tracker-toolbar" data-tracker-enter>
          <div className="tracker-search">
            <Search size={17} />
            <input
              aria-label="搜索投递公司或岗位"
              placeholder="搜索公司或岗位…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            aria-label="筛选投递状态"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">全部状态</option>
            {Object.entries(OUTCOME_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            aria-label="归档筛选"
            value={archive}
            onChange={(e) => setArchive(e.target.value)}
          >
            <option value="visible">未归档</option>
            <option value="archived">已归档</option>
            <option value="all">含归档</option>
          </select>
          <select aria-label="排序方式" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="updated">最近更新</option>
            <option value="applied">投递日期</option>
            <option value="company">公司名称</option>
          </select>
          <div className="tracker-view-toggle" role="group" aria-label="投递视图">
            <button
              aria-label="卡片视图"
              aria-pressed={view === 'cards'}
              onClick={() => setView('cards')}
            >
              <LayoutGrid size={17} />
            </button>
            <button
              aria-label="表格视图"
              aria-pressed={view === 'table'}
              onClick={() => setView('table')}
            >
              <List size={19} />
            </button>
          </div>
        </div>
        {all.length > 0 && (
          <div className="tracker-selection" data-tracker-enter>
            <label className="tracker-check">
              <input
                type="checkbox"
                checked={
                  !!filtered.length && filtered.every((r) => selected.includes(r.application.id))
                }
                onChange={(e) =>
                  setSelected(
                    e.target.checked
                      ? [...new Set([...selected, ...filtered.map((r) => r.application.id)])]
                      : selected.filter((id) => !filtered.some((r) => r.application.id === id)),
                  )
                }
              />
              全选当前结果
            </label>
            <span>
              {picked.length ? `已选择 ${picked.length} 条` : '选择记录后，可单独导出或分享'}
            </span>
            {picked.length > 0 && <button onClick={() => setSelected([])}>清除选择</button>}
          </div>
        )}
        <div ref={contentRef} className="tracker-results" data-tracker-enter>
          {showAnalytics && (
            <Suspense fallback={<p className="tracker-help">加载统计图表…</p>}>
              <Analytics applications={filtered.map((r) => r.application)} />
            </Suspense>
          )}
          {!filtered.length ? (
            <div className="tracker-empty">
              <BriefcaseBusiness size={28} />
              <h2>{all.length ? '这里还没有匹配的记录' : '还没有投递记录'}</h2>
              <p>
                {all.length ? '试试其他关键词或筛选条件。' : '添加公司和岗位，开始跟进招聘流程。'}
              </p>
              <button
                className="tracker-button primary"
                onClick={() =>
                  all.length
                    ? (setQuery(''), setFilter('all'), setArchive('all'))
                    : setDialog({ type: 'new' })
                }
              >
                {all.length ? '重置筛选' : '记录第一份投递'}
                <ArrowRight size={16} />
              </button>
              <small>无需登录 · 本地保存 · 随时导出</small>
            </div>
          ) : view === 'cards' ? (
            <div className="tracker-card-grid">
              {filtered.map(({ application: a, company: c }) => (
                <article key={a.id} className="tracker-card">
                  <div className="tracker-card-top">
                    <CompanyLogo name={c.name} website={c.website} />
                    <div>
                      <button
                        className="tracker-company-name"
                        onClick={() => setDialog({ type: 'detail', id: a.id })}
                      >
                        {c.name}
                      </button>
                      <p>{positionLabel(a.position)}</p>
                    </div>
                    <input
                      type="checkbox"
                      aria-label={`选择${c.name} ${positionLabel(a.position)}`}
                      checked={selected.includes(a.id)}
                      onChange={() => toggleSelected(a.id)}
                    />
                  </div>
                  <div className="tracker-card-status">
                    {badge(a)}
                    <span>投递于 {a.appliedAt}</span>
                  </div>
                  <div className="tracker-card-stage">
                    <span>{a.withdrawn ? '取消前进度' : '当前阶段'}</span>
                    <strong>{currentStage(a)?.name ?? OUTCOME_LABELS[outcome(a)]}</strong>
                    <small>{progress(a)}%</small>
                  </div>
                  <div className="tracker-progress" aria-label={`流程进度 ${progress(a)}%`}>
                    {a.stages.map((s) => (
                      <span
                        key={s.id}
                        className={s.status}
                        title={`${s.name} · ${{ pending: '未开始', active: '进行中', completed: '已完成', skipped: '已跳过', rejected: '未通过' }[s.status]}`}
                      />
                    ))}
                  </div>
                  <div className="tracker-card-footer">
                    <button
                      className="tracker-text-button"
                      onClick={() => setDialog({ type: 'detail', id: a.id })}
                    >
                      查看详情
                      <ArrowRight size={14} />
                    </button>
                    {outcome(a) === 'active' && !a.archived && currentStage(a) && (
                      <button
                        className="tracker-button small"
                        onClick={() => {
                          const updated = {
                            ...a,
                            stages: changeStage(a.stages, currentStage(a)!.id, 'completed'),
                            updatedAt: new Date().toISOString(),
                          };
                          commit(
                            {
                              ...data,
                              applications: data.applications.map((item) =>
                                item.id === a.id ? updated : item,
                              ),
                            },
                            '进度已更新，可在详情中回退',
                            false,
                          );
                        }}
                      >
                        完成当前阶段
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <ApplicationTable
              onStageChange={updateStage}
              records={filtered}
              selected={selected}
              onSelect={toggleSelected}
              onDetail={(id) => setDialog({ type: 'detail', id })}
            />
          )}
        </div>
        <footer className="tracker-footer" data-tracker-enter>
          <span>
            <span className="tracker-local-dot" />
            数据仅保存在当前浏览器，清除网站数据会丢失记录。
          </span>
          <button onClick={() => setDialog({ type: 'data' })}>
            下载备份
            <ArrowRight size={13} />
          </button>
        </footer>
      </div>
      {notice && (
        <div role="status" className="tracker-toast">
          ✓ {notice}
        </div>
      )}
      {dialog?.type === 'new' && (
        <ApplicationForm
          storageError={error}
          data={data}
          catalog={catalog}
          seed={dialog.seed}
          onSave={saveApplication}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.type === 'edit' && active && (
        <ApplicationForm
          storageError={error}
          data={data}
          catalog={catalog}
          existing={active}
          onSave={saveApplication}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.type === 'detail' && active && (
        <ApplicationDetail
          storageError={error}
          application={active}
          company={data.companies.find((c) => c.id === active.companyId)!}
          onSave={(application) =>
            commit(
              {
                ...data,
                applications: data.applications.map((a) =>
                  a.id === application.id ? application : a,
                ),
              },
              '进度已保存',
            )
          }
          onEdit={() => setDialog({ type: 'edit', id: active.id })}
          onDelete={() => {
            const ok = commit(
              { ...data, applications: data.applications.filter((a) => a.id !== active.id) },
              '已删除投递记录；如需恢复，请导入先前的备份',
            );
            if (ok) setSelected((ids) => ids.filter((id) => id !== active.id));
            return ok;
          }}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.type === 'template' && (
        <Modal
          title="默认招聘流程"
          subtitle="只影响之后新增的投递，已有记录保留各自的流程。"
          onClose={() => setDialog(null)}
          wide
        >
          <div className="tracker-template">
            {error && (
              <p className="tracker-error" role="alert">
                {error}
              </p>
            )}
            <FlowEditor
              key={templateKey}
              initial={templateInitial}
              onSave={(template) => commit({ ...data, template }, '默认流程已保存')}
              onCancel={() => setDialog(null)}
            />
            <button className="tracker-text-button" onClick={() => setRestoreConfirm(true)}>
              <RotateCcw size={14} />
              恢复初始流程
            </button>
            {restoreConfirm && (
              <div className="tracker-warning">
                将重新载入八阶段流程，保存后生效。
                <div className="tracker-inline-actions">
                  <button className="tracker-button" onClick={() => setRestoreConfirm(false)}>
                    取消
                  </button>
                  <button
                    className="tracker-button"
                    onClick={() => {
                      setTemplateInitial(defaultTemplate());
                      setTemplateKey((k) => k + 1);
                      setRestoreConfirm(false);
                    }}
                  >
                    确认恢复
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
      {dialog?.type === 'export' && (
        <ExportDialog
          all={all}
          filtered={filtered}
          selected={picked}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.type === 'data' && (
        <DataDialog
          storageError={error}
          data={data}
          onSave={(next, recover) => {
            if (save(next, recover)) {
              setSelected([]);
              setNotice('数据已更新');
              return true;
            }
            return false;
          }}
          onClose={() => setDialog(null)}
        />
      )}
    </section>
  );
}
