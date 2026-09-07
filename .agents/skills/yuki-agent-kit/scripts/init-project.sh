#!/bin/sh

set -eu

# 模板随 Skill 一起分发，初始化无需网络，也不依赖原始仓库的位置。
if [ "$#" -ne 1 ]; then
  echo "Usage: sh $0 /path/to/project" >&2
  exit 1
fi
if [ ! -d "$1" ]; then
  echo "Target directory does not exist: $1" >&2
  exit 1
fi
target=$(CDPATH= cd -- "$1" && pwd -P)
script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
template_dir=$(CDPATH= cd -- "$script_dir/../assets/templates" && pwd -P)

# 识别普通仓库和 worktree；拒绝在仓库子目录创建第二套项目规则。
if repo_root=$(git -C "$target" rev-parse --show-toplevel 2>/dev/null); then
  repo_root=$(CDPATH= cd -- "$repo_root" && pwd -P)
  if [ "$repo_root" != "$target" ]; then
    echo "Target must be the repository root: $repo_root" >&2
    exit 1
  fi
else
  git -C "$target" init
fi

# 只有未配置 hooks 的普通仓库才自动启用新模板。worktree 的本地
# Git 配置可能与主仓库共享，因此不在此更改它的 hooksPath。
enable_hooks=yes
if git -C "$target" config --get core.hooksPath >/dev/null 2>&1; then
  enable_hooks=no
elif [ -e "$target/.githooks" ] || [ -L "$target/.githooks" ] || [ -f "$target/.git" ]; then
  enable_hooks=no
else
  hooks_dir=$(git -C "$target" rev-parse --git-path hooks)
  case "$hooks_dir" in
    /*) ;;
    *) hooks_dir="$target/$hooks_dir" ;;
  esac
  for hook in "$hooks_dir"/*; do
    case "$hook" in *.sample) continue ;; esac
    if [ -e "$hook" ] || [ -L "$hook" ]; then
      enable_hooks=no
      break
    fi
  done
fi

copy_if_missing() {
  relative=$1
  destination="$target/$relative"
  # 断开的符号链接也属于已有文件。逐级检查父目录，防止通过目录
  # 链接将模板写入项目之外，或改变目标项目已有的目录布局。
  parent=$(dirname -- "$destination")
  while [ "$parent" != "$target" ]; do
    if [ -L "$parent" ] || { [ -e "$parent" ] && [ ! -d "$parent" ]; }; then
      echo "Keeping existing parent $parent; skipped $relative"
      return
    fi
    parent=$(dirname -- "$parent")
  done
  if [ -e "$destination" ] || [ -L "$destination" ]; then
    echo "Keeping existing $destination"
    return
  fi
  mkdir -p "$(dirname -- "$destination")"
  # noclobber 也保护检查后、写入前出现的普通文件；只给新建 hook 加执行权限。
  (set -C; cat "$template_dir/$relative" > "$destination")
  case "$relative" in .githooks/*) chmod +x "$destination" ;; esac
  echo "Created $destination"
}

copy_if_missing PRODUCT.md
copy_if_missing AGENTS.md
copy_if_missing .agents/notes/README.md
copy_if_missing .agents/skills/README.md
copy_if_missing .githooks/commit-msg
copy_if_missing .githooks/pre-push

if [ "$enable_hooks" = yes ]; then
  git -C "$target" config --local core.hooksPath .githooks
  echo "Enabled core.hooksPath=.githooks"
else
  echo "Keeping existing hooks setup; core.hooksPath unchanged. Review .githooks integration manually."
fi
echo "Initialized project conventions in $target"
