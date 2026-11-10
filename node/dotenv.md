---
title: "dotenv"
---

`dotenv` 是一个用于**读取 `.env` 环境变量文件**的 Node.js 包。它的作用是把 `.env` 文件里的配置加载到 `process.env` 中。

## 1. 安装

```sh
npm install dotenv
```

## 2. 使用

### 2.1 创建 `.env` 文件

创建 `.env`：

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=123456

JWT_SECRET=abc123
```

### 2.2 读取环境变量

读取环境变量：

```js
import dotenv from "dotenv";

dotenv.config();

console.log(process.env.DB_HOST);
```

### 2.3 指定 env 文件

指定 env 文件：

```js
dotenv.config({
  path: ".env.development",
});
```

### 2.4 配合 cross-env 使用

配合 `cross-env` 一起使用：

```js
dotenv.config({
  path:
    process.env.NODE_ENV === "production"
      ? ".env.production"
      : ".env.development",
});
```
