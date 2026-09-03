import { currentStage, outcome, OUTCOME_LABELS, progress, STAGE_LABELS, today, type Application, type Company } from './model.ts';

export interface ExportRecord { application: Application; company: Company }
export interface ExportOptions { title: string; notes: boolean; websites: boolean; theme: 'rose' | 'blue' | 'mint' }
export const THEMES = { rose: { accent: '#b53d6b', pale: '#fff0f5' }, blue: { accent: '#315baf', pale: '#edf3ff' }, mint: { accent: '#247360', pale: '#eaf7f1' } };
export function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const csvCell = (s: string) => `"${(/^[\s\uFEFF]*[=+\-@]/.test(s) || /^[\t\r\n]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
export function makeCsv(records: ExportRecord[], options: Pick<ExportOptions, 'notes' | 'websites'>): string {
  const names = [...new Set(records.flatMap(r => r.application.stages.map(s => s.name)))];
  const header = ['公司名称', '岗位名称', '投递日期', '当前阶段', '投递状态', '已归档', '最近更新时间', ...(options.websites ? ['官网'] : []), ...(options.notes ? ['备注'] : []), ...names.flatMap(n => [`${n} · 状态`, `${n} · 完成时间`, ...(options.notes ? [`${n} · 备注`] : [])])];
  const rows = records.map(({ application: a, company: c }) => [c.name, a.position, a.appliedAt, currentStage(a)?.name ?? OUTCOME_LABELS[outcome(a)], OUTCOME_LABELS[outcome(a)], a.archived ? '是' : '否', a.updatedAt, ...(options.websites ? [c.website] : []), ...(options.notes ? [a.note] : []), ...names.flatMap(name => {
    const stage = a.stages.find(s => s.name === name);
    return [stage ? STAGE_LABELS[stage.status] : '不适用', stage?.completedAt ?? '', ...(options.notes ? [stage?.note ?? ''] : [])];
  })]);
  return '\uFEFF' + [header, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n');
}

export function makeHtml(records: ExportRecord[], options: ExportOptions): string {
  const { accent, pale } = THEMES[options.theme];
  const e = escapeHtml;
  const active = records.filter(r => outcome(r.application) === 'active').length;
  const offers = records.filter(r => outcome(r.application) === 'offer').length;
  // Initial avatars keep the offline artifact independent of third-party images.
  const cards = records.map(({ application: a, company: c }) => `<article><header><span class="avatar">${e(Array.from(c.name)[0] ?? '?')}</span><div><h2>${e(c.name)}</h2><p>${e(a.position)}</p></div><span class="badge">${e(OUTCOME_LABELS[outcome(a)])}${a.archived ? ' · 已归档' : ''}</span></header><div class="meta">投递于 ${e(a.appliedAt)} · 更新于 ${e(new Date(a.updatedAt).toLocaleDateString('zh-CN'))}</div>${options.websites && c.website ? `<p><a href="${e(c.website)}" rel="noopener noreferrer">${e(c.website)}</a></p>` : ''}<ol>${a.stages.map(s => `<li class="${s.status}"><span class="dot"></span><div><strong>${e(s.name)}</strong><span class="meta">${STAGE_LABELS[s.status]}${s.completedAt ? ` · ${e(s.completedAt)}` : ''}</span>${options.notes && s.note ? `<p class="note">${e(s.note)}</p>` : ''}</div></li>`).join('')}</ol>${options.notes && a.note ? `<p class="note application-note">${e(a.note)}</p>` : ''}</article>`).join('');
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${e(options.title)}</title><style>
*{box-sizing:border-box}body{margin:0;color:#332d38;background:${pale};font:15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}main{max-width:1100px;margin:auto;padding:60px 24px}h1{font-size:clamp(26px,5vw,34px);letter-spacing:-1.5px;margin:12px 0;overflow-wrap:anywhere}.eyebrow{font-size:12px;letter-spacing:3px;color:${accent};font-weight:700}.intro{color:#786c7d}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:28px 0 36px}.stat{padding:20px;border:1px solid #fff;background:#ffffffa8;border-radius:8px}.stat b{display:block;font-size:32px;color:${accent}}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}article{background:#fff;border:1px solid #e9e3e9;border-radius:8px;padding:24px;break-inside:avoid}header{display:flex;align-items:center;gap:12px}header>div{min-width:0;flex:1}h2{font-size:19px;margin:0;overflow-wrap:anywhere}p{margin:4px 0;overflow-wrap:anywhere}a{color:${accent}}.avatar{flex-shrink:0;display:grid;place-items:center;width:44px;height:44px;border-radius:14px;background:${pale};color:${accent};font-size:22px;font-weight:700}.badge{font-size:11px;background:${pale};color:${accent};padding:5px 10px;border-radius:8px;flex-shrink:0}.meta{display:block;color:#817684;font-size:12px;margin-top:8px}ol{list-style:none;padding:0;margin:24px 0 0}li{display:flex;gap:12px;position:relative;padding:0 0 20px}li:last-child{padding-bottom:0}li:not(:last-child):before{content:"";position:absolute;top:13px;bottom:0;left:5px;border-left:2px solid #ede7ee}.dot{width:12px;height:12px;flex-shrink:0;margin-top:6px;border:2px solid #d9cedb;border-radius:50%;background:white;z-index:1}.completed .dot{background:#41806b;border-color:#41806b}.active .dot{background:${accent};border-color:${accent};box-shadow:0 0 0 4px ${pale}}.rejected .dot{background:#bc5555;border-color:#bc5555}.skipped .dot{background:#d9cedb}.note{white-space:pre-wrap;font-size:13px;color:#62546b}.application-note{padding:12px;background:${pale};border-radius:12px;margin-top:20px}footer{margin-top:36px;color:#817684;font-size:12px}@media(max-width:650px){main{padding:30px 16px}.grid{grid-template-columns:1fr}.stat{padding:14px}article{padding:20px}header{flex-wrap:wrap}.badge{margin-left:auto}}@media print{body{background:white}main{padding:0}.grid{display:block}article{margin:16px 0}.stats{margin:16px 0}}
</style></head><body><main><div class="eyebrow">SAKURA OFFER HUB</div><h1>${e(options.title)}</h1><p class="intro">公司、岗位与招聘流程记录</p><div class="stats"><div class="stat"><b>${records.length}</b>投递记录 · ${new Set(records.map(r => r.company.id)).size} 家公司</div><div class="stat"><b>${active}</b>进行中</div><div class="stat"><b>${offers}</b>已拿 offer</div></div><div class="grid">${cards}</div><footer>Sakura Offer Hub · 导出于 ${today()} · 此文件为离线快照</footer></main></body></html>`;
}

function lines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const result: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const char of Array.from(paragraph)) {
      if (line && ctx.measureText(line + char).width > maxWidth) { result.push(line); line = char; }
      else line += char;
    }
    result.push(line);
  }
  return result;
}
export async function makePosters(records: ExportRecord[], options: ExportOptions): Promise<Blob[]> {
  if (!records.length) throw new Error('请先选择要分享的记录');
  if (typeof document === 'undefined') throw new Error('当前环境无法生成海报，请使用 HTML 导出');
  await document.fonts.ready;
  const pages: Blob[] = [];
  const theme = THEMES[options.theme];
  const chunks: ExportRecord[][] = [];
  for (let i = 0; i < records.length; i += 5) chunks.push(records.slice(i, i + 5));
  for (const [page, chunk] of chunks.entries()) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('当前浏览器无法生成海报，请使用 HTML 导出');
    const width = 900;
    ctx.font = 'bold 38px sans-serif';
    const titleLines = lines(ctx, options.title, 772);
    const headerHeight = 286 + titleLines.length * 48;
    const layouts = chunk.map(({ application: a, company: c }) => {
      ctx.font = 'bold 26px sans-serif';
      const names = lines(ctx, c.name, 554);
      ctx.font = '20px sans-serif';
      const roles = lines(ctx, a.position, 554);
      ctx.font = '17px sans-serif';
      const website = options.websites && c.website ? lines(ctx, c.website, 740) : [];
      // Posters are summaries; detailed stage notes remain in HTML/CSV exports.
      const note = options.notes && a.note ? lines(ctx, `备注：${a.note}`, 740).slice(0, 3) : [];
      if (options.notes && lines(ctx, `备注：${a.note}`, 740).length > 3 && note.length) note[note.length - 1] = note[note.length - 1].slice(0, -1) + '…';
      return { a, c, names, roles, website, note, height: 140 + names.length * 34 + roles.length * 28 + website.length * 24 + note.length * 24 };
    });
    const height = headerHeight + layouts.reduce((h, l) => h + l.height + 18, 0) + 90;
    canvas.width = width * 2; canvas.height = height * 2;
    ctx.scale(2, 2);
    ctx.fillStyle = theme.pale; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = theme.accent; ctx.font = 'bold 14px sans-serif'; ctx.fillText('SAKURA OFFER HUB', 48, 58);
    ctx.fillStyle = '#332d38'; ctx.font = 'bold 38px sans-serif';
    titleLines.forEach((line, i) => ctx.fillText(line, 48, 115 + i * 48));
    const titleBottom = 115 + (titleLines.length - 1) * 48;
    ctx.fillStyle = '#817684'; ctx.font = '18px sans-serif'; ctx.fillText(`更新于 ${today()}`, 48, titleBottom + 42);
    const stats = [[records.length, '投递记录'], [records.filter(r => outcome(r.application) === 'active').length, '进行中'], [records.filter(r => outcome(r.application) === 'offer').length, '已拿 offer']];
    stats.forEach(([value, label], i) => {
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(48 + i * 272, titleBottom + 70, 256, 110, 18); ctx.fill();
      ctx.fillStyle = theme.accent; ctx.font = 'bold 34px sans-serif'; ctx.fillText(String(value), 70 + i * 272, titleBottom + 116);
      ctx.fillStyle = '#817684'; ctx.font = '16px sans-serif'; ctx.fillText(String(label), 70 + i * 272, titleBottom + 153);
    });
    let y = headerHeight;
    for (const { a, c, names, roles, website, note, height: cardHeight } of layouts) {
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(48, y, 804, cardHeight, 22); ctx.fill();
      ctx.fillStyle = theme.pale; ctx.beginPath(); ctx.roundRect(70, y + 24, 54, 54, 16); ctx.fill();
      ctx.fillStyle = theme.accent; ctx.font = 'bold 28px sans-serif'; ctx.fillText(Array.from(c.name)[0] ?? '?', 82, y + 61);
      ctx.fillStyle = '#332d38'; ctx.font = 'bold 26px sans-serif'; names.forEach((n, i) => ctx.fillText(n, 142, y + 49 + i * 34));
      let cursor = y + 49 + names.length * 34;
      ctx.fillStyle = '#817684'; ctx.font = '20px sans-serif'; roles.forEach(r => { ctx.fillText(r, 142, cursor); cursor += 28; });
      cursor += 12;
      ctx.fillStyle = theme.accent; ctx.font = 'bold 18px sans-serif'; ctx.fillText(`${OUTCOME_LABELS[outcome(a)]}${a.archived ? ' · 已归档' : ''}  /  ${currentStage(a)?.name ?? '流程已结束'}`, 70, cursor);
      cursor += 22;
      ctx.fillStyle = theme.pale; ctx.fillRect(70, cursor, 760, 5);
      ctx.fillStyle = theme.accent; ctx.fillRect(70, cursor, 760 * progress(a) / 100, 5);
      cursor += 29;
      ctx.fillStyle = '#817684'; ctx.font = '17px sans-serif'; ctx.fillText(`投递于 ${a.appliedAt} · 已完成 / 跳过 ${a.stages.filter(s => ['completed', 'skipped'].includes(s.status)).length}/${a.stages.length} 个阶段`, 70, cursor);
      for (const text of [...website, ...note]) { cursor += 24; ctx.fillText(text, 70, cursor); }
      y += cardHeight + 18;
    }
    ctx.fillStyle = '#817684'; ctx.font = '15px sans-serif'; ctx.fillText(`Sakura Offer Hub · ${today()}`, 48, height - 40); ctx.fillText(`${page + 1} / ${chunks.length}`, 792, height - 40);
    pages.push(await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('海报生成失败，请减少记录数量后重试')), 'image/png')));
  }
  return pages;
}
