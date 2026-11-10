---
title: "negotiator"
---

`negotiator` 是一个 Node.js 的 HTTP 内容协商库，用于解析 HTTP 请求头（`Accept`、`Accept-Language`、`Accept-Encoding`、`Accept-Charset`），它也是 Express 内部使用的库。

## 1. 安装

安装 `negotiator`：

```sh
npm install negotiator
```

## 2. 媒体类型协商

根据 `Accept` 请求头协商媒体类型：

```js
availableMediaTypes = ['text/html', 'text/plain', 'application/json']

// The negotiator constructor receives a request object
negotiator = new Negotiator(request)

// Let's say Accept header is 'text/html, application/*;q=0.2, image/jpeg;q=0.8'

negotiator.mediaTypes()
// -> ['text/html', 'image/jpeg', 'application/*']

negotiator.mediaTypes(availableMediaTypes)
// -> ['text/html', 'application/json']

negotiator.mediaType(availableMediaTypes)
// -> 'text/html'
```

## 3. 语言协商

匹配客户端首选语言：

```js
const negotiator = new Negotiator(req);

// 服务端支持的语言列表
const supportedLanguages = ['en', 'zh-CN', 'ja'];

// 匹配首选语言
const language = negotiator.language(supportedLanguages);
// 例如：客户端发送 "zh-CN,zh;q=0.9,en;q=0.8" 时，返回 "zh-CN"
//如果不存在重合的语言项将使用undefined
```

下面的示例对比父级匹配与无法匹配两种情况：

```js
const Negotiator = require('negotiator');

const req = {
  headers: {
    'accept-language': 'zh-HK,zh;q=0.9'
  }
};

const negotiator = new Negotiator(req);

// 情况 A：服务端有 ['zh-TW', 'zh']
console.log(negotiator.language(['zh-TW', 'zh']));
// 输出: 'zh' (因为 zh-HK 退化匹配到了父级 zh)

// 情况 B：服务端只有 ['zh-TW']
console.log(negotiator.language(['zh-TW']));
// 输出: undefined (完全无法匹配到 zh-TW，不会认为两边都是繁体就互相替代)
```

- 在 **`Negotiator`** 眼里，`zh-HK` 和 `zh-TW` 只是两个毫无关联的普通字符串，它**只认父子关系（`zh-HK` → `zh`）**，不认兄弟关系。
- 只要服务端提供了 `zh`，`Negotiator` 就会返回 **`zh`**；如果服务端只提供 `zh-TW`，`Negotiator` 会直接返回 **`undefined`**。
- 因此建议使用 `@formatjs/intl-localematcher` 解析语言协商。
