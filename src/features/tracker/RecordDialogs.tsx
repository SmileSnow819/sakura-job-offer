import { useMemo, useState } from 'react';
import { ArrowRight, ExternalLink, Pencil, Search, SlidersHorizontal } from 'lucide-react';
import { applyFlow, changeStage, currentStage, isDate, makeStages, normalizeWebsite, outcome, OUTCOME_LABELS, STAGE_LABELS, today, uid, type Application, type Company, type StageStatus, type TrackerData } from './model';
import { CompanyLogo, FlowEditor, Modal } from './components';

export function ApplicationForm({ data, catalog, seed, existing, onSave, onClose, storageError }: {
  data: TrackerData; catalog: Company[]; seed?: { name: string; website: string }; existing?: Application;
  onSave: (company: Company, application: Application) => boolean; onClose: () => void; storageError?: string;
}) {
  const original = data.companies.find(c => c.id === existing?.companyId);
  const allCompanies = useMemo(() => [...data.companies, ...catalog.filter(c => !data.companies.some(local => local.id === c.id || local.name === c.name))], [data.companies, catalog]);
  const seeded = original ?? allCompanies.find(c => c.name === seed?.name);
  const [selected, setSelected] = useState<Company | undefined>(seeded);
  const [name, setName] = useState(original?.name ?? seed?.name ?? '');
  const [website, setWebsite] = useState(original?.website ?? seed?.website ?? '');
  const [position, setPosition] = useState(existing?.position ?? '');
  const [date, setDate] = useState(existing?.appliedAt ?? today());
  const [note, setNote] = useState(existing?.note ?? '');
  const [custom, setCustom] = useState(!!original?.isCustom || (!!seed && !seeded));
  const [error, setError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(!seed && !existing);
  const suggestions = allCompanies.filter(c => c.name.toLocaleLowerCase().includes(name.trim().toLocaleLowerCase())).slice(0, 6);
  const submit = () => {
    try {
      if (!name.trim() || !position.trim()) throw new Error('请填写公司名称和岗位');
      if (!isDate(date)) throw new Error('请填写有效的投递日期');
      const matching = selected ?? allCompanies.find(c => c.name === name.trim());
      const company: Company = matching ? { ...matching, ...(matching.isCustom ? { name: name.trim(), website: normalizeWebsite(website) } : {}) } : { id: uid(), name: name.trim(), website: normalizeWebsite(website), isCustom: true };
      const timestamp = new Date().toISOString();
      const application: Application = existing ? { ...existing, companyId: company.id, position: position.trim(), appliedAt: date, note, updatedAt: timestamp } : { id: uid(), companyId: company.id, position: position.trim(), appliedAt: date, note, stages: makeStages(data.template), withdrawn: false, archived: false, createdAt: timestamp, updatedAt: timestamp };
      if (!onSave(company, application)) setError('保存失败，请查看页面提示；表单内容已保留。');
    } catch (cause) { setError((cause as Error).message); }
  };
  return <Modal title={existing ? '编辑投递' : '新增投递'} subtitle="公司和岗位必填，其他信息可稍后补充。" onClose={onClose}>
    <form className="tracker-form" onSubmit={e => { e.preventDefault(); submit(); }}>
      <label className="tracker-field">公司名称 <span className="tracker-required">*</span><div className="tracker-input-icon"><Search size={17} /><input data-autofocus autoFocus required maxLength={100} value={name} placeholder="搜索公司，或输入新公司名称" onFocus={() => setShowSuggestions(true)} onChange={e => { setName(e.target.value); if (!selected?.isCustom) { setSelected(undefined); setWebsite(''); setCustom(false); } setShowSuggestions(true); }} /></div></label>
      {showSuggestions && (!selected || name !== selected.name) && name.trim() && <div className="tracker-suggestions" aria-label="匹配的公司">{suggestions.map(c => <button type="button" key={c.id} onClick={() => { setSelected(c); setName(c.name); setWebsite(c.website); setCustom(c.isCustom); setShowSuggestions(false); }}><CompanyLogo name={c.name} website={c.website} /><span>{c.name}</span><small>{c.isCustom ? '我的公司' : '公司库'}</small></button>)}{!allCompanies.some(c => c.name === name.trim()) && <button type="button" className="tracker-create-company" onClick={() => { setCustom(true); setSelected(undefined); setShowSuggestions(false); }}>＋ 创建「{name.trim()}」</button>}</div>}
      {(custom || (name.trim() && !selected && !allCompanies.some(c => c.name === name.trim()))) && <label className="tracker-field">官网 <span className="tracker-optional">选填 · 自动获取图标</span><input value={website} maxLength={2048} placeholder="例如 example.com" onChange={e => setWebsite(e.target.value)} /><small>搜索不到的公司也可以直接记录，不填官网会使用文字头像。</small></label>}
      {selected && <div className="tracker-company-selected"><CompanyLogo name={name} website={selected.isCustom ? (() => { try { return normalizeWebsite(website); } catch { return ''; } })() : selected.website} /><span>{name}<small>{selected.isCustom ? '自定义公司' : '来自公司库'}</small></span></div>}
      <label className="tracker-field">岗位名称 <span className="tracker-required">*</span><input required maxLength={100} value={position} onChange={e => setPosition(e.target.value)} placeholder="例如 前端开发工程师" /></label>
      <details className="tracker-more" open={existing ? true : undefined}><summary>更多信息 · 投递日期与备注</summary><label className="tracker-field">投递日期<input required type="date" value={date} onChange={e => setDate(e.target.value)} /></label><label className="tracker-field">备注<textarea maxLength={2000} rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="填写投递备注" /></label></details>
      {!existing && <p className="tracker-help">默认今天投递，从「{data.template[0].name}」开始。保存后可以单独调整这份投递的流程。</p>}
      {existing && original?.isCustom && <p className="tracker-help">修改这家自定义公司的名称或官网，会同步更新它的其他投递记录。</p>}
      {(error || storageError) && <p role="alert" className="tracker-error">{storageError || error}</p>}
      <div className="tracker-actions"><button type="button" className="tracker-button" onClick={onClose}>取消</button><button className="tracker-button primary" type="submit">{existing ? '保存修改' : '保存投递'}<ArrowRight size={16} /></button></div>
    </form>
  </Modal>;
}

export function ApplicationDetail({ application, company, onSave, onEdit, onDelete, onClose, storageError }: { application: Application; company: Company; onSave: (a: Application) => boolean; onEdit: () => void; onDelete: () => boolean; onClose: () => void; storageError?: string }) {
  const [draft, setDraft] = useState(() => structuredClone(application));
  const [editingFlow, setEditingFlow] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [discardConfirm, setDiscardConfirm] = useState(false);
  const [error, setError] = useState('');
  const dirty = JSON.stringify(draft) !== JSON.stringify(application);
  const close = () => { if (dirty) setDiscardConfirm(true); else onClose(); };
  return <Modal title={company.name} subtitle={draft.position} onClose={close} wide>
    <div className="tracker-detail">
      {discardConfirm && <div className="tracker-warning">有尚未保存的修改。<div className="tracker-inline-actions"><button className="tracker-button" onClick={() => setDiscardConfirm(false)}>继续编辑</button><button className="tracker-button danger" onClick={onClose}>放弃修改并关闭</button></div></div>}
      <div className="tracker-detail-summary"><CompanyLogo name={company.name} website={company.website} /><div><span className={`tracker-badge ${outcome(draft)}`}>{OUTCOME_LABELS[outcome(draft)]}</span><p>投递于 {draft.appliedAt} · 更新于 {new Date(application.updatedAt).toLocaleDateString('zh-CN')}</p></div>{company.website && <a className="tracker-icon-button" href={company.website} target="_blank" rel="noopener noreferrer" aria-label="打开公司官网"><ExternalLink size={18} /></a>}</div>
      <div className="tracker-section-title"><h3>招聘进度</h3><button type="button" className="tracker-button small" disabled={dirty || editingFlow} onClick={onEdit}><Pencil size={14} />基本信息</button><button type="button" className="tracker-button small" onClick={() => setEditingFlow(!editingFlow)}><SlidersHorizontal size={14} />编辑流程</button></div>
      {editingFlow ? <FlowEditor initial={draft.stages} hasHistory onCancel={() => setEditingFlow(false)} onSave={definitions => { setDraft({ ...draft, stages: applyFlow(draft.stages, definitions) }); setEditingFlow(false); }} /> : <div className="tracker-timeline">{draft.stages.map((s, i) => <div key={s.id} className={`tracker-timeline-step ${s.status}`}>
        <span className="tracker-timeline-dot">{s.status === 'completed' ? '✓' : s.status === 'skipped' ? '−' : i + 1}</span>
        <div className="tracker-stage-content"><div className="tracker-stage-heading"><h4>{s.name}{s.isOffer && <small>OFFER</small>}</h4><select aria-label={`${s.name}状态`} value={s.status} onChange={e => setDraft({ ...draft, stages: changeStage(draft.stages, s.id, e.target.value as StageStatus) })}>{Object.entries(STAGE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          <div className="tracker-stage-fields">{['completed', 'rejected'].includes(s.status) && <label>完成 / 结果日期<input type="date" aria-label={`${s.name}完成日期`} value={s.completedAt} onChange={e => setDraft({ ...draft, stages: draft.stages.map(stage => stage.id === s.id ? { ...stage, completedAt: e.target.value } : stage) })} /></label>}
            <details open={s.note ? true : undefined}><summary>{s.note ? '阶段备注' : '添加备注'}</summary><textarea aria-label={`${s.name}备注`} maxLength={2000} rows={2} value={s.note} onChange={e => setDraft({ ...draft, stages: draft.stages.map(stage => stage.id === s.id ? { ...stage, note: e.target.value } : stage) })} placeholder="面试情况、准备事项…" /></details></div>
        </div>
      </div>)}</div>}
      <p className="tracker-help">直接推进到后续阶段时，之前未完成的阶段会标记为跳过；回退到某阶段会重置后续状态，保留备注。</p>
      <label className="tracker-field">投递备注<textarea maxLength={2000} rows={3} value={draft.note} onChange={e => setDraft({ ...draft, note: e.target.value })} placeholder="只写给自己的备忘，分享时默认隐藏。" /></label>
      <div className="tracker-inline-actions"><label className="tracker-check"><input type="checkbox" checked={draft.withdrawn} onChange={e => setDraft({ ...draft, withdrawn: e.target.checked })} />已取消投递</label><label className="tracker-check"><input type="checkbox" checked={draft.archived} onChange={e => setDraft({ ...draft, archived: e.target.checked })} />归档记录</label></div>
      {(error || storageError) && <p className="tracker-error" role="alert">{storageError || error}</p>}
      {deleteConfirm && <div className="tracker-warning">删除后将移除此岗位的所有阶段、日期和备注。建议先备份。<div className="tracker-inline-actions"><button className="tracker-button" onClick={() => setDeleteConfirm(false)}>保留记录</button><button className="tracker-button danger" onClick={() => { if (!onDelete()) setError('删除失败，原记录已保留。'); }}>确认删除这条投递</button></div></div>}
      <div className="tracker-actions"><button type="button" className="tracker-button danger" onClick={() => setDeleteConfirm(true)}>删除记录</button><div className="tracker-action-spacer" />{outcome(draft) === 'active' && currentStage(draft) && <button type="button" className="tracker-button" disabled={editingFlow} onClick={() => setDraft({ ...draft, stages: changeStage(draft.stages, currentStage(draft)!.id, 'completed') })}>完成当前阶段<ArrowRight size={16} /></button>}<button type="button" className="tracker-button primary" disabled={editingFlow} onClick={() => { if (!onSave({ ...draft, updatedAt: new Date().toISOString() })) setError('保存失败，请查看页面提示；修改已保留。'); }}>保存进度</button></div>
    </div>
  </Modal>;
}
