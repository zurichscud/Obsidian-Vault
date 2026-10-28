[`skills`](https://github.com/vercel-labs/skills) 是 Vercel Labs 推出的 Agent Skill 管理工具，支持 Claude Code、Cursor、Codex 等主流环境。

## 1. 安装技能

### 1.1 全局安装

所有项目通用，执行以下命令：

```shell
npx skills add dualface/ste-zh -g
```

### 1.2 安装到当前项目

以下命令将技能安装到当前项目：

```shell
npx skills add dualface/ste-zh
```

### 1.3 仅为指定 Agent 安装

仅为指定 Agent 安装时（例如 Claude Code），执行以下命令：

```shell
npx skills add dualface/ste-zh -g -a claude-code
```

## 2. 更新与卸载

更新与卸载分别执行以下命令：

```shell
npx skills update ste -g
npx skills remove --global ste
```

其他常用命令：

```shell
npx skills list
npx skills update
```

## 3. 打包与分发技能

要让别人能直接通过 `npx skills add` 安装你开发的技能，核心在于遵循 **标准目录结构** 与 **`SKILL.md` 元数据规范**，并将它们推送到 GitHub（或内置到 npm 包）。

`skills` CLI 原生支持通过 GitHub 仓库路径（`owner/repo`）直接定位和拉取技能。以下是完整的打包与分发流程。

### 3.1 规范技能目录结构

在你的 GitHub 仓库（例如 [github.com/your-username/my-agent-skills](https://github.com/your-username/my-agent-skills)）中，推荐采用以下结构：

```text
my-agent-skills/
├── skills/                      # 存放所有 skill 的目录
│   └── my-custom-skill/         # 具体技能名称（kebab-case）
│       ├── SKILL.md             # 核心入口与元数据定义
│       ├── references/          # 补充参考文档/规则片段（可选）
│       └── scripts/             # 自动化或执行脚本（可选）
├── README.md
└── package.json                 # 可选
```

### 3.2 编写标准的 `SKILL.md`

需要按照SKILLS规范进行编写，以便 CLI 解析识别。

## 4. 让用户安装与使用

推送代码到 GitHub 仓库（设为 Public）后，用户即可通过以下方式安装。

### 4.1 从多技能仓库按名安装（推荐）

如果你的仓库包含多个 skills，用户通过 `-s`（或 `--skill`）指定名称：

```shell
npx skills add your-username/my-agent-skills -s my-custom-skill
```

### 4.2 指定安装的目标 Agent

用户可以指定将技能安装到特定工具（如 Claude Code 或全局环境）：

```shell
# 安装到 claude-code
npx skills add your-username/my-agent-skills -s my-custom-skill -a claude-code

# 全局安装供系统 Agent 调用
npx skills add your-username/my-agent-skills -s my-custom-skill -g
```

## 原理

CLI 解析 GitHub 地址的逻辑其实非常直接：参数 `your-username/my-agent-skills` 本身就是 **GitHub 仓库的简写**。
CLI会主动去`https://github.com/your-username/my-agent-skills`寻找