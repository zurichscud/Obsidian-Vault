## 1. 核心属性：type

`<button>` 的 `type` 属性决定了点击它的默认行为，共有三种取值：

| **属性值**      | **说明**                        | **常见坑点**                                                     |
| ------------ | ----------------------------- | ------------------------------------------------------------ |
| **`submit`** | **默认值**。点击会触发表单提交。            | 如果把 `<button>` 放在 `<form>` 标签内部且没写 `type`，点击它会直接刷新页面或触发表单提交。 |
| **`button`** | 普通按钮，没有默认行为，完全由 JS 控制。         | 在组件库中通常会显式加上 `type="button"`。                              |
| **`reset`**  | 重置所属 `<form>` 表单中的所有输入字段到初始值。 | 现代 Web 开发中极少使用，容易导致用户误触清空数据。                                 |

## 2. 常用原生属性

- **`disabled`**：布尔属性。加上后按钮变为不可点击状态，不会触发 `click` 事件，也无法通过 Tab 键聚焦。
- **`form`**：接受一个表单的 `id`。即使 `<button>` 写在 `<form>` 标签外部，也能通过这个属性关联并提交该表单。
- **`name` & `value`**：当表单通过 `submit` 按钮提交时，这两个属性会作为键值对随表单数据一起发送到后端（常用于一个表单有“保存草稿”和“正式发布”两个提交按钮的场景）。
- **`autofocus`**：页面加载时自动让该按钮获得焦点（同一页面只能有一个元素设置此属性）。

## 3. `<button>` vs `<input type="button">` vs `<div>`

- **内容丰富度**：`<input>` 是空元素，只能通过 `value` 显示纯文本；而 `<button>` 是双标签，内部可以嵌套 SVG 图标、图片、`<span>` 等任意 HTML 结构。
- 可访问性：原生的 `<button>` 天然支持 `Tab` 键聚焦，以及按 `Enter` 或 `Space` 键触发点击。如果用 `<div>` 模拟按钮，不仅屏幕阅读器无法识别，还得手动补全 `tabindex`、`role="button"` 和键盘事件监听。

## 4. 基础代码示例

示例展示了表单内的普通操作按钮、通过 `form` 属性关联的外部提交按钮，以及嵌套图标与禁用状态的写法：

```html
<!-- 1. 表单内的普通操作按钮（必须加 type="button" 防误提交） -->
<form id="user-form" action="/api/user" method="POST">
  <input type="text" name="username" required />
  
  <button type="button" onclick="checkUsername()">检查重名</button>
  <button type="submit">保存提交</button>
</form>

<!-- 2. 表单外部的提交按钮（通过 form 属性关联） -->
<button type="submit" form="user-form">外部提交按钮</button>

<!-- 3. 嵌套图标与禁用状态 -->
<button type="button" disabled aria-busy="true">
  <svg class="spinner" viewBox="0 0 24 24">...</svg>
  <span>提交中...</span>
</button>
```

## 5. 最佳实践

- **防止重复提交**：在发送异步请求期间，除了在业务层加锁，DOM 层面动态绑定 `:disabled="isLoading"` 是阻止用户连点最直接有效的方式。
- **语义化原则**：“跳转用 `<a>`，动作触发用 `<button>`”。如果点击后的本质是导航到新 URL，应该使用 `<a>` 标签并配合 CSS 做成按钮外观，这样用户才能正常使用右键“在新标签页中打开”或复制链接。
