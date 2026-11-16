### 隐式提交的规则

在输入框按回车时，浏览器按下面的顺序判断：

1. **表单里有默认提交按钮**：浏览器会对这个按钮**模拟一次点击**，由这次点击触发提交。
2. **表单里没有提交按钮**：只有当表单里**恰好只有一个**文本类输入框时才会提交；有两个或更多，回车不会提交。

**默认提交按钮**指的是表单里（按文档顺序）第一个提交按钮，包括：

- `<button>`（不写 `type` 时默认就是 `submit`）
- `<button type="submit">`
- `<input type="submit">`
- `<input type="image">`

**"文本类输入框"** 指 `text`、`search`、`url`、`tel`、`email`、`password`、`number`，以及日期时间类（`date`、`time` 等）。

```html
<!-- 情况 A：有提交按钮，回车会提交 -->
<form>
  <input name="a">
  <input name="b">
  <button>提交</button>
</form>

<!-- 情况 B：没有按钮，只有一个文本框，回车会提交 -->
<form>
  <input name="a">
</form>

<!-- 情况 C：没有按钮，有两个文本框，回车不会提交 -->
<form>
  <input name="a">
  <input name="b">
</form>
```