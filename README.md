# Sakura Job Offer

Sakura Job Offer 是一个面向校招生的招聘资源导航与投递进度管理工具。

它把常用的校招官网、秋招开放时间和个人投递记录放在一起，帮助你更快找到官方招聘入口，也更清楚地知道自己投到了哪一步。

![Sakura Job Offer 海报](public/img/QR-CODE/sakura_job_offer_poster.png)

## 功能

- **秋招专场**：集中查看秋招招聘入口，按公司、域名或链接搜索。
- **开放时间线**：按照招聘正式开放时间展示最近一周新开放的公司。
- **时间筛选**：支持查看今天、三天内、一周内开放的秋招公司，也可以恢复全部列表。
- **投递管理**：记录公司、职位、招聘阶段、阶段状态和备注。
- **自定义流程**：为不同公司的招聘流程单独调整阶段，支持推进、跳过、回退和未通过。
- **数据导出**：支持 JSON 备份恢复、CSV、离线 HTML 和 PNG 海报导出。
- **本地优先**：投递记录保存在当前浏览器，不需要登录；建议定期下载备份。

## 在线使用

项目部署在 GitHub Pages：

[打开 Sakura Job Offer](https://smilesnow819.github.io/sakura-job-offer/)

## 本地开发

环境要求：Node.js 22.23.0 及以上、pnpm 11.8.0。

```bash
pnpm install --frozen-lockfile
pnpm dev
```

开发服务器启动后，访问终端输出的地址。默认地址为：

```text
http://localhost:5173/sakura-job-offer/
```

常用命令：

```bash
pnpm check          # 格式、Lint 和 TypeScript 检查
pnpm test:bookmarks # 书签、时间线和响应式卡片测试
pnpm test:tracker   # 投递流程回归测试
pnpm build          # 生产构建
pnpm preview        # 预览生产构建
```

## 数据与隐私

- `src/bookmarks.json`：前端展示的招聘入口和分类数据。
- `data/autumn-watchlist.json`：秋招候选公司、官方入口和官网校验信息。
- `data/YYYY-MM-DD.md`：招聘官网日常维护日志。
- 投递记录保存在浏览器 `localStorage` 的 `sakura-offer-hub:tracker:v1` 中。

项目不会把个人投递记录自动上传到服务器。清除浏览器网站数据可能导致本地记录丢失，请通过「数据备份」定期下载 JSON 文件。

## 秋招数据维护

校验候选招聘官网：

```bash
# 只预览校验结果
pnpm exec node scripts/verify-autumn-watchlist.mjs

# 校验并写入最近检查时间、HTTP 状态和内容哈希
pnpm exec node scripts/verify-autumn-watchlist.mjs --write

# 只检查前 5 家，安全试跑
pnpm exec node scripts/verify-autumn-watchlist.mjs --limit=5
```

官网校验脚本只负责检查已有候选，不会自动发现新公司或直接修改书签。新增公司时，应确认链接属于公司官网、官方招聘官网或官方 ATS，再补充到 `src/bookmarks.json` 和维护日志中。

## 项目开发约定

- 前端使用 React、TypeScript、Vite+ 和 Tailwind CSS。
- 使用 pnpm 管理依赖，格式化与检查由 Vite+ 提供。
- 部署基础路径为 `/sakura-job-offer/`，修改路由或静态资源路径时需要同时考虑 GitHub Pages 和 EdgeOne Pages。
- 开始开发前请先阅读 [AGENTS.md](AGENTS.md) 和 [项目背景与协作偏好](docs/ai/project-context.md)。
- 更完整的提需求、验收和交接流程见 [AI 开发指南](docs/ai-development.md)。

## License

本项目主要用于个人学习、校招信息整理和演示。招聘信息的最终有效性以对应公司的官方页面为准。
