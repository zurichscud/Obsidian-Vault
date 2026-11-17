## 1. 核心属性

| **属性**             | **说明**                                                         | **常见值 / 示例**                                                                           |
| ------------------ | -------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **`action`**       | 表单数据提交的目标 URL。如果省略，默认提交到当前页面 URL。                              | `action="/api/login"`                                                                  |
| **`method`**       | 提交表单使用的 HTTP 方法。                                               | `get`（默认，参数拼接在 URL 后）、`post`（参数放在请求体中）                                                 |
| **`enctype`**      | 当 `method="post"` 时，指定表单数据的编码类型。                               | `application/x-www-form-urlencoded`（默认）、`multipart/form-data`（**上传文件必选**）、`text/plain` |
| **`target`**       | 指定在何处显示提交后返回的响应。                                               | `_self`（默认，当前窗口）、`_blank`（新标签页）                                                        |
| **`novalidate`**   | 布尔属性。添加后，浏览器在提交时**跳过**原生的 HTML5 表单验证（常用于改用 Zod 等自定义 JS 校验逻辑时）。 | `<form novalidate>`                                                                    |
| **`autocomplete`** | 控制浏览器是否自动填充表单字段。                                               | `on`（默认）、`off`                                                                         |

## 2. 表单校验

只要 `<form>` 没有添加 `novalidate` 属性（且触发提交的按钮没有 `formnovalidate` 属性），浏览器在表单提交时**默认会自动执行**内部所有表单控件的 HTML5 原生校验规则。

### 2.1 浏览器何时触发默认校验？

原生校验**不会在用户输入过程中实时阻断**，而是在触发提交之前自动触发。

### 2.2 校验不通过时会发生什么？

1. **阻断提交**：浏览器不会向服务器发送请求，甚至**不会触发 `<form>` 的 `submit` 事件**（因此你写在 `form.addEventListener('submit', ...)` 里的 JS 代码根本不会执行）。
2. **自动聚焦**：浏览器自动将焦点（focus）移动到第一个校验失败的输入框上。
3. **弹出原生气泡**：在第一个非法字段下方弹出浏览器自带的提示气泡（例如“请填写此字段”），且一次只提示一个错误。
4. **触发 `invalid` 事件**：校验失败的控件本身会触发 `invalid` 事件（该事件不冒泡）。

## 3. 表单的提交流程与触发方式

### 3.1 触发 `submit` 的情况

在 `<form>` 内部，以下两种情况会自动触发表单的 `submit` 事件：

1. 点击了类型为 `submit` 的按钮（注意：`<button>` 标签如果不写 `type`，**默认就是 `type="submit"`**，这是开发中常见的误触陷阱）。
2. 在单行文本输入框（如 `<input type="text">`）聚焦时按下 **Enter（回车键）**。

### 3.2 默认行为与现代 SPA 拦截

原生提交会导致浏览器**刷新整个页面**并跳转到 `action` 指定的地址。在现代单页应用（SPA）或使用 `fetch` / `axios` 异步请求时，通常会通过 `event.preventDefault()` 阻止默认刷新。

下面的示例在 `submit` 事件中调用 `event.preventDefault()`，用 `FormData` 收集表单数据，再通过 `fetch` 异步提交：

```html
<form id="loginForm" novalidate>
  <label for="email">邮箱：</label>
  <input id="email" name="email" type="email" required />

  <label for="password">密码：</label>
  <input id="password" name="password" type="password" required />

  <!-- 明确指定 type，避免普通按钮意外触发表单提交 -->
  <button type="button" id="cancelBtn">取消</button>
  <button type="submit">登录</button>
</form>

<script>
  const form = document.getElementById('loginForm');

  form.addEventListener('submit', async (event) => {
    // 1. 阻止页面刷新跳转
    event.preventDefault();

    // 2. 使用 FormData 快速收集所有带 name 属性的表单控件值
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    // 3. 异步提交
    await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  });
</script>
```

## 4. 关键开发细节与常见坑点

- **`name` 属性决定数据键名**：无论是原生提交还是使用 `new FormData(form)`，只有带有 `name` 属性（且未被 `disabled`）的控件（`<input>`、`<select>`、`<textarea>`）才会被收集。`id` 仅用于关联 `<label for="...">` 和 DOM 查询，不会作为提交字段名。
- **`disabled` 与 `readonly` 的区别**：
  - `disabled`：控件不可编辑，样式变灰，且**不会被提交**。
  - `readonly`：控件不可编辑，但正常聚焦，且**会被正常提交**。
- **嵌套禁止**：HTML 规范严格禁止 `<form>` 内部嵌套另一个 `<form>`，浏览器解析时会忽略内层 `<form>` 标签，导致提交行为错乱。
- **HTML5 原生校验属性**：在不使用 `novalidate` 时，浏览器会根据 `required`（必填）、`minlength` / `maxlength`（长度）、`min` / `max`（数值范围）、`pattern`（正则表达式）以及 `type="email"` / `type="url"` 自动拦截不合法的提交并弹出原生提示气泡。
