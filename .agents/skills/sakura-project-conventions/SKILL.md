---
name: sakura-project-conventions
description: 在 Sakura Job Offer 项目编写或评审 TypeScript、React 组件、页面、Hooks 和 CSS 时使用，落实命名、组件结构、类型、缩进及中文业务注释规范。纯招聘数据维护不触发。
---

# 项目开发规范

适用于项目的 React、TypeScript、CSS 和 Vite+ 工具链。修改前阅读相邻模块，保留已有结构，不借规范整理扩大功能变更范围。

## 命名与文件组织

- 组件目录和组件名使用 PascalCase；独立组件沿用 `src/components/ComponentName/index.tsx`，局部样式使用 `index.module.css`，子组件使用 PascalCase 文件名。
- 页面沿用当前 `src/pages/TrackerPage.tsx` 这种 PascalCase 文件名；若页面拆成目录，则入口使用 `index.tsx`，不要仅为统一规范重排目录。
- 工具函数、工具文件与普通目录使用 camelCase，如 `utils/getFavicon.ts`；类型文件沿用 `types/bookmark.ts`。
- 函数和变量使用 camelCase，事件处理函数用 `handle` 前缀，自定义 Hook 用 `use` 前缀，常量使用 UPPER_SNAKE_CASE。
- 新组件 Props 接口使用 `I[ComponentName]Props`，专门的 State 接口使用 `I[ComponentName]State`。现有领域模型不强制重命名。
- 若使用枚举，枚举名采用 PascalCase 加 `Enum` 后缀，每项用中文 JSDoc 说明业务含义。

## TypeScript 与 React

- 使用函数组件和 Hooks；为 Props、公共函数参数及返回值定义清晰类型。局部变量允许类型推断，避免 `any`，未知外部数据先用 `unknown` 校验。
- 对象形状优先使用 `interface`，联合类型使用 `type`；组件使用函数声明或 `React.FC`。
- Props 区分必需与可选字段，提供合理默认值；回调名体现触发的动作。
- 保持组件职责单一，复杂 JSX 和重复行为拆成有意义的子组件或函数。文件接近 500 行时审视拆分机会，避免继续堆叠到千行；不能靠压缩行数满足可读性要求。
- 有实际重渲染成本时再使用 `React.memo`、`useMemo` 和 `useCallback`，不要给每个组件机械添加缓存。

## 导入与格式

- 第三方库导入在前，内部模块在后，适当分组。
- 当前项目没有路径别名，沿用相对路径；不要生成尚未配置的 `@/` 导入，也不要为了规则单独新增别名。
- 使用 `vite.config.ts` 中的 Oxfmt 规则：2 空格、单引号、分号、100 字符目标行宽。
- JSX、对象、条件分支和 CSS 保持可读的多行结构，不把整个组件或多条语句挤在一行。通过 `pnpm format` 格式化修改，通过 `pnpm check` 检查；不要另造一套手工排序或格式规则。

## 样式

- 新独立组件优先 CSS Modules，沿用所在模块现有类名风格；不要求引入当前未使用的 Less。
- 已有全局样式与 `tracker.css` 保留作用域前缀，避免污染其他页面；不强制为统一规范重写所有样式。
- 选择器尽量扁平，嵌套通常不超过 3 层，避免不必要的 `!important`。
- 静态样式优先写入样式文件；动态值或动画库需要的内联样式可以保留。动画优先使用 transform、opacity，避免不必要的布局抖动。

## 注释与业务边界

- 用中文解释业务约束、边界条件和设计原因，而不是复述赋值、循环等代码表面行为。
- 阶段跳转与回退、offer 判定、流程副本、损坏数据保护、跨标签页保存冲突、导出转义等非显然逻辑应有说明。
- 不把 UI 改动变成存储结构迁移；修改持久化或流程规则时同步更新相应回归测试。
- 源码整理不应修改 `data/` 和公司 JSON；保留用户的未提交内容。

## 验证

前端改动完成后运行 `pnpm check`、`pnpm test:tracker` 和 `pnpm build`。涉及交互或视觉变化时再进行相应页面验证；纯规范文档修改只需格式检查和 Skill 校验。
