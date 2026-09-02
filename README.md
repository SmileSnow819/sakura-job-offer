# Sakura Job Offer 秋招数据维护

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
