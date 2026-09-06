---
name: vite-plus
description: 在 Sakura Job Offer 项目使用 Vite+ 开发、格式化、代码及类型检查、测试、构建和维护依赖。涉及 vp 命令、vite.config.ts、pnpm 锁文件或工具链问题时使用。
metadata:
  source: https://github.com/voidzero-dev/vite-plus/blob/03b659c9b37d640a9dafa633993ed58fae03124f/packages/cli/AGENTS.md
  upstream-commit: 03b659c9b37d640a9dafa633993ed58fae03124f
  verified-vite-plus-version: 0.3.0
---

# Vite+ 项目工作流

这是根据 Vite+ 官方 Agent 指南封装的本项目 Skill，并非官方发布的独立 Skill。首次使用时阅读 [官方指南快照](references/official-agents.md)，再按以下项目适配执行；快照为上游原文，升级时核对来源与项目配置后再更新。

## 先识别项目实际配置

阅读 `package.json`、`vite.config.ts`、`pnpm-workspace.yaml` 和 `.node-version`。依赖版本与命令以这些文件为准，不凭记忆替换成最新版本。

- 本项目使用本地 `vite-plus`，通过 pnpm 调用，不依赖全局 `vp`，也不为日常开发额外安装全局 CLI。
- `pnpm exec vp help` 查看本地命令，`pnpm exec vp toolchain` 查看工具版本；具体命令选项用 `--help` 核实。
- 官方指南中的全局环境诊断命令仅在全局 CLI 已存在且问题涉及它时使用。

## 命令选择

`vp <命令>` 是内置工具，`vp run <名称>` 才是脚本或任务。先检查脚本内容，不要因为名称相近跳过项目自己的验证步骤。

| 场景                           | 本项目命令                       |
| ------------------------------ | -------------------------------- |
| 根据锁文件恢复依赖             | `pnpm install --frozen-lockfile` |
| 启动开发服务                   | `pnpm dev`                       |
| 写入格式化结果                 | `pnpm format`                    |
| 只检查格式                     | `pnpm format:check`              |
| 代码与类型检查                 | `pnpm lint`                      |
| 格式、代码与类型检查           | `pnpm check`                     |
| 投递流程回归测试               | `pnpm test:tracker`              |
| 生产构建，包含 TypeScript 检查 | `pnpm build`                     |
| 预览生产构建                   | `pnpm preview`                   |

现有测试使用 Node 原生测试框架，不是 Vitest。不要用 `vp test` 代替 `pnpm test:tracker`；迁移测试框架是另一项改动。

日常实现完成运行 `pnpm check` 和受影响的测试。生产构建由 `.githooks/pre-commit` 在每次提交前执行；没有提交动作时，仅在发布、部署或用户明确要求完整验证时手动运行 `pnpm build`。

## 配置与依赖约束

- Oxfmt 规则写在 `vite.config.ts` 的 `fmt`，Oxlint 规则写在 `lint`，不重复引入 Prettier 或 ESLint 配置。
- 沿用 2 空格缩进、单引号、分号和 100 字符目标行宽；已有忽略项保护业务数据，格式化前查看改动范围。
- `vite` 是 `@voidzero-dev/vite-plus-core` 的兼容别名，供 React 插件及类型声明解析。升级时同时检查直接依赖、`overrides`、`vitest` pin 和 `peerDependencyRules`，不要混入另一份旧 Vite。
- 使用 pnpm 及 `pnpm-lock.yaml`；安装依赖是变更任务或依赖缺失时的步骤，不是每次只读查询都必须执行的动作。
- 保持 `base: '/sakura-job-offer/'` 与 GitHub Pages 路由一致。不要为接入 Agent 指南顺带安装 Git hooks 或触发部署。
- 检查提示需要判断原因，不盲目自动修复或全局关闭规则；必要的局部豁免要说明业务原因。

配置选项不清楚时，优先查本地 `node_modules/vite-plus/docs` 或 [官方文档](https://viteplus.dev/guide/)。
