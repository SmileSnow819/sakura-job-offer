import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { Modal } from './components';
import { download } from './export';
import { emptyData, normalizeWebsite, parseData, STORAGE_KEY, today, type Company, type TrackerData } from './model';

export function DataDialog({ data, onSave, onClose, storageError }: { data: TrackerData; onSave: (data: TrackerData, recover?: boolean) => boolean; onClose: () => void; storageError?: string }) {
  const [incoming, setIncoming] = useState<TrackerData | null>(null);
  const [error, setError] = useState('');
  const [clearConfirm, setClearConfirm] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deleteCompanyId, setDeleteCompanyId] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const backup = () => download(new Blob([JSON.stringify({ ...data, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' }), `秋招备份-${today()}.json`);
  async function importFile(file?: File) {
    setIncoming(null); setError(''); setAcknowledged(false);
    if (!file) return;
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('备份文件不能超过 10 MB');
      setIncoming(parseData(await file.text()));
    } catch (cause) { setError(`无法导入：${(cause as Error).message}。现有记录未改动。`); }
    if (input.current) input.current.value = '';
  }
  return <Modal title="数据与备份" subtitle="记录只保存在当前浏览器，建议定期下载一份备份。" onClose={onClose}>
    <div className="tracker-data-dialog"><section><h3>带走完整的秋招记录</h3><p>JSON 备份包含公司、投递、流程和所有备注，可用于更换设备或浏览器后恢复。</p><button className="tracker-button primary" onClick={backup}><Download size={16} />下载 JSON 备份 · {data.applications.length} 条</button></section>
      <section><h3>从备份恢复</h3><p>导入前会校验内容，确认恢复后将替换当前全部记录和默认流程。</p><input ref={input} hidden type="file" accept=".json,application/json" aria-label="导入 JSON 备份" onChange={e => void importFile(e.target.files?.[0])} /><button className="tracker-button" onClick={() => input.current?.click()}><Upload size={16} />选择 JSON 文件</button>{incoming && <div className="tracker-warning"><strong>已读取 {incoming.applications.length} 条投递、{incoming.companies.length} 家公司</strong><p>当前 {data.applications.length} 条投递将被替换。请先下载当前备份。</p><label className="tracker-check"><input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} />我已备份，确认替换当前数据</label><button className="tracker-button primary" disabled={!acknowledged} onClick={() => { if (onSave(incoming, true)) onClose(); else setError('恢复失败，未替换当前数据。'); }}>确认恢复</button></div>}</section>
      {data.companies.some(c => c.isCustom) && <section><h3>自定义公司</h3><p>修改公司信息会同步到关联投递。没有关联投递的公司可以删除。</p><div className="tracker-company-manager">{data.companies.filter(c => c.isCustom).map(company => {
        const count = data.applications.filter(a => a.companyId === company.id).length;
        return <div key={company.id}><span>{company.name}<small>{count} 条投递</small></span><button className="tracker-button small" onClick={() => { setEditingCompany({ ...company }); setError(''); }}>编辑</button><button className="tracker-button small danger" disabled={count > 0} onClick={() => setDeleteCompanyId(company.id)}>删除</button>{deleteCompanyId === company.id && <div className="tracker-warning">确认删除「{company.name}」？<div className="tracker-inline-actions"><button className="tracker-button small" onClick={() => setDeleteCompanyId('')}>取消</button><button className="tracker-button small danger" onClick={() => { if (onSave({ ...data, companies: data.companies.filter(c => c.id !== company.id) })) setDeleteCompanyId(''); }}>确认删除公司</button></div></div>}</div>;
      })}</div>{editingCompany && <form className="tracker-company-edit" onSubmit={e => { e.preventDefault(); try { if (!editingCompany.name.trim()) throw new Error('请填写公司名称'); const company = { ...editingCompany, name: editingCompany.name.trim(), website: normalizeWebsite(editingCompany.website) }; if (onSave({ ...data, companies: data.companies.map(c => c.id === company.id ? company : c) })) setEditingCompany(null); } catch (cause) { setError((cause as Error).message); } }}><label className="tracker-field">公司名称<input required maxLength={100} value={editingCompany.name} onChange={e => setEditingCompany({ ...editingCompany, name: e.target.value })} /></label><label className="tracker-field">官网<input maxLength={2048} value={editingCompany.website} onChange={e => setEditingCompany({ ...editingCompany, website: e.target.value })} /></label><div className="tracker-inline-actions"><button type="button" className="tracker-button" onClick={() => setEditingCompany(null)}>取消</button><button className="tracker-button primary" type="submit">保存公司信息</button></div></form>}</section>}
      <section><h3>原始数据与清空</h3><p>如果本地记录无法读取，可以先导出原始数据以便恢复。清空仅影响「我的投递」。</p><div className="tracker-inline-actions"><button className="tracker-button" onClick={() => { try { const raw = localStorage.getItem(STORAGE_KEY); if (raw === null) { setError('当前没有已保存的原始数据。'); return; } download(new Blob([raw], { type: 'application/json' }), `秋招原始数据-${today()}.json`); } catch { setError('浏览器不允许读取本地存储。'); } }}>导出原始数据</button><button className="tracker-button danger" onClick={() => setClearConfirm(true)}>清空记录</button></div>{clearConfirm && <div className="tracker-warning"><p>所有投递、自定义公司和默认流程设置都将移除，只有备份可以恢复。</p><div className="tracker-inline-actions"><button className="tracker-button" onClick={() => setClearConfirm(false)}>取消</button><button className="tracker-button danger" onClick={() => { if (onSave(emptyData(), true)) onClose(); else setError('清空失败，原数据未改变。'); }}>确认清空全部记录</button></div></div>}</section>
      {(error || storageError) && <p role="alert" className="tracker-error">{storageError || error}</p>}
    </div>
  </Modal>;
}
