`window.history`（可简写为 `history`）用于操作当前浏览器标签页的**会话历史栈**。现代单页应用的无刷新路由切换，底层就是基于它实现的。

> 出于安全隐私考虑，`history` 对象**不允许** JavaScript 读取用户访问过的具体 URL 列表，以防止恶意脚本窃取浏览记录。它只能控制“前进/后退”，或向当前同源历史栈中“压入/替换”新状态。

## 1. 基础属性与传统导航方法

| 属性 / 方法 | 说明 |
| --- | --- |
| **`history.length`** | 当前标签页历史栈中的条目总数（新开空白页初始值为 `1`） |
| **`history.state`** | 历史记录的快照数据对象（初始为 `null`，由 `pushState`/`replaceState` 写入） |
| **`history.scrollRestoration`** | 控制页面前进/后退时是否自动恢复滚动条位置（可选值 `'auto'` 或 `'manual'`） |
| **`history.back()`** | 后退一页，等同于点击浏览器左上角的 `←` 按钮（也等价于 `history.go(-1)`） |
| **`history.forward()`** | 前进一页，等同于点击浏览器左上角的 `→` 按钮（也等价于 `history.go(1)`） |
| **`history.go(delta)`** | 相对当前页跳转指定步数：`go(-2)` 后退两页，`go(2)` 前进两页，`go(0)` 刷新当前页 |

## 2. `pushState` 与 `replaceState`

这两个方法是现代前端路由的基石。它们可以**在不重新加载页面（不发 HTTP 请求）的前提下，修改地址栏的 URL 路径和参数**。

两个方法的签名如下：

```js
history.pushState(state, unused, url);
history.replaceState(state, unused, url);
```

### 2.1 参数解析

1. `state`：可序列化的 JS 对象（如 `{ page: 2, filter: 'active' }`），用于绑定这条历史记录的快照数据，大小上限通常为几 MB。
2. `unused`（历史遗留的 `title` 参数）：绝大多数浏览器会忽略它，现代开发统一传空字符串 `""` 即可。
3. `url`（可选）：新的 URL，可以是相对路径 `/user/profile`，也可以是同源完整 URL。**必须与当前页面同源（协议、域名、端口完全一致）**，否则会直接抛出 `SecurityError` 异常。

```js
history.pushState( { page: pageKey, timestamp: Date.now() }, // state 数据对象 '', // title（现代浏览器忽略，传空串） path // 新的同源 URL 路径 );
```

### 2.2 两者的核心区别

- **`pushState`**：向历史栈**新增**一条记录，浏览器“后退”按钮会亮起，点击后可回到上一个 URL。
- **`replaceState`**：**覆盖**当前历史记录，历史栈长度（`history.length`）不变，用户无法后退回被替换的状态（常用于修正 URL 参数、重定向或登录跳转）。

### 现代路由系统

- **`router.push(...)`**：底层调用的就是原生 `history.pushState()`。
- **`router.replace(...)`**：底层调用的就是原生 `history.replaceState()`。
- **浏览器前进 / 后退**：内部通过 `window.addEventListener('popstate', ...)` 监听，触发后根据新的 `location.pathname` 匹配路由表，更新响应式变量 `currentRoute`，从而驱动 `<router-view>` 重新渲染对应组件。
### 3. 监听历史变化：`popstate` 事件

调用 `pushState` 和 `replaceState` **不会**自动触发任何事件，开发者需要自己更新页面视图。
当用户点击浏览器的“后退”/“前进”按钮，或代码调用 `history.back()` / `forward()` / `go()` 时，浏览器会触发 `window` 上的 **`popstate`** 事件。

下面的示例先推入一条带状态的数据，再监听 `popstate` 事件并重新渲染视图：

```js
// 1. 推入一条带状态的数据
history.pushState({ tab: 'orders', page: 2 }, '', '/account?tab=orders&page=2');

// 2. 监听用户点击浏览器前进/后退
window.addEventListener('popstate', (event) => {
  console.log('当前 URL 已变为:', location.href);
  console.log('取出当初存入的 state:', event.state); // { tab: 'orders', page: 2 }

  // 根据新的 location 或 event.state 手动重新渲染对应的前端组件
  renderView(event.state);
});
```

## 4. 实际开发中的常见注意点

### 4.1 刷新 404 问题（Nginx / 后端配置）

`pushState` 只是在前端把地址栏改成了 `https://example.com/user/101`，服务器上并不存在 `/user/101` 这个物理文件。用户按 `F5` 刷新时，浏览器就会向服务器请求该路径。因此，生产环境必须在 Nginx 或后端网关配置回退规则，把所有前端路由请求统一指向 `index.html`。