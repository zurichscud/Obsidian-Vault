---
title: Cookie
---

`Cookie` 是一种存储在客户端（浏览器）的小型数据，通常用于存储用户的偏好设置、会话信息或跟踪用户行为等。

## 1. Cookie 结构

Cookie 的结构如下：

![Cookie 结构](https://markdown-lai.oss-cn-hangzhou.aliyuncs.com/typora/image-20260302101637833.png)

### 1.1 name 与 value

Cookie 由名称和值组成。下面是一个 `Set-Cookie` 响应的示例：

```http
Set-Cookie: myCookie=value; Path=/; HttpOnly; Secure;
```

`myCookie` 就是这个 cookie 的 name。

如果你想在一次响应中设置多个 `Cookie`，你可以在 HTTP 响应头中使用多个 `Set-Cookie` 字段。例如：

```http
HTTP/1.1 200 OK
Set-Cookie: cookie1=value1; Path=/; HttpOnly; Secure
Set-Cookie: cookie2=value2; Path=/; HttpOnly; Secure
Set-Cookie: cookie3=value3; Path=/; HttpOnly; Secure
```

### 1.2 其他属性

- **SameSite**：用于解决 CSRF。
- **Expires / Max-Age**：指定 Cookie 的过期时间或存活时长。如果没有设置，Cookie 会在会话结束时自动失效（即用户关闭浏览器时失效）。当你在 `cookie` 中设置了 `max-age` 属性时，浏览器会根据这个值计算并存储 **cookie 的过期时间**，而不是存储 `max-age` 本身。`max-age` 的单位是秒。
- **Path**：指定 Cookie 可访问的路径。默认是设置为当前请求所在的路径。
- **Secure**：如果设置了 `Secure`，那么 Cookie 只会通过 HTTPS 协议传输。

### 1.3 Domain

指定 Cookie 可访问的域名。默认是服务端所在的域名。

根据 Cookie 的标准，`Domain` 属性决定了哪些域名可以访问该 Cookie。为了安全性考虑，浏览器不允许**跨主域**设置 Cookie。

设置 Cookie 时，`Domain` 必须属于设置 Cookie 的当前域名或它的父域。对应示例如下：

```text
api.a.com ->b.com //×
api.a.com ->a.com //×
```

在现代浏览器中，设置 `Domain=juejin.cn` 和 `Domain=.juejin.cn` 的效果是**完全一样**的，都是允许该域名及其所有子域名。

> [!warn]
> Cookie 始终属于设置它的源。因此，如果你的服务位于 `localhost:3000`，那么 cookie 将存在于 `localhost:3000`，而不是 `localhost:3001`。

### 1.4 HttpOnly

如果设置了 `HttpOnly`，那么 Cookie 只能被服务器访问，JavaScript 无法访问，从而增强了安全性。

## 2. Cookie 特点

- **存储位置**：存储在用户的浏览器中，每个域名都有自己独立的 Cookie 存储区域。
- **大小限制**：每个 Cookie 的大小限制通常为 4 KB 左右。
- **会话 Cookie 与持久化 Cookie**：
  - **会话 Cookie**：没有设置 `Expires` 或 `Max-Age` 的 Cookie 会在浏览器会话结束时失效。
  - **持久化 Cookie**：设置了 `Expires` 或 `Max-Age` 的 Cookie 会在指定时间过期，直到过期时间到达，才会被删除。

## 3. Cookie 的生命周期

### 3.1 颁发

Cookie 是由后端服务器通过 HTTP 响应头（Response Header）“种”到浏览器里的。

服务器验证成功，并在返回数据时附带一个 `Set-Cookie` 字段。响应示例如下：

```http
HTTP/1.1 200 OK
Set-Cookie: session_id=abc123; Max-Age=3600; HttpOnly; SameSite=Lax
```

### 3.2 存储

浏览器接收到该响应后，会自动解析这个字段，并将其存储在本地的 **Cookie 存储区**（按域名隔离）。

### 3.3 携带

当你再次发起请求（无论是刷新页面、点击链接，还是 Axios 发请求），浏览器会检查当前请求的 **域名（Domain）** 和 **路径（Path）**。

如果匹配成功，浏览器会自动把对应的 Cookie 放入请求头中，不需要你在 TS 代码里手动写任何逻辑。请求头示例如下：

```http
GET /api/user/info HTTP/1.1
Host: example.com
Cookie: session_id=abc123; theme=dark
```

### 3.4 销毁

浏览器会在以下三种情况清理 Cookie：

1. **过期失效：** 达到了 `Expires` 指定的时间点，或超过了 `Max-Age` 的秒数。
2. **会话结束：** 如果没设过期时间，这就是一个 **Session Cookie**。当你彻底关闭浏览器程序（注意：有时后台进程不杀掉不算关闭）时，它会被清除。
3. **手动清理：** 用户在浏览器设置里点击“清除浏览数据”，或者开发者在控制台 Application 面板手动删除。

## 4. CSRF

为什么 Domain + Path 挡不住 CSRF？

假设你正在开发一个管理后台 `admin.example.com`：

1. 你设置了 `Domain=.example.com; Path=/`。
2. 用户登录了你的后台，浏览器存下了 Session Cookie。
3. 用户在同一个浏览器的另一个标签页打开了一个恶意网站 `malicious.com`。
4. 这个恶意网站后台静默发送了一个 POST 请求到 `admin.example.com/delete-user`。

尽管 `malicious.com` 无法通过 JS 读取你的 Cookie（受同源策略限制），但浏览器在发送这个 POST 请求时，发现目标域名是 `admin.example.com`，符合你设置的 `Domain` 和 `Path`，于是**自动带上了 Cookie**。这就是典型的 **CSRF（跨站请求伪造）**。

`SameSite` 属性正是为了在协议层堵死这个漏洞。它有三个值：

| **取值**   | **表现**                                               | **作用**                                                     |
| ---------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| **Strict** | 只有当前网页 URL 与请求目标一致时，才带 Cookie。       | 最安全，但从 Google 搜索结果跳转进站时会发现没登录。         |
| **Lax**    | 默认值。跨站时只允许 GET 请求（GET 请求不会修改数据）  | **防御 CSRF 的利器**，平衡了安全与体验。                     |
| **None**   | 无论跨不跨站都带 Cookie。                              | 必须配合 `Secure` 标志使用，通常用于第三方广告或嵌入式组件。 |

## 5. 实现

以下代码用 Express 演示设置与读取 Cookie：

```js
const express = require('express');
const app = express();

app.get('/set-cookie', (req, res) => {
  // 发送一个名为 "user" 的 Cookie，值为 "JohnDoe"
  res.cookie('user', 'JohnDoe');
  res.send('Cookie has been set!');
});

app.get('/get-cookie', (req, res) => {
  // 读取 Cookie（会通过 cookie-parser 中间件）
  console.log(req.cookies.user); // 输出 "JohnDoe"
  res.send('Cookie fetched!');
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```
