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

路由路径可以为字符串、模式或正则表达式。

### 2.1 四种传参方式

Express 主要依赖 `req` 对象的四个属性解析入参，分别对应不同的传参场景：

| 传参方式 | 示例 | 获取方式 | 说明 |
| --- | --- | --- | --- |
| 路径参数（Params） | `/users/42` | `'/users/:id'` → `req.params.id` | `:id` 匹配任意值（如 `/users/1`、`/users/abc`）；支持多个连续参数 `/users/:userId/posts/:postId`，或用 `?` 声明可选参数（Express 5 依然支持） |
| 查询参数（Query） | `/users?page=1&limit=10` | `req.query.page`、`req.query.limit` | 读取 URL 中的查询参数 |
| 请求体（Body） | `POST /users` | `req.body.username` | 需配合 `express.json()` 解析 JSON 请求体 |
| 请求头（Headers） | `Authorization: Bearer ...` | `req.get('Authorization')` / `req.headers` | `req.get()` 读取单个请求头，`req.headers` 直接访问全部 |

## 3. 单路由挂载多个处理函数

路由处理函数的本质即为**中间件**，支持在单个路由中连续声明，并通过 `next()` 传递控制权：

以下代码演示在同一个路由上配置多个处理函数，并通过 `next()` 移交控制权，或使用 `next('route')` 跳至下一条匹配路由：

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

## 4. 链式路由

使用 `app.route()` 可将针对同一路径的多种 HTTP 方法集中定义，避免重复编写路径：

以下代码演示使用 `app.route()` 针对同一路径链式绑定多种 HTTP 方法的处理函数：

```js
app.route('/books/:id')
  .get((req, res) => res.send('查询'))
  .put((req, res) => res.send('更新'))
  .delete((req, res) => res.send('删除'));
```

## 5. 模块化路由

在 Express 中，**模块化路由**的核心思想是将不同功能或业务模块的路由（如用户、文章、商品等）拆分到独立的子文件中，而不是全部堆砌在入口文件（如 `app.js` 或 `index.js`）中。

Express 提供了内置的 `express.Router()` 机制来实现这一设计。

### 5.1 标准项目结构示例

标准项目结构如下：

```text
my-project/
├── routes/
│   ├── index.js      # 汇总所有路由（可选）
│   ├── users.js      # 用户模块路由
│   └── goods.js      # 商品模块路由
├── app.js            # 入口文件
└── package.json
```

### 5.2 在独立文件中创建路由模块

使用 `express.Router()` 创建路由实例，定义路径与处理函数，最后导出该实例：

```js
// routes/users.js
const express = require('express');
const router = express.Router();

// 匹配 GET /users
router.get('/', (req, res) => {
  res.json({ message: '获取用户列表' });
});

// 匹配 GET /users/:id
router.get('/:id', (req, res) => {
  const { id } = req.params;
  res.json({ message: `获取 ID 为 ${id} 的用户详情` });
});

// 匹配 POST /users
router.post('/', (req, res) => {
  res.status(201).json({ message: '创建新用户' });
});

module.exports = router;
```

### 5.3 在主应用中挂载路由

使用 `app.use('公共前缀', 路由对象)` 绑定前缀路径：

```js
// app.js
const express = require('express');
const app = express();

app.use(express.json());

// 导入路由模块
const userRouter = require('./routes/users');

// 挂载路由，所有 userRouter 内的相对路径都会拼上 '/users' 前缀
app.use('/users', userRouter);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### 5.4 进阶用法

#### 模块级中间件

可以在单个路由模块上挂载专属于该模块的中间件（例如身份认证、参数校验），不会影响到其他模块：

```js
// routes/users.js
// 仅针对 /users 下的所有请求生效
router.use((req, res, next) => {
  console.log(`[Users API] 请求时间: ${Date.now()}`);
  next();
});
```

#### 统一路由聚合入口

当项目模块较多时，可以在 `routes/index.js` 中集中挂载，避免 `app.js` 引入过多文件：

```js
// routes/index.js
const express = require('express');
const router = express.Router();

router.use('/users', require('./users'));
router.use('/goods', require('./goods'));

module.exports = router;
```

主入口直接引入即可：

```js
// app.js
const routes = require('./routes');
app.use('/api', routes); // 最终路径如 /api/users, /api/goods
```

## 6. 路由匹配顺序

Express 按照**注册顺序**依次尝试匹配路由，一旦命中第一条匹配项即停止向下查找。

以下代码演示注册顺序导致的匹配问题：请求 `/users/profile` 会先命中 `/users/:id`，后注册的路由永远无法被执行到：

```js
// ❌ 错误：请求 /users/profile 会先命中 /users/:id，其中 id 值为 'profile'
router.get('/users/:id', (req, res) => {
  res.send(`User ID: ${req.params.id}`);
});

router.get('/users/profile', (req, res) => {
  res.send('User Profile'); // 永远无法被执行到
});
```
