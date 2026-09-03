import { useEffect, useMemo, useState } from 'react';
import { Download, FileCode2, FileSpreadsheet, Image } from 'lucide-react';
import { Modal } from './components';
import {
  download,
  makeCsv,
  makeHtml,
  makePosters,
  THEMES,
  type ExportOptions,
  type ExportRecord,
} from './export';
import { today } from './model';

export function ExportDialog({
  all,
  filtered,
  selected,
  onClose,
}: {
  all: ExportRecord[];
  filtered: ExportRecord[];
  selected: ExportRecord[];
  onClose: () => void;
}) {
  const [scope, setScope] = useState(selected.length ? 'selected' : 'filtered');
  const [options, setOptions] = useState<ExportOptions>({
    title: `我的 ${new Date().getFullYear()} 秋招进度`,
    notes: false,
    websites: false,
    theme: 'blue',
  });
  const [format, setFormat] = useState('html');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [posters, setPosters] = useState<Blob[]>([]);
  const [page, setPage] = useState(0);
  const [posterUrl, setPosterUrl] = useState('');
  const records = scope === 'all' ? all : scope === 'selected' ? selected : filtered;
  const html = useMemo(() => makeHtml(records, options), [records, options]);
  useEffect(() => {
    setPosters([]);
    setPage(0);
  }, [scope, options]);
  useEffect(() => {
    if (!posters[page]) {
      setPosterUrl('');
      return;
    }
    const url = URL.createObjectURL(posters[page]);
    setPosterUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [posters, page]);
  async function generate() {
    if (!options.title.trim()) {
      setError('请填写标题');
      return;
    }
    if (!records.length) {
      setError('当前范围没有记录');
      return;
    }
    setError('');
    setBusy(true);
    try {
      if (format === 'csv')
        download(
          new Blob([makeCsv(records, options)], { type: 'text/csv;charset=utf-8' }),
          `秋招记录-${today()}.csv`,
        );
      else if (format === 'html')
        download(new Blob([html], { type: 'text/html;charset=utf-8' }), `秋招记录-${today()}.html`);
      else {
        setPosters(await makePosters(records, options));
        setPage(0);
      }
    } catch (cause) {
      setError(`导出失败：${(cause as Error).message}`);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title="导出记录"
      subtitle="选择范围、格式和需要包含的信息。"
      onClose={() => {
        if (!busy) onClose();
      }}
      wide
    >
      <div className="tracker-export">
        <fieldset disabled={busy}>
          <div className="tracker-format-tabs" role="group" aria-label="导出格式">
            {[
              { id: 'html', label: 'HTML 档案', Icon: FileCode2 },
              { id: 'csv', label: 'CSV 表格', Icon: FileSpreadsheet },
              { id: 'png', label: '分享海报', Icon: Image },
            ].map(({ id, label, Icon }) => (
              <button
                type="button"
                key={id}
                className={format === id ? 'active' : ''}
                aria-pressed={format === id}
                onClick={() => setFormat(id)}
              >
                <Icon size={19} />
                {label}
              </button>
            ))}
          </div>
          <div className="tracker-export-settings">
            <label className="tracker-field">
              导出范围
              <select value={scope} onChange={(e) => setScope(e.target.value)}>
                <option value="filtered">当前筛选 · {filtered.length} 条</option>
                <option value="all">全部记录 · {all.length} 条</option>
                <option value="selected" disabled={!selected.length}>
                  已选记录 · {selected.length} 条
                </option>
              </select>
            </label>
            {format !== 'csv' && (
              <label className="tracker-field">
                标题
                <input
                  maxLength={60}
                  value={options.title}
                  onChange={(e) => setOptions({ ...options, title: e.target.value })}
                />
              </label>
            )}
          </div>
          <div className="tracker-export-options">
            {format !== 'csv' && (
              <div className="tracker-theme-picker" role="group" aria-label="主题颜色">
                {Object.entries(THEMES).map(([theme, colors]) => (
                  <button
                    type="button"
                    key={theme}
                    aria-label={{ rose: '樱花粉', blue: '晴空蓝', mint: '薄荷绿' }[theme]}
                    aria-pressed={options.theme === theme}
                    className={options.theme === theme ? 'active' : ''}
                    style={{ background: colors.pale, color: colors.accent }}
                    onClick={() =>
                      setOptions({ ...options, theme: theme as ExportOptions['theme'] })
                    }
                  >
                    {options.theme === theme ? '✓' : '●'}
                  </button>
                ))}
              </div>
            )}
            <label className="tracker-check">
              <input
                type="checkbox"
                checked={options.notes}
                onChange={(e) => setOptions({ ...options, notes: e.target.checked })}
              />
              包含备注
            </label>
            <label className="tracker-check">
              <input
                type="checkbox"
                checked={options.websites}
                onChange={(e) => setOptions({ ...options, websites: e.target.checked })}
              />
              包含官网
            </label>
          </div>
        </fieldset>
        {format === 'html' && (
          <iframe className="tracker-html-preview" title="HTML 导出预览" sandbox="" srcDoc={html} />
        )}
        {format === 'csv' && (
          <div className="tracker-export-explanation">
            <FileSpreadsheet size={40} />
            <h3>CSV 表格</h3>
            <p>
              包含公司、岗位、状态、日期，以及所有自定义阶段的状态和完成日期。勾选后可导出投递备注与阶段备注。
            </p>
            <small>UTF-8 中文 CSV，可用 Excel / Numbers 打开。JSON 备份可用于恢复数据。</small>
          </div>
        )}
        {format === 'png' &&
          (posterUrl ? (
            <div className="tracker-poster-preview">
              <img src={posterUrl} alt={`分享海报预览，第 ${page + 1} 页`} />
              <div className="tracker-inline-actions">
                <button
                  className="tracker-button"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  上一页
                </button>
                <span>
                  {page + 1} / {posters.length}
                </span>
                <button
                  className="tracker-button"
                  disabled={page === posters.length - 1}
                  onClick={() => setPage(page + 1)}
                >
                  下一页
                </button>
                <button
                  className="tracker-button primary"
                  onClick={() => download(posters[page], `秋招海报-${today()}-${page + 1}.png`)}
                >
                  <Download size={16} />
                  下载第 {page + 1} 页
                </button>
              </div>
            </div>
          ) : (
            <div className="tracker-export-explanation">
              <Image size={40} />
              <h3>PNG 分享海报</h3>
              <p>
                分享选中的公司、当前阶段和进度统计，每页最多 5
                条记录。选择好范围和配色后，生成预览。
              </p>
            </div>
          ))}
        <p className="tracker-help">
          默认不包含备注和官网。HTML /
          海报使用文字头像，离线查看不依赖图标服务。海报为进度摘要，投递备注最多展示 3
          行；完整流程和阶段备注可导出 HTML / CSV。
        </p>
        {error && (
          <p className="tracker-error" role="alert">
            {error}
          </p>
        )}
        <div className="tracker-actions">
          <span className="tracker-help">本次导出 {records.length} 条记录</span>
          <button
            type="button"
            className="tracker-button primary"
            disabled={busy || !records.length}
            onClick={generate}
          >
            {busy ? '正在生成…' : format === 'png' ? '生成海报预览' : '下载文件'}
            <Download size={16} />
          </button>
        </div>
      </div>
    </Modal>
  );
}
