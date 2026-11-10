---
title: "Setup Prisma Client"
description: "配置Prisma Client"
---

## 1. 安装

安装 Prisma CLI：

```sh
pnpm add prisma --save-dev
```

安装固定版本：

```sh
pnpm add prisma@7.10.0 --save-dev
pnpm add @prisma/client@7.10.0 @prisma/adapter-pg pg
```

## 2. 初始化项目

初始化项目：

```sh
pnpm prisma init
```

`prisma init` 会生成以下文件：

- `schema.prisma`
- `.env`

`schema.prisma` 示例如下：

```prisma title="schema.prisma"
datasource db {
  provider = "postgresql"
}

generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

model User {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now())
  email     String   @unique
  name      String?
}
```

## 3. 生成 Client API

Prisma Client 是基于 Prisma Schema（在 `schema.prisma` 中编写数据模型）生成的。为了获得正确的 TypeScript 类型支持，你需要先生成客户端代码：

```sh
pnpm prisma generate
```

该命令会根据你在 Prisma Schema 中配置的 `output` 路径，创建一个 `generated` 目录。之后都应该从这个生成出来的 Client API 中进行导入。

> 为什么不使用 pnpm dlx prisma generate ？

| **特性**     | **pnpm prisma generate**                   | **pnpm dlx prisma generate**    |
| ---------- | ------------------------------------------ | ------------------------------- |
| **依赖来源**   | 使用项目 `node_modules` 中已安装的 Prisma 版本        | 临时从 npm 远程下载最新/指定版本的 Prisma 并执行 |
| **本地依赖需求** | 要求项目中必须提前安装 `prisma` 包                     | 不需要项目中提前安装 `prisma`             |
| **版本一致性**  | **高**（严格与项目 `package.json` 中的 Prisma 版本一致） | **低**（可能默认下载最新版，导致与项目配置版本不匹配）   |
| **典型使用场景** | 日常本地开发、CI/CD 自动化构建部署                       | 临时初始化项目、尝试新功能或未安装 Prisma 的环境    |

因此建议使用项目中的 Prisma CLI 来生成 Prisma Client，这样可以确保生成的代码与项目中安装的 Prisma 版本一致。

> [!note] 警告
> 所有 Prisma Client 的方法返回 Promise 类型。

## 4. 更新 Prisma Client

- 执行数据库的 Migrate 时，Client 会自动更新。
- 执行数据库的 `Introspection` 时，需要重新生成 Client。

## 5. 导入 Prisma Client

从生成的目录导入 `PrismaClient` 并实例化：

```ts
import { PrismaClient } from "./generated/prisma";

const prisma = new PrismaClient();

// use `prisma` in your application to read and write data in your DB
```

## 6. 使用

创建用户并查询全部用户：

```js
// run inside `async` function
const newUser = await prisma.user.create({
  data: {
    name: "Alice",
    email: "alice@prisma.io",
  },
});

const users = await prisma.user.findMany();
```
