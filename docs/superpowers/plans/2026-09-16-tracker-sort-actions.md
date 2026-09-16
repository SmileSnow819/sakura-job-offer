# 投递列表排序与删除操作 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让投递列表默认按流程进度和更新时间排序，并为卡片及多选记录提供清晰、不会被页面滚动影响的删除入口。

**Architecture:** 将排序比较和批量删除的数据处理放进投递领域模型，页面只负责筛选、展示和调用现有 `save` 持久化机制。卡片底部使用详情/删除两个纵向操作，批量删除使用固定在视口底部且避开导航 Dock 的操作栏，并通过确认弹窗阻止误删。

**Tech Stack:** React、TypeScript、Lucide React、CSS、Node 原生测试、Vite+。

**Spec:** 本轮用户确认的“流程进度优先排序、卡片详情/删除、多选固定批量删除确认”要求。

## Global Constraints

- 不改变 TrackerData 数据结构和 localStorage 版本。
- 未通过仅在“全部状态”筛选时统一排在最后；筛选未通过时仍按阶段倒序、更新时间倒序。
- 同阶段使用 `updatedAt` 倒序，不能退回按导入顺序或投递日期排序。
- 删除沿用页面现有 `save` 保存机制；批量删除必须先确认。
- 修改 TypeScript、React、CSS 后运行 `pnpm test:tracker` 和 `pnpm check`，并实际打开页面验证卡片操作与固定操作栏。

### Task 1: 投递排序与删除领域逻辑

**Files:**

- Modify: `src/features/tracker/model.ts`
- Test: `scripts/test-tracker.mjs`

**Interfaces:**

- Produces `applicationStageRank(application: Application, template: StageDefinition[]): number`。
- Produces `compareApplicationsByProgress(left: Application, right: Application, template: StageDefinition[], rejectedLast: boolean): number`。
- Produces `removeApplications(data: TrackerData, ids: string[]): TrackerData`。

- [x] **Step 1: Write failing tests**

在 `scripts/test-tracker.mjs` 引入三个新函数，并添加测试：高阶段排在低阶段前；同阶段按 `updatedAt` 倒序；全部状态时未通过最后且未通过内部仍按阶段倒序；删除多个记录时保留仍被使用的公司并移除无引用的自定义公司。

- [x] **Step 2: Run `pnpm test:tracker` and verify the failure**

预期失败原因是新增导出函数尚不存在，而不是测试脚本语法错误。

- [x] **Step 3: Implement minimal domain helpers**

阶段排名取当前阶段在 `template` 中的索引；已完成/offer 且没有当前阶段的记录排在所有具体阶段之后。比较器先按“全部状态下未通过置后”，再按阶段排名倒序，最后按 `updatedAt` 倒序。`removeApplications` 只删除命中的应用，且仅清理删除后不再被任何应用引用的自定义公司。

- [x] **Step 4: Run `pnpm test:tracker` and verify all tests pass**

预期原有投递测试和新增排序/删除测试全部通过。

### Task 2: 页面排序、卡片操作与固定批量删除栏

**Files:**

- Modify: `src/pages/TrackerPage.tsx`
- Modify: `src/features/tracker/tracker.css`

**Interfaces:**

- Consumes the model helpers from Task 1 and the existing `commit(next, message)` persistence path.
- Adds a delete confirmation dialog state carrying one or more application IDs.

- [x] **Step 1: Wire the default sort**

默认 `sort` 改为 `progress`，默认选项显示“流程进度”；筛选结果的 `progress` 分支调用比较器，手动选择“最近更新、投递日期、公司名称”仍保持原有语义。

- [x] **Step 2: Replace card footer detail action**

卡片底部左侧改为详情和删除两个按钮，每个按钮使用 Lucide 图标在上、中文文字在下，并设置明确的 `aria-label` 和 `cursor: pointer`。删除按钮只打开确认弹窗，不直接删除。

- [x] **Step 3: Add reusable confirmation and batch deletion**

新增删除确认弹窗，展示单条或多条记录数量；确认后调用 `removeApplications`，再通过 `commit` 保存、清理已选 ID 并关闭弹窗。多选后渲染 `position: fixed` 的批量操作栏，显示数量、批量删除和取消选择，底部位置避开站点 Dock。

- [x] **Step 4: Add scoped responsive styles**

新增卡片纵向操作、危险操作 hover、固定批量栏及窄屏规则；不改动已有数据备份或导入弹窗样式。

### Task 3: 验证和交付

**Files:**

- Verify: `src/pages/TrackerPage.tsx`
- Verify: `src/features/tracker/model.ts`
- Verify: `src/features/tracker/tracker.css`

- [x] **Step 1: Run automated verification**

运行 `pnpm test:tracker`、`pnpm check`；检查工作区只包含本功能和计划文件的改动。

- [x] **Step 2: Perform browser acceptance**

在投递页确认默认排序顺序、切换未通过筛选后的顺序、卡片详情/删除操作位置、多选固定操作栏以及删除确认流程。验收过程中不确认删除真实记录。

- [x] **Step 3: Create commit and pull request**

按项目提交规范提交功能，推送 `codex/tracker-sort-actions`，创建 PR 关联 Task 1 创建的 Issue，并在 PR 中记录测试和页面验收结果。
