`window.location`（也可简写为 `location`）用于解析当前页面的 URL 信息以及控制页面导航。它同时挂载在 `document.location` 上，两者指向同一个对象。

## 1. URL 结构解析属性

假设当前访问的 URL 为：

`https://example.com:8080/products/detail?id=101&tag=new#reviews`

| 属性 | 示例返回值 | 说明 |
| --- | --- | --- |
| **`href`** | `https://example.com:8080/products/detail?id=101&tag=new#reviews` | 完整的 URL 字符串。**直接赋值会触发页面跳转** |
| **`protocol`** | `"https:"` | 协议部分（包含末尾的冒号 `:`） |
| **`host`** | `"example.com:8080"` | 域名 + 端口号（如果是默认端口 80/443 则不显示） |
| **`hostname`** | `"example.com"` | 纯域名（不含端口） |
| **`port`** | `"8080"` | 端口号（默认端口下返回空字符串 `""`） |
| **`pathname`** | `"/products/detail"` | 路径部分（以 `/` 开头） |
| **`search`** | `"?id=101&tag=new"` | 查询参数部分（包含开头的 `?`） |
| **`hash`** | `"#reviews"` | 锚点/哈希部分（包含开头的 `#`） |
| **`origin`** | `https://example.com:8080` | 协议 + 域名 + 端口（只读属性，常用于跨域校验） |

## 2. 核心导航与刷新方法

### 修改`location.href`

直接给 `location.href` 赋值，本质上是**让当前浏览器标签页像用户点击了一个普通 `<a>` 标签一样，发起一次完整的 HTTP 请求并跳转到新地址**。

### 2.1 `location.assign(url)`

- **作用**：加载新的文档（效果等同于直接给 `location.href` 赋值）。
- **历史记录**：会在浏览器历史栈中生成一条新记录，用户可以点击“后退”按钮返回上一页。

### 2.2 `location.replace(url)`

- **作用**：用新页面替换当前页面。
- **历史记录**：**不会**生成新的历史记录，而是直接覆盖当前历史条目。用户无法通过“后退”回到原页面（常用于登录页跳转首页、支付完成页等防止重复提交的场景）。

### 2.3 `location.reload()`

- **作用**：重新加载当前页面（相当于点击浏览器刷新按钮）。

## 3. 最佳实践

### 3.1 解析查询参数

`location.search` 返回的是原始字符串，现代前端开发通常配合 `URLSearchParams` 使用：

```js
// 当前 URL: ?id=101&tag=new
const params = new URLSearchParams(location.search);

params.get('id');      // "101"
params.has('tag');     // true
```

### 3.2 局部修改而不整页刷新

- 修改 `location.hash` 只会触发页面滚动到对应锚点并触发 `hashchange` 事件，不会向服务器重新请求整个页面（早期 SPA 路由的 Hash 模式原理）。
- 如果需要修改 `pathname` 或 `search` 且**不刷新页面**，不能直接赋值给 `location`，必须改用 `history.pushState()` 或 `history.replaceState()`。
