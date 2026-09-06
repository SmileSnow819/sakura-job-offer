export type StageStatus = 'pending' | 'active' | 'completed' | 'skipped' | 'rejected';
export type Outcome = 'active' | 'offer' | 'rejected' | 'withdrawn' | 'completed';
export interface StageDefinition {
  id: string;
  name: string;
  isOffer: boolean;
}
export interface Stage extends StageDefinition {
  status: StageStatus;
  completedAt: string;
  note: string;
}
export interface Company {
  id: string;
  name: string;
  website: string;
  isCustom: boolean;
}
export interface Application {
  id: string;
  companyId: string;
  position: string;
  appliedAt: string;
  note: string;
  stages: Stage[];
  withdrawn: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  sourceKey?: string;
}
export interface TrackerData {
  version: 1;
  companies: Company[];
  applications: Application[];
  template: StageDefinition[];
}
export const STORAGE_KEY = 'sakura-offer-hub:tracker:v1';
export const STAGE_LABELS: Record<StageStatus, string> = {
  pending: '未开始',
  active: '进行中',
  completed: '已完成',
  skipped: '已跳过',
  rejected: '未通过',
};
export const OUTCOME_LABELS: Record<Outcome, string> = {
  active: '进行中',
  offer: '已拿 offer',
  rejected: '未通过',
  withdrawn: '已取消',
  completed: '流程完成',
};
export const uid = () => crypto.randomUUID();
export const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
export const defaultTemplate = (): StageDefinition[] =>
  ['简历初筛', '笔试', '一面', '二面', '三面', 'HR面', '意向', 'offer'].map((name) => ({
    id: uid(),
    name,
    isOffer: name === 'offer',
  }));
export const emptyData = (): TrackerData => ({
  version: 1,
  companies: [],
  applications: [],
  template: defaultTemplate(),
});

export interface QuickApplicationSeed {
  name: string;
  website: string;
}

const normalizeCompanyName = (name: string) =>
  name
    .replace(/(?:校园招聘|校招|招聘官网|招聘)$/, '')
    .trim()
    .slice(0, 100);

export function quickApplicationKey(seed: QuickApplicationSeed): string {
  const name = normalizeCompanyName(seed.name).toLocaleLowerCase();
  const website = normalizeWebsite(seed.website);
  return `bookmark:${name}:${website}`;
}

export function findQuickApplication(
  data: TrackerData,
  seed: QuickApplicationSeed,
): Application | undefined {
  const sourceKey = quickApplicationKey(seed);
  return data.applications.find((application) => application.sourceKey === sourceKey);
}

export function quickAddApplication(data: TrackerData, seed: QuickApplicationSeed): TrackerData {
  if (findQuickApplication(data, seed)) return data;
  const name = normalizeCompanyName(seed.name);
  if (!name) throw new Error('公司名称不能为空');
  const website = normalizeWebsite(seed.website);
  const company = data.companies.find(
    (item) =>
      item.name.toLocaleLowerCase() === name.toLocaleLowerCase() && item.website === website,
  ) ?? { id: uid(), name, website, isCustom: false };
  const timestamp = new Date().toISOString();
  const application: Application = {
    id: uid(),
    companyId: company.id,
    position: '',
    appliedAt: today(),
    note: '',
    stages: makeStages(data.template),
    withdrawn: false,
    archived: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    sourceKey: quickApplicationKey(seed),
  };
  return {
    ...data,
    companies: data.companies.some((item) => item.id === company.id)
      ? data.companies
      : [...data.companies, company],
    applications: [...data.applications, application],
  };
}

export function quickRemoveApplication(data: TrackerData, seed: QuickApplicationSeed): TrackerData {
  const application = findQuickApplication(data, seed);
  if (!application) return data;
  const applications = data.applications.filter((item) => item.id !== application.id);
  const companyStillUsed = applications.some((item) => item.companyId === application.companyId);
  return {
    ...data,
    applications,
    companies: companyStillUsed
      ? data.companies
      : data.companies.filter((item) => item.id !== application.companyId),
  };
}
// 为每条投递生成独立阶段 ID，后续编辑模板不会改动历史投递的流程。
export const makeStages = (template: StageDefinition[]): Stage[] =>
  template.map((s, i) => ({
    ...s,
    id: uid(),
    status: i === 0 ? 'active' : 'pending',
    completedAt: '',
    note: '',
  }));

export function normalizeWebsite(value: string): string {
  if (!value.trim()) return '';
  const input = value.trim();
  // 补全 https 前先拒绝非网页协议，防止把危险协议误当成域名。
  if (/^[a-z][a-z\d+.-]*:/i.test(input) && !/^https?:\/\//i.test(input))
    throw new Error('请输入 http 或 https 官网地址');
  try {
    const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      !url.hostname.includes('.') ||
      url.username ||
      url.password
    )
      throw new Error();
    return url.origin;
  } catch {
    throw new Error('官网格式不正确，例如 example.com');
  }
}

export function outcome(app: Application): Outcome {
  if (app.withdrawn) return 'withdrawn';
  if (app.stages.some((s) => s.status === 'rejected')) return 'rejected';
  // 普通末轮面试完成不等于拿到 offer，必须完成明确标记的 offer 阶段。
  if (app.stages.some((s) => s.isOffer && s.status === 'completed')) return 'offer';
  if (app.stages.every((s) => s.status === 'completed' || s.status === 'skipped'))
    return 'completed';
  return 'active';
}
export function currentStage(app: Application): Stage | undefined {
  return (
    app.stages.find((s) => s.status === 'rejected') ??
    app.stages.find((s) => s.status === 'active') ??
    app.stages.find((s) => s.status === 'pending')
  );
}
export const progress = (app: Application) =>
  Math.round(
    (app.stages.filter((s) => ['completed', 'skipped'].includes(s.status)).length /
      app.stages.length) *
      100,
  );

export const positionLabel = (position: string) => position.trim() || '待设置职位';

/**
 * 直接跳到后续轮次时，前面未完成的轮次标记为跳过，而不是虚构为已通过。
 * 回退会重置后续状态和结果日期，但保留备注；完成或跳过后激活下一待办阶段。
 */
export function changeStage(stages: Stage[], id: string, status: StageStatus): Stage[] {
  const index = stages.findIndex((s) => s.id === id);
  if (index < 0) return stages;
  const next = stages.map((s, i): Stage => {
    if (i < index && ['active', 'pending', 'rejected'].includes(s.status))
      return { ...s, status: 'skipped', completedAt: '' };
    if (
      i > index &&
      (['active', 'pending', 'rejected'].includes(status) ||
        s.status === 'active' ||
        s.status === 'rejected')
    )
      return { ...s, status: 'pending', completedAt: '' };
    if (i === index)
      return {
        ...s,
        status,
        completedAt:
          status === 'completed' || status === 'rejected' ? s.completedAt || today() : '',
      };
    return { ...s };
  });
  if (status === 'completed' || status === 'skipped') {
    const following = next.findIndex((s, i) => i > index && s.status === 'pending');
    if (following >= 0) next[following].status = 'active';
  }
  return next;
}

export function applyFlow(stages: Stage[], definitions: StageDefinition[]): Stage[] {
  const next = definitions.map((def) => ({
    ...(stages.find((s) => s.id === def.id) ?? {
      status: 'pending' as StageStatus,
      completedAt: '',
      note: '',
    }),
    ...def,
  }));
  if (!next.some((s) => s.status === 'active' || s.status === 'rejected')) {
    const first = next.find((s) => s.status === 'pending');
    if (first) first.status = 'active';
  }
  return next;
}

export function validateFlow(stages: StageDefinition[]): void {
  if (!stages.length || stages.length > 30) throw new Error('流程需要包含 1～30 个阶段');
  if (stages.some((s) => !s.name.trim() || s.name.trim().length > 30))
    throw new Error('阶段名称需要 1～30 个字');
  if (new Set(stages.map((s) => s.name.trim().toLocaleLowerCase())).size !== stages.length)
    throw new Error('阶段名称不能重复');
  if (stages.filter((s) => s.isOffer).length > 1) throw new Error('最多设置一个 offer 阶段');
  if (stages.some((s, i) => s.isOffer && i !== stages.length - 1))
    throw new Error('请将 offer 阶段放在流程末尾');
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const string = (v: unknown, max = 2000): v is string => typeof v === 'string' && v.length <= max;
const nonempty = (v: unknown, max = 160): v is string => string(v, max) && !!v.trim();
export const isDate = (v: unknown): v is string =>
  typeof v === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  Number.isFinite(Date.parse(v)) &&
  new Date(v).toISOString().slice(0, 10) === v;
const timestamp = (v: unknown): v is string =>
  string(v, 40) && /^\d{4}-\d{2}-\d{2}T/.test(v) && Number.isFinite(Date.parse(v));
const uniqueIds = (items: { id: string }[]) =>
  new Set(items.map((i) => i.id)).size === items.length;

// 本地读取和备份导入使用同一套校验，并重建白名单字段。
// 不接受未知版本或损坏的关联关系，避免不兼容数据覆盖现有记录。
export function parseData(raw: string): TrackerData {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error('数据不是有效的 JSON 文件');
  }
  if (!isObject(value) || value.version !== 1)
    throw new Error('备份版本不受支持，请使用本工具导出的 v1 备份');
  if (
    !Array.isArray(value.companies) ||
    !Array.isArray(value.applications) ||
    !Array.isArray(value.template) ||
    value.companies.length > 10000 ||
    value.applications.length > 10000
  )
    throw new Error('备份结构不完整或记录过多');
  function definition(s: unknown): StageDefinition {
    if (!isObject(s) || !nonempty(s.id) || !nonempty(s.name, 30) || typeof s.isOffer !== 'boolean')
      throw new Error('阶段数据无效');
    return { id: s.id, name: s.name.trim(), isOffer: s.isOffer };
  }
  const companies: Company[] = value.companies.map((c) => {
    if (
      !isObject(c) ||
      !nonempty(c.id) ||
      !nonempty(c.name, 100) ||
      !string(c.website, 2048) ||
      typeof c.isCustom !== 'boolean'
    )
      throw new Error('公司数据无效');
    return {
      id: c.id,
      name: c.name.trim(),
      website: normalizeWebsite(c.website),
      isCustom: c.isCustom,
    };
  });
  const applications: Application[] = value.applications.map((a) => {
    if (
      !isObject(a) ||
      !nonempty(a.id) ||
      !nonempty(a.companyId) ||
      !companies.some((c) => c.id === a.companyId) ||
      !string(a.position, 100) ||
      !isDate(a.appliedAt) ||
      !string(a.note) ||
      typeof a.withdrawn !== 'boolean' ||
      typeof a.archived !== 'boolean' ||
      !timestamp(a.createdAt) ||
      !timestamp(a.updatedAt) ||
      !(a.sourceKey === undefined || string(a.sourceKey, 2048)) ||
      !Array.isArray(a.stages)
    )
      throw new Error('投递记录无效或关联公司缺失');
    const stages: Stage[] = a.stages.map((s) => {
      const def = definition(s);
      if (
        !isObject(s) ||
        !string(s.status, 20) ||
        !Object.prototype.hasOwnProperty.call(STAGE_LABELS, s.status) ||
        !string(s.note) ||
        !(s.completedAt === '' || isDate(s.completedAt))
      )
        throw new Error('阶段状态或日期无效');
      return { ...def, status: s.status as StageStatus, note: s.note, completedAt: s.completedAt };
    });
    validateFlow(stages);
    if (
      !uniqueIds(stages) ||
      stages.filter((s) => s.status === 'active').length > 1 ||
      stages.filter((s) => s.status === 'rejected').length > 1 ||
      (stages.some((s) => s.status === 'rejected') && stages.some((s) => s.status === 'active'))
    )
      throw new Error('流程存在重复阶段或冲突的状态');
    return {
      id: a.id,
      companyId: a.companyId,
      position: a.position.trim(),
      appliedAt: a.appliedAt,
      note: a.note,
      stages,
      withdrawn: a.withdrawn,
      archived: a.archived,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      ...(string(a.sourceKey, 2048) && a.sourceKey ? { sourceKey: a.sourceKey } : {}),
    };
  });
  const template = value.template.map(definition);
  validateFlow(template);
  if (!uniqueIds(companies) || !uniqueIds(applications) || !uniqueIds(template))
    throw new Error('备份中存在重复 ID');
  return { version: 1, companies, applications, template };
}
