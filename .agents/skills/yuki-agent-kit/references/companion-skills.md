# 安装配套 Skills

在用户要求完整接入或安装配套 Skills 时读取。所有安装都在目标项目根目录执行，默认项目级；只有用户要求全局安装时才使用 `-g`。

## 选择范围

| Skill | 用途 |
| --- | --- |
| `project-bootstrap` | 根据真实产品信息和技术栈完善新建的协作规范 |
| `agent-notes` | 维护有长期价值的决策记录 |
| `code-review` | 审查正确性和回归风险 |
| `find-simplifications` | 查找有证据支持的简化机会 |
| `trim-cot-leakage` | 清理文档和代码中的开发过程残留 |

完整接入默认安装以上五个；用户指定子集时按子集安装。不附带 Superpowers 或其它第三方包。

## 检查与安装

先查看目标 Agent 的项目 Skill 目录和 `npx skills list` 输出。保留同名 Skill（包括符号链接）；从安装参数中删除已存在的名字。若所有选定 Skill 都已存在，直接报告保留，不重装。检查与安装必须使用同一目标 Agent。

```sh
npx skills add SmileSnow819/yuki-agent-kit --skill project-bootstrap agent-notes code-review find-simplifications trim-cot-leakage
```

交互安装选择正在使用的 Agent。自动化调用时，在已确认 Agent 和安装范围后可添加 `--agent codex --yes`；其它 Agent 使用安装器支持的对应名称。不要使用 `--all`，它还会选择其它 Agent。

若从本地检出验证未发布的改动，将 `SmileSnow819/yuki-agent-kit` 替换为该检出的绝对路径。这个来源必须由实际上下文确认，不能由项目名猜测。

安装后检查实际目录和随 Skill 安装的引用资源。下载失败或 Agent 不受支持时，报告尚未安装的部分；模板初始化可以独立完成。安装来源、范围和锁文件由 `skills` 安装器维护，不手写其格式。

工具用法来源：[vercel-labs/skills](https://github.com/vercel-labs/skills)。
