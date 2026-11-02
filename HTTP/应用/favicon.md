---
title: favicon
description: 网站图标
---

Favicon 是显示在浏览器标签页、书签栏、搜索结果等位置的小图标，用来标识网站的品牌或视觉识别。

## 1. 常见格式

| 格式     | 描述          | 优点        |
| ------ | ----------- | --------- |
| `.ico` | 经典格式，支持多分辨率 | 浏览器兼容性最好  |
| `.png` | 现代格式，体积小、清晰 | 推荐用于高分屏   |
| `.svg` | 矢量格式，可缩放    | 清晰、适配暗色模式 |
| `.jpg` | 不推荐         | 无透明背景     |

## 2. 基本使用方法

在页面中引入图标的写法如下：

```html
<!-- 最基础写法 -->
<link rel="icon" href="/favicon.ico" />

<!-- 推荐写法（现代浏览器） -->
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">

<!-- 支持 Safari pinned tab -->
<link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5">

<!-- Apple Touch Icon（iOS桌面快捷方式） -->
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

## 3. 生成工具

推荐使用在线工具自动生成全平台图标集：

- **RealFaviconGenerator.net**
- **Favicon.io**：https://favicon.io/
