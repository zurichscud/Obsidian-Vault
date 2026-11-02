## 1. 作用

`X-Content-Type-Options` 是 HTTP **响应头**，用于阻止浏览器对响应内容进行 **MIME 类型嗅探**（MIME sniffing），强制浏览器严格遵循服务器声明的 `Content-Type` 处理资源
```
X-Content-Type-Options: nosniff
```

## 2. 背景

浏览器有时会忽略服务器声明的 `Content-Type`，转而根据响应内容猜测实际类型（MIME sniffing）。例如，一个被标记为 `text/plain` 的文件，可能被浏览器 sniff 出是 HTML/JS 并执行，从而带来 XSS/内容注入风险。

## 3. 启用后的行为

`X-Content-Type-Options` 是**标准化的 HTTP 响应头**，并非自定义响应头。早期非标准头常用 `X-` 前缀，但 `X-Content-Type-Options` 虽带 `X-` 前缀，已被主流浏览器**标准化实现**，浏览器会主动读取这个响应头。
