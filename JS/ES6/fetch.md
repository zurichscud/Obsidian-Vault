`fetch` 是现代浏览器（以及 Node.js 18+）内置的用于发起网络请求的原生 API。它基于 **Promise** 设计，用于替代传统的 `XMLHttpRequest`（XHR），语法更简洁、语义更清晰。

## 1. 基础 GET 请求

最简单的 `fetch` 只需传入一个 URL，默认发起 `GET` 请求。

注意：`fetch` 需要经过**两次 `await`（或 `.then`）**——第一次获取响应头（`Response` 对象），第二次解析响应体（如 JSON 或文本）。

```js
async function getUsers() {
  try {
    const response = await fetch('https://api.example.com/users');

    // 关键细节：fetch 只有在网络断开等极端情况才会 reject
    // 遇到 404 或 500 状态码时，response.ok 为 false，需要手动抛出错误
    if (!response.ok) {
      throw new Error(`HTTP 错误! 状态码: ${response.status}`);
    }

    const data = await response.json(); // 解析 JSON（还有 .text(), .blob(), .formData()）
    console.log(data);
  } catch (error) {
    console.error('请求失败:', error);
  }
}
```

## 2. 发送 POST 请求与常用配置项

通过第二个参数 `options` 对象，可以配置请求方法、请求头、请求体、跨域凭证等。

```js
async function createPost(postData) {
  const response = await fetch('https://api.example.com/posts', {
    method: 'POST', // 'GET', 'POST', 'PUT', 'DELETE', 'PATCH'
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer your-token-here'
    },
    // body 必须是字符串、FormData、Blob 等，不能直接传 JS 对象
    body: JSON.stringify(postData),
    // 跨域请求时是否携带 Cookie：'same-origin'（默认）、'include'（总是携带）、'omit'（不携带）
    credentials: 'include'
  });

  if (!response.ok) throw new Error('创建失败');
  return await response.json();
}
```

> **提示：** 如果上传文件使用 `FormData` 作为 `body`（`body: formData`），**不要手动设置 `Content-Type`**，浏览器会自动生成并附带正确的 `boundary` 分隔符。

## 3. 请求体配置

如果你在 `headers` 里**没有显式设置** `Content-Type`，`fetch` 会严格遵循 Fetch 标准，**根据 `body` 的数据类型自动推断并设置**对应的 `Content-Type`；一旦你手动配置了，就会优先使用你配置的（个别特殊情况除外）。

具体映射规则如下。

### 3.1 自动生成的场景

当你传入以下特定类型的 `body` 时，浏览器会自动帮你填好最合适的 `Content-Type`：

| `body` 传入的数据类型 | 自动生成的 `Content-Type` | 说明与注意事项 |
| --- | --- | --- |
| `FormData` | `multipart/form-data; boundary=----WebKitFormBoundary...` | **绝对不要手动配置！** 浏览器会自动生成随机的 `boundary` 分隔符，手动写死会导致后端无法解析字段和文件。 |
| `URLSearchParams` | `application/x-www-form-urlencoded;charset=UTF-8` | 表单键值对格式（如 `a=1&b=2`）。 |
| `Blob` / `File` | 读取对象自身的 `blob.type` 属性 | 比如上传一个 `new File(..., { type: 'image/png' })`，会自动设为 `image/png`。如果 `type` 为空，则不设置请求头。 |
| `String`（普通字符串） | `text/plain;charset=UTF-8` | **注意**：哪怕你的字符串是 `JSON.stringify(obj)` 变来的，对 `fetch` 而言它依然只是个“字符串”，默认也会被当成纯文本！ |

### 3.2 必须手动配置的场景

最典型的就是**发送 JSON 数据**：

```js
fetch('/api/user', {
  method: 'POST',
  headers: {
    // 必须手动写！否则默认是 text/plain，后端框架（如 Spring Boot / Express）可能不会按 JSON 解析
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ name: 'Alice' }) // 本质上是 String 类型
});
```

此外，如果你传入的是 `ArrayBuffer`、`TypedArray`（如 `Uint8Array`）或 `ReadableStream`，`fetch` **不会**自动设置 `Content-Type`，此时也需要根据实际传输的二进制格式手动指定（例如 `application/octet-stream`）。

## 4. 请求中断与超时控制

`fetch` 本身没有内置 `timeout` 参数，通常结合原生的 `AbortController` 来实现请求取消或超时中断（在切换路由或防抖搜索时非常有用）。

```js
async function fetchWithTimeout(url, timeout = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout); // 到点触发中断

  try {
    const response = await fetch(url, {
      signal: controller.signal // 绑定信号
    });
    clearTimeout(timer); // 请求成功，清除定时器
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('请求超时或被手动取消');
    } else {
      console.error('其他错误:', error);
    }
  }
}
```

## 5. 读取流式数据（Streaming）

`fetch` 原生支持读取响应流（`response.body` 是一个 `ReadableStream`），这在处理大文件下载进度或大模型（LLM）的 SSE（Server-Sent Events）打字机输出时非常核心。

```js
async function readStream(url) {
  const response = await fetch(url);
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    // value 是 Uint8Array 二进制块，解码为文本
    console.log(decoder.decode(value, { stream: true }));
  }
}
```
