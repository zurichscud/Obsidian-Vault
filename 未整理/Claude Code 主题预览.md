---
tags:
  - claude
  - 主题
  - 排版
created: 2026-10-24
---

> 好的工具应该安静：把纸、墨和一个恰当的颜色放在你面前，然后退后一步。

正文使用系统无衬线字体，标题换用衬线体，界面与代码使用等宽字体。**加粗**、*斜体*、==荧光笔==、`inline code`，以及 [[HTTP缓存/HTTP缓存判断|内部链接]] 和 [外部链接](https://claude.com)。

## 排版 · Typography

### 三级标题使用无衬线体

四级标题继续收紧层级，五级与六级退为小型标签。

#### 四级标题

##### 五级标题 / Label

###### 六级标题 / Meta

## 代码 · Code

```bash
claude
> 把这段缓存逻辑改成可读的样子
```

```javascript
// 强缓存优先，协商缓存兜底
function shouldRevalidate(cache) {
  return cache.isStale && cache.hasValidator;
}
```

行内代码会获得一层浅色底：`Cache-Control: max-age=3600`。

## 列表与任务

- 一级项目
  - 二级项目，标记点收成一个小方块
    - 三级项目
- [ ] 还没做的事
- [x] 已经做完的事

1. 有序列表使用等宽数字
2. 第二条
3. 第三条

## 表格

| 快捷键     | 动作        | 备注   |
| ------- | --------- | ---- |
| `⌘ P`   | 快速切换      | 最常用  |
| `⌘ ⇧ F` | 全库搜索      | 支持正则 |
| `⌘ E`   | 切换阅读 / 编辑 | 无    |

## Callouts

> [!note] 笔记
> 冷色用于说明，暖色用于提醒。边框只有 1px，标题设成小型等宽大写。

> [!tip] 提示
> 想更接近 Claude Code，可以把深色模式打开。

> [!warning] 注意
> 主题不会改动你的笔记内容，所有样式都来自 `.obsidian/themes/Claude Code/`。

> [!danger] 危险
> 不要在同步目录里同时修改同一个文件。

> [!quote] 引述
> “Simplicity is the ultimate sophistication.”

---

## 标签与链接

#claude #theme #排版

返回 [[HTTP缓存/HTTP缓存判断|HTTP 缓存判断]]，或看看 [Claude](https://claude.com)。

这是一个脚注引用[^1]。

[^1]: 脚注区域会以一条细线开始。

