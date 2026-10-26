Express 路由的核心思想为：**把「一个 HTTP 请求（方法 + 路径）」映射到「处理函数」**。

## 1. 基本路由

通过 `app.get()`、`app.post()` 等与 HTTP 方法同名的方法注册路由；使用 `app.all()` 则可匹配所有 HTTP 方法（不区分 GET、POST 等）。

以下代码演示通过与 HTTP 方法对应的方法注册路由，以及使用 `app.all()` 匹配所有 HTTP 方法：

```js
const express = require('express');
const app = express();

// 方法名对应 HTTP 方法：get / post / put / patch / delete / options / head
app.get('/', (req, res) => {
  res.send('首页');
});

app.post('/users', (req, res) => {
  res.json({ ok: true });
});

// 匹配所有方法（不区分 GET/POST...）
app.all('/ping', (req, res) => {
  res.send('pong');
});
```

## 2. 路由路径与传参方式

路由路径的形式可以为字符串、模式或正则表达式。

Express 主要依赖 `req` 对象的四个属性解析入参，分别对应不同的传参场景：

| 传参方式         | 示例                          | 获取方式                                       | 说明                                                                                                           |
| ------------ | --------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| 路径参数（Params） | `/users/42`                 | `'/users/:id'` → `req.params.id`           | `:id` 匹配任意值（如 `/users/1`、`/users/abc`）；支持多个连续参数 `/users/:userId/posts/:postId`，或用 `?` 声明可选参数（Express 5 依然支持） |
| 查询参数（Query）  | `/users?page=1&limit=10`    | `req.query.page`、`req.query.limit`         | 读取 URL 中的查询参数                                                                                                |
| 请求体（Body）    | `POST /users`               | `req.body.username`                        | 需配合 `express.json()` 解析 JSON 请求体                                                                             |
| 请求头（Headers） | `Authorization: Bearer ...` | `req.get('Authorization')` / `req.headers` | `req.get()` 读取单个请求头，`req.headers` 直接访问全部                                                                     |

## 3. 单路由挂载多个处理函数

路由处理函数的本质即为中间件，支持在单个路由中连续声明，并通过 `next()` 传递控制权：

以下代码演示在同一个路由上配置多个处理函数，并通过 `next()` 移交控制权或使用 `next('route')` 跳至下一条匹配路由：

```js
function checkId(req, res, next) {
  if (isNaN(req.params.id)) return next('route'); // 跳到下一条匹配的路由
  next(); // 进入下一个处理函数
}

app.get('/users/:id', checkId, (req, res, next) => {
  // ...查库
  next();
}, (req, res) => {
  res.send('渲染结果');
});
```

## 4. 链式路由写法

使用 `app.route()` 可将针对同一路径的多种 HTTP 方法集中定义，避免重复编写路径：

以下代码演示使用 `app.route()` 针对同一路径链式绑定多种 HTTP 方法的处理函数：

```js
app.route('/books/:id')
  .get((req, res) => res.send('查询'))
  .put((req, res) => res.send('更新'))
  .delete((req, res) => res.send('删除'));
```

## 5. 模块化路由

在实际项目中通常不将所有路由直接堆叠在入口文件，而是使用 `Router` 进行拆分管理。

### 5.1 使用 Router 拆分路由

通过创建 `express.Router()` 实例，将一组关联的路由定义在独立的模块文件中：

以下代码演示使用 `express.Router()` 在独立文件中创建路由并导出模块：

```js
// routes/users.js
const router = express.Router();

router.get('/', (req, res) => res.send('用户列表'));
router.get('/:id', (req, res) => res.send(`用户 ${req.params.id}`));

module.exports = router;
```

### 5.2 挂载 Router 实例

在入口文件中使用 `app.use()` 为 Router 实例绑定访问前缀，最终请求路径为“前缀 + 路由内部定义的路径”，同时支持在 Router 级别挂载中间件：

以下代码演示在入口文件中通过 `app.use()` 挂载 Router 模块并配置路径前缀及中间件：

```js
// app.js
const users = require('./routes/users');

// 挂载到前缀上，最终路径 = 前缀 + 路由内定义的路径
app.use('/users', users);   // GET /users、GET /users/123

// 也可以给整个 Router 再挂中间件
app.use('/admin', authRequired, adminRoutes);
```

### 5.3 Router 内部的链式写法

在 Router 实例内部同样支持使用 `router.route()` 进行链式定义：

以下代码演示在 Router 实例内部使用 `router.route()` 针对同一路径进行链式绑定：

```js
router.route('/:id')
  .get(...)
  .patch(...);
```

## 6. 路由匹配顺序

Express 按照**注册顺序**依次尝试匹配路由，一旦命中第一条匹配项即停止向下查找。

### 6.1 静态路径优先于动态参数

静态路径必须声明在动态参数路由之前，否则静态路径名称会被动态参数捕获：

以下代码演示将静态路径路由声明在动态参数路由之前的注册顺序：

```js
app.get('/users/new', ...);   // 必须放在 /users/:id 之前
app.get('/users/:id', ...);   // 否则 "new" 会被当成 id
```

### 6.2 兜底 404 处理

404 兜底处理必须放置在所有业务路由之后：

以下代码演示置于所有路由之后的 404 兜底处理函数：

```js
app.use((req, res) => {
  res.status(404).send('Not Found');
});
```
