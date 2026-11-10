---
title: "导入JSON"
---

## 1. JSON 作为模块

在现代 JavaScript 生态（Webpack、Vite、Next.js、Node.js ESM 等）里，**JSON 文件也被当成模块（Module）处理**。

## 2. 示例

### 2.1 JSON 文件内容

下面是一个 JSON 文件的内容。

```json
{
  "login": "登录",
  "logout": "退出"
}
```

### 2.2 构建工具的包装结果

构建工具会把它包装成类似下面的代码。

```js
export default {
  login: "登录",
  logout: "退出"
}
```

## 3. 动态导入

### 3.1 导入写法

通常会动态导入 JSON，写法如下。

```js
const module = await import("./zh.json");
```

### 3.2 返回值

动态导入的返回结果如下。

```js
{
  default: {
    login: "登录",
    logout: "退出"
  }
}
```
