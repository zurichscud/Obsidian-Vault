请求体的数据格式不同，HTTP 的 `Content-Type` 请求头也不同。

|发送方式|`body` 的值|`Content-Type`|实际发送的数据|
|---|---|---|---|
|JSON|`JSON.stringify(obj)`|`application/json`|JSON 文本|
|普通文本|字符串|`text/plain`|文本数据|
|文件|`File` 对象|`image/png` 等|文件的原始字节|

```js
// 发送 JSON
fetch("/api/users", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ name: "Tom", age: 18 }),
});

// 发送普通文本
fetch("/api/text", {
  method: "POST",
  headers: {
    "Content-Type": "text/plain",
  },
  body: "Hello World",
});

// 发送文件
fetch(uploadUrl, {
  method: "PUT",
  headers: {
    "Content-Type": file.type,
  },
  body: file,
});
```