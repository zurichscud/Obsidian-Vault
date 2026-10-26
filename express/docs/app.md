## 1. 创建与启动

从零构建并启动一个基础 Express 服务的完整实现如下：

```js
// app.js
const express = require('express');
const app = express();
const PORT = 3000;

// 1. 内置中间件：解析 JSON 请求体（类似 Spring 中的 @RequestBody 解析）
app.use(express.json());

// 2. 自定义中间件：日志拦截器
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next(); // 放行到下一个中间件/路由
});

// 3. 根路径路由
app.get('/', (req, res) => {
  res.send({ status: 'ok', message: 'Hello from Express!' });
});

// 4. 启动监听
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
```

## 2. 应用配置

### 2.1 读写配置项

通过 `app.set()` 与 `app.get()` 存取配置项：

```js
app.set('port', 3000);
app.set('views', './views');
console.log(app.get('port')); // 3000
```

- 获取配置时，`app.get(name)` 仅传入单个字符串参数。
- 当 `app.get(path, handler)` 传入两个及以上参数时则为注册路由，二者不可混淆。

布尔开关型配置支持使用简写方法操作：

```js
app.enable('trust proxy');
app.disable('x-powered-by');
app.enabled('trust proxy'); // true
```

### 2.2 常用内置配置

常用内置配置项如下表所示：

| 配置项 | 默认值 | 说明 |
|---|---|---|
| `env` | `NODE_ENV \|\| development` | 运行环境，影响错误页详细程度 |
| `trust proxy` | `false` | 反向代理后是否信任 `X-Forwarded-*`，Nginx 后面部署时需开 |
| `views` | `./views` | 模板文件目录 |
| `view engine` | 未设置 | 默认模板引擎，如 `ejs` |
| `case sensitive routing` | `false` | 路由是否区分大小写 |
| `strict routing` | `false` | `/user` 与 `/user/` 是否视为不同路由 |
| `x-powered-by` | `true` | 是否返回 `X-Powered-By: Express` 头，建议生产关闭 |

生产环境下的典型配置如下：

```js
app.set('trust proxy', 1);
app.disable('x-powered-by');
```

### 2.3 应用级局部变量

将应用全局变量挂载至 `app.locals`，供所有模板和请求共享读取：

```js
app.locals.title = 'My App';
app.locals.version = '1.0.0';
```

`app.locals` 与 `res.locals` 的主要区别在于作用域：

- `app.locals`：全局有效，在应用生命周期内常驻。
- `res.locals`：单次请求有效，适合存放当前用户、CSRF token 等信息。

## 3. 挂载路由与中间件

### 3.1 通用挂载

为所有请求挂载全局日志中间件，并针对 `/api` 路径单独挂载 JSON 解析中间件：

```js
app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});
app.use('/api', express.json());
```

`app.use([path,] fn)` 遵循前缀匹配规则：
- `app.use('/api', ...)` 会命中 `/api` 与 `/api/users`。
- 不会命中 `/`。

### 3.2 方法路由

为指定路径分别注册不同 HTTP 方法的处理函数：

```js
app.get('/users', listUsers);
app.post('/users', createUser);
app.all('/ping', (req, res) => res.send('pong'));
```

若针对同一路径定义多个方法，可使用 `app.route()` 链式书写以集中管理：

```js
app.route('/users/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);
```

## 4. 推荐目录结构

### 4.1 目录职责划分

`express-generator` 默认采用平铺结构，接口增多后难以维护。建议按职责进行拆分，`app.js` 仅负责组装。按职责拆分后的推荐目录结构如下：

```text
src/
├── app.js              # 创建app，挂载中间件和路由，不调用listen
├── server.js           # 只做 app.listen，方便测试时直接引app不启动端口
├── routes/             # 只定义路径和参数，不写业务
│   └── users.js
├── controllers/        # 处理 req/res，只做参数搬运和状态码
│   └── users.js
├── services/           # 纯业务逻辑，可被复用和单测
│   └── users.js
└── middlewares/        # auth、validate、error-handler
    └── auth.js
```

### 4.2 组装与启动解耦

最小可运行的 `app.js` 仅负责中间件与路由的组装：

```js
const express = require('express');
const usersRouter = require('./routes/users');

const app = express();
app.use(express.json());
app.use('/users', usersRouter);

module.exports = app;
```

独立启动文件 `server.js` 负责监听端口，与业务解耦后，测试时可直接引入 `app` 而无需占用端口：

```js
const app = require('./app');
const port = app.get('port') || 3000;
app.listen(port);
```
