在 Express 中，`req`（Request）对象代表客户端发起的 HTTP 请求。它是基于 Node.js 原生的 `http.IncomingMessage` 构建并进行了扩展，封装了路由参数、查询参数、请求体、请求头等核心数据。

## 1. 核心属性与参数获取

针对不同的传参方式，Express 提供了清晰的属性来提取数据。

### 1.1 路径参数（`req.params`）

`req.params` 用于匹配动态路由中的占位符。以下代码演示在 `/users/:id` 路由下，从 `/users/42` 中读取路径参数：

```js
// 路由定义：app.get('/users/:id', handler)
// 请求路径：/users/42
console.log(req.params.id); // '42'
```

### 1.2 查询字符串（`req.query`）

`req.query` 自动解析 URL 中 `?` 后的键值对。以下代码演示从 `/search?keyword=vue&page=1` 中读取查询参数：

```js
// 请求路径：/search?keyword=vue&page=1
console.log(req.query.keyword); // 'vue'
console.log(req.query.page);    // '1'
```

### 1.3 请求体（`req.body`）

`req.body` 提取 POST/PUT 等请求携带的数据。使用前需要挂载对应的解析中间件（如 `express.json()` 或 `express.urlencoded()`），否则默认值为 `undefined`。

以下代码演示挂载 `express.json()` 解析 `application/json` 后，读取请求体中的字段：

```js
app.use(express.json()); // 解析 application/json
// POST 请求体: {"username": "alex"}
console.log(req.body.username); // 'alex'
```

## 2. URL 与路由相关属性

下表列出 URL 与路由相关的属性，示例均针对请求 `/api/users?sort=asc`：

| **属性**            | **作用**                               | **示例**                  |
| ----------------- | ------------------------------------ | ----------------------- |
| `req.path`        | 请求路径（不含协议、主机和查询参数）                   | `'/api/users'`          |
| `req.originalUrl` | 完整的原始请求 URL（保留在中间件/子路由前）             | `'/api/users?sort=asc'` |
| `req.baseUrl`     | 当前子路由挂载的基础路径（结合 `express.Router` 使用） | `'/api'`（若挂载在 `/api`）   |
| `req.method`      | HTTP 请求方法（大写字符串）                     | `'GET'`, `'POST'`       |

## 3. 请求头与网络上下文

### 3.1 读取 Header（`req.get()` / `req.headers`）

`req.get(field)` 是大小写不敏感的方法，推荐使用。以下代码演示读取 `Authorization` 与 `Content-Type` 请求头：

```js
const token = req.get('Authorization');
const contentType = req.get('Content-Type');
```

### 3.2 IP 与协议

- `req.ip`：客户端远程 IP 地址。若应用部署在反向代理（如 Nginx）后，需设置 `app.set('trust proxy', true)` 才能获取真实 IP。
- `req.protocol`：`'http'` 或 `'https'`。
- `req.secure`：布尔值，等价于 `req.protocol === 'https'`。

## 4. 内容协商与校验方法

Express 内置了一系列便利方法，用于判断客户端接受的数据类型或传递的文件格式。

### 4.1 `req.is(type)`

`req.is(type)` 检查 `Content-Type` 是否匹配指定 MIME 类型。以下代码演示判断客户端发送的是否为 JSON：

```js
if (req.is('json')) {
  // 客户端发送的是 JSON
}
```

### 4.2 `req.accepts(types)`

`req.accepts(types)` 根据客户端的 `Accept` 请求头，判断最佳返回格式。以下代码演示在 `html` 与 `json` 中取得匹配度最高的一种格式：

```js
req.accepts(['html', 'json']); // 返回匹配度最高的一种格式
```

## 5. 请求上下文传递与自定义属性

由于 Express 中间件链式调用的特性，`req` 是在整个请求生命周期中共享的唯一实例。工程实践中常在 `req` 上挂载身份鉴权或上下文信息。

以下代码为鉴权中间件示例：把解析出的用户信息挂载到 `req` 上，供后续控制器使用。

```js
// 鉴权中间件示例
function authMiddleware(req, res, next) {
  const token = req.get('Authorization');
  const user = verifyToken(token); // 自定义解码逻辑
  
  // 将解析出的用户信息挂载在 req 上，供后续控制器使用
  req.user = user; 
  next();
}

app.get('/profile', authMiddleware, (req, res) => {
  res.json({ id: req.user.id, name: req.user.name });
});
```
