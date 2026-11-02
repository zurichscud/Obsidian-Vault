---
title: CORS
---

## 1. 同源策略

> **同源策略**是浏览器的一种安全机制，用来限制不同来源（origin）的网页之间互相访问数据。

浏览器为了保护用户的隐私和数据安全，规定：**默认情况下，A 网站的脚本不能访问 B 网站的资源。**

只有当两个 URL 的**协议（Protocol）**、**域名（Domain）**和**端口（Port）**完全相同时，才算同源。只要有一个不同，就是**跨源（跨域）**。

## 2. 同源策略的触发时机

浏览器允许某些资源跨域加载：

```html
<img>
<script>
<link>
<video>
<audio>
```

这些都允许跨域资源加载，浏览器不会进行拦截。

当 JS 想读取跨域资源时，才会触发同源策略。例如：

```js
fetch("https://b.com/user")
```

> [!tip] 图片为什么不需要同源策略？
> 因为浏览器只是帮你下载并显示图片，但 JS 默认拿不到图片内容。所以浏览器认为风险较低。

## 3. CORS

CORS（Cross-Origin Resource Sharing，跨源资源共享）就是一套允许服务器声明“哪些源有权限访问我的资源”的标准机制。

浏览器在处理**跨域请求**时，会分为两种情况：

### 3.1 简单请求

满足特定条件（如使用 `GET`、`POST`、`HEAD` 方法，且 HTTP 头信息不超出常规范围）的请求。

- **流程**：浏览器直接发送请求，但在请求头中自动加上 `Origin: http://localhost:8080`。
- **服务器响应**：如果服务器同意，会在响应头中加上 `Access-Control-Allow-Origin: http://localhost:8080`（或者 `*`，代表允许所有人）。
- **结果**：浏览器检查到这个响应头，就把数据交给前端；如果没有这个头，浏览器就会拦截响应并报错。

任何自定义请求头或不符合 CORS 简单请求安全列表的标准请求头都会导致浏览器认为该请求具有“潜在风险”。

CORS 简单请求安全列表：

| **请求头（Header）** | **限制条件与说明** |
| ---------------------- | ------------------------------------------------------------ |
| User-Agent | - |
| Referer | - |
| Host | - |
| Connection | - |
| **`Accept`** | 告知服务器客户端可以处理的内容类型。通常无特殊限制。 |
| **`Accept-Language`** | 告知服务器客户端理解的语言。通常无特殊限制。 |
| **`Content-Language`** | 告知服务器请求体所使用的语言。通常无特殊限制。 |
| **`Content-Type`** | 仅限：`application/x-www-form-urlencoded`、`multipart/form-data`、`text/plain` |
| **`Range`** | 仅限简单的字节范围值（例如 `bytes=128-255`）。 |
| **`Viewport-Width`** | 视口宽度（客户端提示，较少手动设置）。 |
| **`Width`** | 图像宽度（客户端提示，较少手动设置）。 |
| **`DPR`** | 屏幕像素比（客户端提示）。 |
| **`Save-Data`** | 告知服务器客户端是否开启了节流模式。 |

### 3.2 预检请求

凡是可能对服务器数据产生副作用的请求（如 `PUT`、`DELETE`，或者发送了 `application/json` 格式的数据），在正式通信之前，浏览器都会先发送一次 **OPTIONS** 请求，这被称为“预检”。

- **流程**：
  1. 浏览器先发一个 `OPTIONS` 请求：“喂，我想用 `POST` 发点 JSON 数据，你允许吗？”
  2. 服务器回应：“可以，我允许来自该域名的 `POST` 请求。”
  3. 浏览器收到肯定答复后，才真正发送业务请求。

在实际开发中，几乎一定会触发预检：

| **行为** | **原因** |
| ----------------- | ------------------------------------------------------ |
| **携带 Token** | 设置了 `Authorization` 头部。 |
| **发送 JSON** | 设置了 `Content-Type: application/json`。 |
| **自定义 Header** | 比如公司规范要求的 `X-App-Version` 或 `X-Request-Id`。 |
| **非简单方法** | 使用 `PUT`、`DELETE`、`PATCH` 等方法。 |

### 3.3 预检请求缓存

浏览器通常会**缓存预检请求**的结果，这样可以减少不必要的预检请求。具体来说，浏览器会缓存 CORS 预检请求的响应结果，默认缓存时间为 **5 分钟**，你可以在响应头中使用 `Access-Control-Max-Age` 来设置缓存时间，例如：

```js
Access-Control-Max-Age: 3600
```

如果预检请求已经被发送并成功响应，**在缓存有效期内**，浏览器就不会每次都发出预检请求，而是直接发送实际请求。这是为了减少网络开销和提高性能。

> [!tip] 调试
> 预检请求在全部类型的请求中可以看到。如果需要停用预检请求缓存，你可以在浏览器调试工具中勾选停用缓存。

## 4. 相关 Header

### 4.1 Origin

用于指示请求的来源（协议、域名、端口），是 CORS 机制的核心组成部分。

| 属性 | 说明 |
| -------- | ---------------------------------------- |
| **类型** | Request Header |
| **格式** | `<scheme>://<host>[:<port>]` |
| **内容** | 仅包含协议、域名、端口，**不含路径和参数** |
| **可伪造性** | 浏览器自动添加，属于 Forbidden Header，前端 JS 无法手动修改 |

### 4.2 Access-Control-Allow-Origin

当页面发起跨域请求时，浏览器会检查响应中的 `Access-Control-Allow-Origin` 头，判断是否允许当前源读取响应内容。

只允许指定源访问：

```js
Access-Control-Allow-Origin: http://www.example.com
```

允许所有域访问：

```js
Access-Control-Allow-Origin: *
```

动态返回请求源。后端读取请求头里的 `Origin`，然后原样返回：

```js
Access-Control-Allow-Origin: Origin
```

### 4.3 Access-Control-Request-Method

- 预检请求中通过 `Access-Control-Request-Method` 告知服务器实际请求要用的方法。
- 服务器必须在响应中用 `Access-Control-Allow-Methods` 明确允许该方法，否则浏览器会拦截实际请求。

响应头示例如下：

```http
Access-Control-Allow-Methods: POST
```

### 4.4 Access-Control-Allow-Methods

参考 `Access-Control-Request-Method`。

```js
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
```

### 4.5 Access-Control-Request-Headers

- 预检请求中通过 `Access-Control-Request-Headers` 列出实际请求要用的头。
- 服务器必须在响应中用 `Access-Control-Allow-Headers` 明确允许这些头，否则浏览器会拦截实际请求。

具体流程：

1. 浏览器发送预检请求，携带请求头询问：

    ```http
    Access-Control-Request-Headers: Authorization, X-Custom-Header, Content-Type
    ```

2. 服务器如果允许这些请求头，需在响应中返回：

    ```http
    Access-Control-Allow-Headers: Authorization, X-Custom-Header, Content-Type
    ```

3. 浏览器校验匹配通过后，才会发送真正的业务请求。若服务器未声明允许某些 Header，浏览器将拦截实际请求并报 CORS 错误。

### 4.6 Access-Control-Allow-Headers

参考 `Access-Control-Request-Headers`。

### 4.7 Access-Control-Allow-Credentials

是否允许浏览器在跨域请求中携带用户凭证（Credentials）：

- Cookie
- Session ID
- HTTP 认证信息

## 5. 解决跨域

### 5.1 服务端

CORS 通常在服务端解决：

```js
const express = require('express');

const app = express();

app.use(express.json());
app.use((req,res,next)=>{
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next()
})

app.get('/get', (req, res) => {
  console.log('get request');
  res.send('GET');
});

app.delete('/delete', (req, res) => {
  console.log('delete request');
  res.send('DELETE');
});

app.listen(3000, () => {
  console.log('Server is running on port 3000...');
});
```

### 5.2 Postman

Postman 不是浏览器，不会受到 CORS 的影响。

- **跨域限制是浏览器的安全机制（Same-Origin Policy）**
- Postman 不是浏览器，不会执行浏览器的同源策略检查，也不会发送 `Origin`
- 因此 Postman 可以直接向任何地址发送 HTTP 请求
