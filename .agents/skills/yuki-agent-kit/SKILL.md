---
name: yuki-agent-kit
description: 在用户要求给新项目或已有项目接入 yuki-agent-kit、安装其配套 Skills、补齐开发规范或检查 kit 更新时使用；不用于一般开发任务或替换项目已有产品判断。
---

# 接入 yuki-agent-kit

此 Skill 自带初始化脚本和模板，安装后不依赖全局 yuki 命令或 npm 同名包。

## 接入项目

1. 确认用户指定的目标目录；未指定时使用当前项目根目录。读取已有 `AGENTS.md`、`PRODUCT.md`、Agent Notes、Git 状态和 hooks 配置。新项目只有在用户要求创建时才创建目录。
2. 告知接入会补齐缺失的产品说明、Agent 规则、Notes 和 hooks；默认 `commit-msg` 校验带类型前缀的中文主题，`pre-push` 是待配置的空模板。若与项目约定不兼容，先讨论相应集成。
3. 从**当前加载的本 Skill 目录**定位 [scripts/init-project.sh](scripts/init-project.sh)，运行下面的命令。先将示例中的路径替换成实际绝对路径，不要从业务项目猜测源码仓库的位置。

   ```sh
   sh /absolute/path/to/yuki-agent-kit/scripts/init-project.sh /absolute/path/to/project
   ```

4. 用户要求完整接入 kit 或安装配套 Skills 时，读取 [references/companion-skills.md](references/companion-skills.md)，安装选定的缺失 Skills。仅初始化模板的请求不需要额外安装。
5. 对脚本新建的 `PRODUCT.md` 和 `AGENTS.md`，根据用户已提供的目标与实际项目配置填写；缺少产品信息时询问，不自行编造。已有文件仅报告缺口，未经明确要求不修改。
6. 检查实际文件、`git diff`、hooks 配置与 Skill 安装结果，分别报告新建、保留、已安装和待处理内容。安装器创建的来源记录应保留；不要声称新安装 Skill 已在当前会话触发。

## 已有项目与更新

已有文件、权限、目录链接与 hooks 配置必须保留；脚本会输出 `Keeping existing`。hooks 配置未切换时，说明新模板尚未接入现有 hooks 流程。不得为了完成接入覆盖已有 hook manager。

检查或更新时读取 [references/update-policy.md](references/update-policy.md)。Skill 更新与项目文件更新是不同操作；更新 Skill 不授权覆盖项目文件。
