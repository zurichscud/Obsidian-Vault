---

title: Session

---

## 为什么需要Session

  

**数据存储限制**：

  

- **Cookie** 有大小限制（通常是 4KB），而 **Session** 的数据存储在服务器上，容量几乎没有限制。需要存储较大的数据时（如用户资料、购物车内容、登录历史等），`cookie` 就变得不够用。

  

**数据安全性**：

  

- `cookie` 存储在客户端，容易被用户篡改。尽管可以设置 `httpOnly`、`secure` 等属性来增强安全性，但 `cookie` 依然有被盗用的风险。比如，用户可以通过浏览器开发者工具查看并修改 `cookie`。

- `session` 存储在服务器上，只有通过 **Session ID**（通常是存储在 `cookie` 中）来进行验证，所以可以有效避免客户端数据篡改的风险。即使 `Session ID` 被盗取，也可以通过其他安全措施（如 HTTPS、IP 白名单等）进一步降低风险。

  

## 实现

  

发送 `session` 的过程通常是通过在服务器端创建一个 **Session ID**，然后将其存储在客户端的 **cookie** 中，客户端每次发送请求时都自动携带这个 `Session ID`，以便服务器识别和管理会话。

  

```sh

npm install express-session

```

  

`express-session`会在每个 HTTP 请求中自动注入session对象。`session` 是由 `express-session` 中间件提供的附加功能，而不是 Express 本身的原生功能。

  

`req.sessionID`可以获取当前请求的sessionID

  

`req.session` 可以获取当前sessionID存储的session信息。主要由以下内容构成：

  

- cookie相关信息

- 自定义信息

  

```js

Session {

cookie: {

path: '/',

_expires: 2026-03-02T06:55:25.510Z,

originalMaxAge: 3600000,

httpOnly: true

},

user: { username: 'admin', userId: 1 }

}

```

  
  
  

```js

const express = require('express');

const session = require('express-session');

  

const app = express();

app.listen(3000, () => {

console.log('Server is running on port 3000...');

});

app.use(express.json());

app.use(session({

secret: 'hhahhahha',// 用于加密 sessionID，确保会话的安全性。

resave: false,

name: 'mySession',//会话Cookie的名称，避免与其他 cookie 冲突

saveUninitialized: true,

cookie: { maxAge: 3600 * 1000 }//// 设置 session 的过期时间，单位毫秒

}))

  

app.use((req, res, next) => {

res.set('Access-Control-Allow-Origin', '*');

res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');

res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

next()

})

  
  

app.get('/hello', (req, res) => {

if (req.session.user) {

console.log(req.sessionID);

console.log(req.session);

res.send(`Hello ${req.session.user.username}`);

} else {

res.send('Please login');

}

})

  

app.post('/login', (req, res) => {

if (req.body.username === 'admin' && req.body.password === '123456') {

req.session.user = {

username: req.body.username,

userId: 1,

}

res.send('Login successful');

} else {

res.send('Login failed');

}

})

  

app.post('/logout', (req, res) => {

req.session.destroy();

res.send('Logout successful');

})

```

  
  
  

```http

GET /api/user/info HTTP/1.1

Host: example.com

Cookie: mySession=s%3AFSM6eqWsePIaJ-oEjW5Ue1jvRjFZy8cP.g6pYbccnNnwO%2F%2FzwHJ%2F5bB4lmWXxn1F4cLj3qySaKS4

```