---
title: "@formatjs/intl-localematcher"
---

`@formatjs/intl-localematcher` 是 FormatJS 套件中的一个核心库，主要用于**匹配和选择最符合用户语言偏好的区域设置（Locale）**。

## 1. 基本用法

`match` 的函数签名如下：

```js
match(requestedLocales, availableLocales, defaultLocale, options?)
```

参数说明：

- **`requestedLocales`**：用户请求的 Locale 列表（如 `['zh-CN', 'en-US']`，通常按优先顺序排列）。
- **`availableLocales`**：你的应用或系统支持的 Locale 列表（如 `['en', 'zh-Hans', 'zh-Hant']`）。
- **`defaultLocale`**：无法精确匹配时的保底 Locale（如 `'en'`）。
- **`options`**（可选）：配置项，如 `{ algorithm: 'best fit' | 'lookup' }`（默认 `'best fit'`）。

## 2. 示例

完整示例如下：

```ts
import { match } from '@formatjs/intl-localematcher';

// 1. 用户偏好的语言列表（按优先级降序）
const userLocales = ['zh-CN', 'zh', 'en-US'];

// 2. 应用实际支持的语言资源列表
const appSupportedLocales = ['en-US', 'zh-CN', 'zh-TW', 'ja-JP'];

// 3. 默认保底语言
const defaultLocale = 'en-US';

// 执行匹配
const matchedLocale = match(
  userLocales,
  appSupportedLocales,
  defaultLocale
);

console.log(matchedLocale);
// 输出: 'zh-CN'
```
