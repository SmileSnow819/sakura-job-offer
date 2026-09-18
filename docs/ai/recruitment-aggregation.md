# 招聘聚合跨电脑接续指南

这份文档用于在新电脑恢复“牛客 + 飞书多维表格 + 小红书”招聘聚合流程。每次运行的完整日志写入 `logs/YYYY-MM-DD.md`。

## 一、准备环境

建议使用以下版本：

- macOS 或其他可运行 Node/Python 的系统
- Node.js `>=22.23.0`
- pnpm `11.8.0`
- Python `3.10+`
- Git

克隆项目和 Spider_XHS：

```bash
git clone https://github.com/SmileSnow819/sakura-job-offer.git
git clone https://github.com/cv-cat/Spider_XHS.git /Users/<用户名>/tools/Spider_XHS
cd /Users/<用户名>/project/sakura-job-offer
pnpm install --frozen-lockfile

cd /Users/<用户名>/tools/Spider_XHS
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

如果新电脑路径不同，不要修改代码里的固定路径；运行命令时把路径替换成实际路径即可。

## 二、配置小红书 Cookie

Spider_XHS 的搜索和详情核验会读取：

```text
~/.codex/.env
```

文件内容只需要在本机保存：

```dotenv
COOKIES='从浏览器获取的完整小红书 PC Cookie'
```

不要把 Cookie 写入 Git、README、报告或命令历史。Cookie 失效时，重新从浏览器获取并覆盖本机 `.env`；如果怀疑泄露，先退出登录或清理旧 Cookie。

先单独验证 Spider_XHS：

```bash
cd /Users/<用户名>/tools/Spider_XHS
PYTHONPATH=. .venv/bin/python -m spider.search "校园招聘 正式启动"
```

看到搜索成功后，再进行详情聚合。

## 三、运行小红书 JSON runner

`XHS_OFFICIAL_ACCOUNTS` 是官方账号白名单，使用逗号分隔。只有白名单账号或 API 明确标记为官方的账号，才会进入候选；其他内容会进入跳过统计。

当前默认关键词为：

- `校园招聘 正式启动`
- `校园招聘 启动`
- `校招 正式启动`
- `网申 开启`

运行：

```bash
cd /Users/<用户名>/tools/Spider_XHS
XHS_OFFICIAL_ACCOUNTS='小红书招聘,绿联招聘,阅文招聘,七十迈招聘' \
PYTHONPATH=. .venv/bin/python -m spider.aggregation \
  --output /tmp/xiaohongshu-candidates.json
```

输出文件是候选 JSON 数组；失败和跳过数量会打印到终端，不把原始正文写入项目。

## 四、运行三来源聚合 diff

```bash
cd /Users/<用户名>/project/sakura-job-offer
XIAOHONGSHU_CANDIDATES_FILE=/tmp/xiaohongshu-candidates.json \
pnpm recruitment:aggregate -- --write > /tmp/recruitment-aggregation-report.json
```

报告字段：

- `additions`：现有秋招书签中不存在的新候选
- `enrichments`：已有公司但缺少 `openedAt` 的候选
- `duplicates`：多个来源指向同一公司或招聘入口
- `skipped`：缺少入口、非官方、时间无法解析等记录
- `errors`：接口、登录态或详情请求失败
- `sources`：牛客、飞书、小红书三个来源的运行状态

查看摘要：

```bash
node -e "const x=require('/tmp/recruitment-aggregation-report.json'); console.log({additions:x.additions.length,enrichments:x.enrichments.length,duplicates:x.duplicates.length,skipped:x.skipped.length,errors:x.errors.length})"
```

牛客和小红书按现有接口/runner读取；飞书通过 `lark-cli base +record-list --as user` 读取。飞书需要本机完成一次 `lark-cli auth login --recommend`，授权账号拥有该表格的阅读权限即可。如果任一来源变成登录或风控错误，报告会保留来源错误，不应把错误当成“没有新增”。招聘链接写入前会清理 `recommendCode`、`spread`、`shareId`、`channel` 等内推/跟踪参数。

## 五、人工更新书签

使用 `--write` 时会自动写入 `src/bookmarks.json`。确认报告中的公司属于官方招聘入口后，仍应复核 Git diff：

1. 按招聘 URL 或公司名检查是否已经存在。
2. 新公司加入 `autumn.links`。
3. 已有公司只补缺失的 `openedAt`，不覆盖已有日期。
4. 不把公众号公告链接误当成招聘入口。
5. 运行验证：

```bash
pnpm test:recruitment-aggregation
pnpm test:bookmarks
pnpm check
```

## 六、定时执行

正式定时任务按北京时间每个工作日 11:00 运行，周六周日跳过，并持续在同一个 Codex 对话线程中执行。

定时任务需要按顺序执行：

```bash
cd /Users/<用户名>/tools/Spider_XHS
XHS_OFFICIAL_ACCOUNTS='小红书招聘,绿联招聘,阅文招聘,七十迈招聘' \
PYTHONPATH=. .venv/bin/python -m spider.aggregation \
  --output /tmp/xiaohongshu-candidates.json

cd /Users/<用户名>/project/sakura-job-offer
XIAOHONGSHU_CANDIDATES_FILE=/tmp/xiaohongshu-candidates.json \
pnpm recruitment:aggregate \
  -- --write > /tmp/recruitment-aggregation-report.json
```

定时任务会更新 `src/bookmarks.json`，但不会自动提交、推送或部署。日志至少记录运行时间、调用工具、来源状态、返回数量、写入数量、跳过原因和错误详情；不会记录 Token、Cookie 或内推码。

日志位置：`logs/YYYY-MM-DD.md`。换电脑时只需恢复仓库、安装依赖、配置 Spider_XHS Cookie 和 `lark-cli` 授权即可继续运行。
