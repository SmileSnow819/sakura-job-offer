import {
  currentStage,
  outcome,
  OUTCOME_LABELS,
  positionLabel,
  progress,
  STAGE_LABELS,
  today,
  type Application,
  type Company,
} from './model.ts';

export interface ExportRecord {
  application: Application;
  company: Company;
}
export interface ExportOptions {
  title: string;
  notes: boolean;
  websites: boolean;
  theme: 'rose' | 'blue' | 'mint';
}
export const THEMES = {
  rose: { accent: '#b53d6b', pale: '#fff0f5' },
  blue: { accent: '#315baf', pale: '#edf3ff' },
  mint: { accent: '#247360', pale: '#eaf7f1' },
};
export function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
// 引号转义之外还需拦截公式前缀，避免用户内容在表格软件里被作为公式执行。
const csvCell = (s: string) =>
  `"${(/^[\s\uFEFF]*[=+\-@]/.test(s) || /^[\t\r\n]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
export function makeCsv(
  records: ExportRecord[],
  options: Pick<ExportOptions, 'notes' | 'websites'>,
): string {
  const names = [...new Set(records.flatMap((r) => r.application.stages.map((s) => s.name)))];
  const header = [
    '公司名称',
    '岗位名称',
    '投递日期',
    '当前阶段',
    '投递状态',
    '已归档',
    '最近更新时间',
    ...(options.websites ? ['官网'] : []),
    ...(options.notes ? ['备注'] : []),
    ...names.flatMap((n) => [
      `${n} · 状态`,
      `${n} · 完成时间`,
      ...(options.notes ? [`${n} · 备注`] : []),
    ]),
  ];
  const rows = records.map(({ application: a, company: c }) => [
    c.name,
    positionLabel(a.position),
    a.appliedAt,
    currentStage(a)?.name ?? OUTCOME_LABELS[outcome(a)],
    OUTCOME_LABELS[outcome(a)],
    a.archived ? '是' : '否',
    a.updatedAt,
    ...(options.websites ? [c.website] : []),
    ...(options.notes ? [a.note] : []),
    ...names.flatMap((name) => {
      const stage = a.stages.find((s) => s.name === name);
      return [
        stage ? STAGE_LABELS[stage.status] : '不适用',
        stage?.completedAt ?? '',
        ...(options.notes ? [stage?.note ?? ''] : []),
      ];
    }),
  ]);
  return '\uFEFF' + [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
}

export function makeHtml(records: ExportRecord[], options: ExportOptions): string {
  const { accent, pale } = THEMES[options.theme];
  const e = escapeHtml;
  const active = records.filter((r) => outcome(r.application) === 'active').length;
  const offers = records.filter((r) => outcome(r.application) === 'offer').length;
  const offerCompanies = [
    ...new Map(
      records
        .filter((record) => outcome(record.application) === 'offer')
        .map((record) => [record.company.id, record.company]),
    ).values(),
  ];
  // 使用文字头像，确保导出的 HTML 离线打开时不依赖第三方图片服务。
  const cards = offerCompanies
    .map(
      (company) =>
        `<article><span class="avatar">${e(Array.from(company.name)[0] ?? '?')}</span><h2>${e(company.name)}</h2></article>`,
    )
    .join('');
  const offerContent = cards || '<div class="empty">当前导出范围内还没有 Offer</div>';
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${e(options.title)}</title><style>
*{box-sizing:border-box}body{margin:0;color:#332d38;background:${pale};font:15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}main{max-width:980px;margin:auto;padding:60px 24px}h1{font-size:clamp(26px,5vw,38px);letter-spacing:-1.5px;margin:12px 0;overflow-wrap:anywhere}.eyebrow{font-size:12px;letter-spacing:3px;color:${accent};font-weight:700}.intro{color:#786c7d}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:30px 0 42px}.stat{padding:20px;border:1px solid;border-radius:16px}.stat b{display:block;font-size:36px;line-height:1.2;margin-bottom:5px}.stat.total{color:#a23f65;border-color:#efb8cc;background:#fff1f6}.stat.active{color:#8a5700;border-color:#e8c46e;background:#fff5d9}.stat.offer{color:#087a4c;border-color:#72cda6;background:#e7faef}.section-title{font-size:16px;margin:0 0 14px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}article{display:flex;align-items:center;gap:12px;background:#fff;border:1px solid #bde5d3;border-radius:16px;padding:18px 20px;break-inside:avoid;box-shadow:0 10px 32px #275c4510}h2{font-size:19px;margin:0;overflow-wrap:anywhere}.avatar{flex-shrink:0;display:grid;place-items:center;width:44px;height:44px;border-radius:14px;background:#e5f8ef;color:#087a4c;font-size:22px;font-weight:700}.empty{grid-column:1/-1;padding:52px 20px;border:1px dashed #d8cdd2;border-radius:16px;background:#ffffff91;color:#8a7d83;text-align:center}footer{margin-top:36px;color:#817684;font-size:12px}@media(max-width:650px){main{padding:30px 16px}.stats{gap:8px}.stat{padding:14px}.stat b{font-size:28px}.grid{grid-template-columns:1fr}article{padding:16px}}@media print{body{background:white}main{padding:0}.grid{display:block}article{margin:16px 0}.stats{margin:16px 0}}
</style></head><body><main><div class="eyebrow">SAKURA OFFER HUB</div><h1>${e(options.title)}</h1><p class="intro">投递概览与 Offer 记录</p><div class="stats"><div class="stat total"><b>${records.length}</b>投递数量</div><div class="stat active"><b>${active}</b>进行中</div><div class="stat offer"><b>${offers}</b>Offer 数量</div></div><h2 class="section-title">已拿 Offer 的公司</h2><div class="grid">${offerContent}</div><footer>Sakura Offer Hub · 导出于 ${today()} · 此文件为离线快照</footer></main></body></html>`;
}

function lines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const result: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const char of Array.from(paragraph)) {
      if (line && ctx.measureText(line + char).width > maxWidth) {
        result.push(line);
        line = char;
      } else line += char;
    }
    result.push(line);
  }
  return result;
}
export async function makePosters(
  records: ExportRecord[],
  options: ExportOptions,
): Promise<Blob[]> {
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
      const roles = lines(ctx, positionLabel(a.position), 554);
      ctx.font = '17px sans-serif';
      const website = options.websites && c.website ? lines(ctx, c.website, 740) : [];
      // 海报只显示摘要；完整阶段备注保留在 HTML / CSV，避免长文本撑坏版面。
      const note = options.notes && a.note ? lines(ctx, `备注：${a.note}`, 740).slice(0, 3) : [];
      if (options.notes && lines(ctx, `备注：${a.note}`, 740).length > 3 && note.length)
        note[note.length - 1] = note[note.length - 1].slice(0, -1) + '…';
      return {
        a,
        c,
        names,
        roles,
        website,
        note,
        height:
          140 + names.length * 34 + roles.length * 28 + website.length * 24 + note.length * 24,
      };
    });
    const height = headerHeight + layouts.reduce((h, l) => h + l.height + 18, 0) + 90;
    canvas.width = width * 2;
    canvas.height = height * 2;
    ctx.scale(2, 2);
    ctx.fillStyle = theme.pale;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = theme.accent;
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('SAKURA OFFER HUB', 48, 58);
    ctx.fillStyle = '#332d38';
    ctx.font = 'bold 38px sans-serif';
    titleLines.forEach((line, i) => ctx.fillText(line, 48, 115 + i * 48));
    const titleBottom = 115 + (titleLines.length - 1) * 48;
    ctx.fillStyle = '#817684';
    ctx.font = '18px sans-serif';
    ctx.fillText(`更新于 ${today()}`, 48, titleBottom + 42);
    const stats = [
      [records.length, '投递记录'],
      [records.filter((r) => outcome(r.application) === 'active').length, '进行中'],
      [records.filter((r) => outcome(r.application) === 'offer').length, '已拿 offer'],
    ];
    stats.forEach(([value, label], i) => {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(48 + i * 272, titleBottom + 70, 256, 110, 18);
      ctx.fill();
      ctx.fillStyle = theme.accent;
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText(String(value), 70 + i * 272, titleBottom + 116);
      ctx.fillStyle = '#817684';
      ctx.font = '16px sans-serif';
      ctx.fillText(String(label), 70 + i * 272, titleBottom + 153);
    });
    let y = headerHeight;
    for (const { a, c, names, roles, website, note, height: cardHeight } of layouts) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(48, y, 804, cardHeight, 22);
      ctx.fill();
      ctx.fillStyle = theme.pale;
      ctx.beginPath();
      ctx.roundRect(70, y + 24, 54, 54, 16);
      ctx.fill();
      ctx.fillStyle = theme.accent;
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(Array.from(c.name)[0] ?? '?', 82, y + 61);
      ctx.fillStyle = '#332d38';
      ctx.font = 'bold 26px sans-serif';
      names.forEach((n, i) => ctx.fillText(n, 142, y + 49 + i * 34));
      let cursor = y + 49 + names.length * 34;
      ctx.fillStyle = '#817684';
      ctx.font = '20px sans-serif';
      roles.forEach((r) => {
        ctx.fillText(r, 142, cursor);
        cursor += 28;
      });
      cursor += 12;
      ctx.fillStyle = theme.accent;
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(
        `${OUTCOME_LABELS[outcome(a)]}${a.archived ? ' · 已归档' : ''}  /  ${currentStage(a)?.name ?? '流程已结束'}`,
        70,
        cursor,
      );
      cursor += 22;
      ctx.fillStyle = theme.pale;
      ctx.fillRect(70, cursor, 760, 5);
      ctx.fillStyle = theme.accent;
      ctx.fillRect(70, cursor, (760 * progress(a)) / 100, 5);
      cursor += 29;
      ctx.fillStyle = '#817684';
      ctx.font = '17px sans-serif';
      ctx.fillText(
        `投递于 ${a.appliedAt} · 已完成 / 跳过 ${a.stages.filter((s) => ['completed', 'skipped'].includes(s.status)).length}/${a.stages.length} 个阶段`,
        70,
        cursor,
      );
      for (const text of [...website, ...note]) {
        cursor += 24;
        ctx.fillText(text, 70, cursor);
      }
      y += cardHeight + 18;
    }
    ctx.fillStyle = '#817684';
    ctx.font = '15px sans-serif';
    ctx.fillText(`Sakura Offer Hub · ${today()}`, 48, height - 40);
    ctx.fillText(`${page + 1} / ${chunks.length}`, 792, height - 40);
    pages.push(
      await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (blob) =>
            blob ? resolve(blob) : reject(new Error('海报生成失败，请减少记录数量后重试')),
          'image/png',
        ),
      ),
    );
  }
  return pages;
}
