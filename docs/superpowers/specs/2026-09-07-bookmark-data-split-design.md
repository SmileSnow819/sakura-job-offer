# 招聘书签数据拆分设计

## 背景

当前 `src/bookmarks.json` 同时保存秋招专场、实习生招聘、求职工具和面经分享四个分类。招聘入口数据持续增加时，单个 JSON 文件不便于按板块维护，也容易在更新一个板块时误触其他板块。

本次改动只调整静态书签数据的文件组织方式，不改变页面展示、路由、筛选、投递预填或外部链接行为。

## 目标与边界

### 目标

- 将秋招、实习生招聘和求职工具拆成独立的 JSON 文件。
- 保持现有页面继续消费统一的分类数据结构，避免业务组件感知文件拆分。
- 保留现有所有书签内容、顺序、分类 ID 和链接字段。
- 更新维护文档，让后续新增入口能直接定位到对应文件。

### 不在本次范围内

- 不调整招聘入口的名称、URL、排序或分类归属。
- 不拆分 `data/autumn-watchlist.json`；它是官网校验缓存，不是前端展示书签。
- 不修改投递记录的数据模型、localStorage、导出逻辑或页面交互。
- 不新增后端、数据库或运行时网络加载。

## 方案

在 `src/bookmarks/` 下建立按内容板块划分的 JSON 文件：

- `autumn.json`：分类 ID 为 `autumn` 的秋招专场。
- `campus.json`：分类 ID 为 `campus` 的实习生招聘。
- `tools.json`：分类 ID 为 `tools` 的求职工具。
- `interviews.json`：分类 ID 为 `interviews` 的面经分享，当前保持空链接列表，以便四个现有分类都有明确归属。

新增 `src/bookmarks/index.ts` 作为唯一聚合入口。它导入上述 JSON，并导出与旧 `src/bookmarks.json` 相同的 `IBookmarkData` 形状：

```ts
export default {
  categories: [autumn, campus, tools, interviews],
} satisfies IBookmarkData;
```

页面和投递预填逻辑只改为从聚合入口导入，继续通过 `categories`、分类 ID 和 `links` 访问数据。这样文件组织可以变化，组件接口和运行时数据形状不变。

## 文件职责

| 文件 | 职责 |
| --- | --- |
| `src/bookmarks/autumn.json` | 维护秋招专场的静态招聘入口 |
| `src/bookmarks/campus.json` | 维护实习生招聘的静态入口 |
| `src/bookmarks/tools.json` | 维护求职工具入口 |
| `src/bookmarks/interviews.json` | 维护面经分类的静态配置 |
| `src/bookmarks/index.ts` | 组装分类并提供统一的类型化导入 |
| `src/types/bookmark.ts` | 继续作为分类和链接的类型来源 |
| `src/App.tsx` | 使用聚合数据渲染导航和路由 |
| `src/pages/BookmarksPage.tsx` | 使用聚合数据渲染书签页 |
| `src/pages/TrackerPage.tsx` | 使用聚合数据生成投递预填选项 |
| `README.md` | 记录拆分后的维护入口和官网校验文件边界 |

## 迁移与兼容

迁移时从现有 `src/bookmarks.json` 原样分配四个分类对象，保留字段顺序和数组顺序。迁移完成后删除旧的单文件，避免出现两个可编辑来源。

聚合入口使用静态 JSON import，不引入异步加载，因此不会改变首屏加载、路由切换或部署子路径行为。由于页面仍拿到同一个 `categories` 数组结构，现有 `autumn` 默认入口、`interviews` 外链处理和 Tracker 的公司选项逻辑都保持不变。

## 验证方案

1. 用 Node 解析四个 JSON，确认每个文件都是有效 JSON，且分类 ID 唯一、链接 URL 在原数据中保持不变。
2. 运行 `pnpm test:tracker`，确认投递流程回归测试不受静态数据导入调整影响。
3. 运行 `pnpm check`，确认 TypeScript、格式和 lint 检查通过。
4. 检查 `git diff`，确认只涉及书签文件、聚合入口和维护文档，不包含 `data/autumn-watchlist.json` 或其他用户未提交修改。

