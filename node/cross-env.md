---
title: "cross-env"
---

**cross-env** 是一个跨平台设置和使用环境变量的 npm 包。它解决了 Windows 和类 Unix 系统（Mac/Linux）在命令行中设置环境变量时语法不一致的问题。

## 1. 安装

安装 `cross-env`：

```sh
pnpm add -D cross-env
```

## 2. 核心痛点

不同操作系统在 npm scripts 中设置环境变量的语法存在差异：

- **Mac / Linux：** `NODE_ENV=production node app.js`
- **Windows (CMD)：** `set NODE_ENV=production && node app.js`
- **Windows (PowerShell)：** `$env:NODE_ENV="production"; node app.js`

如果团队成员使用不同的操作系统，写在 `package.json` 中的构建脚本就无法做到全员通用。`cross-env` 可以抹平这种操作系统间的语法差异。

## 3. 使用

在脚本前加上 `cross-env` 指令即可：

```json title="package.json"
{
  "scripts": {
    "dev": "cross-env NODE_ENV=development vite",
    "build": "cross-env NODE_ENV=production vue-cli-service build",
    "build:custom": "cross-env NODE_ENV=production VUE_APP_TITLE=MyApp vue-cli-service build"
  }
}
```

`cross-env` 通常与 `dotenv` 配合使用。
