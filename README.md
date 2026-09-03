# Sakura Job Offer 秋招数据维护

## 我的投递

底部导航的「我的投递」打开 `/tracker`，公司目录卡片和表格中的记录按钮也可预填公司。新增仅需公司与岗位；未收录公司可以直接添加，官网选填，图标获取失败时显示文字头像。

- 每条投递保存独立流程，支持增删、重命名、拖拽/按钮排序、跳过、回退和阶段备注。修改默认流程只影响新记录。
- 完成明确标记的 offer 阶段才计为「已拿 offer」；取消、未通过和普通流程完成分别统计，归档不会删除数据。
- 桌面默认表格，手机默认卡片。支持搜索、状态/归档筛选、排序和多选；ECharts 统计默认收起，按需加载近 30 天趋势与当前阶段分布。
- CSV 支持不同招聘流程的阶段列；HTML 为无外部依赖的离线档案；PNG 海报每页最多 5 条，支持颜色、范围选择和预览下载。备注和官网默认不导出，海报只展示进度摘要。
- 数据保存在 `localStorage` 的 `sakura-offer-hub:tracker:v1` 下，使用带版本号的单次原子写入。没有登录或云同步；清除浏览器网站数据会丢失记录，请在「数据备份」下载 JSON。
- JSON 恢复前校验版本、关联关系、日期和阶段，明确确认后替换本地数据。损坏数据不会被初始化覆盖，可先导出原始数据。自定义公司可在备份弹窗中编辑，没有关联投递时可删除。

```bash
pnpm dev
pnpm build
# Node.js 22.6+：流程、备份校验和导出回归测试
pnpm test:tracker
```

## 数据文件

- `data/autumn-watchlist.json`：候选公司、官方入口、最近检查结果和内容哈希。
- `src/bookmarks.json`：前端展示的秋招专场书签，分类 ID 为 `autumn`。
- `data/YYYY-MM-DD.md`：每天维护运行的摘要日志（由自动化流程生成）。

## 跑官网校验

校验脚本会读取 `data/autumn-watchlist.json`，对所有 `status=pending` 且有 `officialUrl` 的候选官网发起 HTTP 请求。默认是全量运行，并发数为 20；单个请求最多等待 12 秒，失败会记录下来，不会阻塞其他官网。

```bash
# 只预览结果，不写入 JSON
pnpm exec node scripts/verify-autumn-watchlist.mjs

# 校验并写入 lastCheckedAt、HTTP 状态、内容哈希和验证结果
pnpm exec node scripts/verify-autumn-watchlist.mjs --write

# 安全试跑：只检查 5 家
pnpm exec node scripts/verify-autumn-watchlist.mjs --limit=5

# 只检查指定公司（公司名用英文逗号分隔）
pnpm exec node scripts/verify-autumn-watchlist.mjs \
  --write --companies="中兴通讯,TCL,MPS芯源系统"
```

脚本会把 HTML 清洗成文本，并计算 SHA-256 内容哈希。只有页面同时出现 `2027`/`2027届`/`27届` 和 `校园招聘`/`秋招`/`应届生招聘`/`应届生`，才会将 `keywordMatched` 标记为 `true`。脚本本身只更新官网校验元数据，不会自动发现新公司，也不会直接修改书签。

## 完整日常维护流程

1. **全量官网复核**：运行上面的 Node 脚本，使用 `--write` 保存每个入口的最新状态、哈希、最终 URL 和失败原因。
2. **更新秋招专场**：检查 `keywordMatched=true` 的结果，将对应公司加入 `src/bookmarks.json` 的 `autumn.links`，使用纯 URL 并按 URL 去重。
3. **搜索新增官网**：使用 Web Search 搜索仍未缓存的候选公司，只接受能确认归属的官网、招聘官网或官方 ATS。`officialUrl` 必须是纯 URL，不能写成 Markdown 的 `[标题](链接)`。
4. **生成日志**：写入 `data/YYYY-MM-DD.md`，至少包含本次校验总数、页面变化数、失败数、新增官网缓存、新增秋招网站和当前统计。
5. **构建检查**：

   ```bash
   pnpm build
   ```

维护流程默认只修改数据和日志，不暂存、提交或推送；提交操作由用户单独决定。

## 常见输出

- `eligible`：本次实际检查的官网数量。
- `changed`：本次内容哈希与上次不同的页面数量。
- `matched`：同时命中年份和校招关键词的页面数量。
- `failed`：请求超时、DNS、TLS 或服务器拒绝等失败数量。
