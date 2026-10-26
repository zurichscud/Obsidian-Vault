## 1. 作用

`X-Content-Type-Options: nosniff` 是一个 HTTP 安全响应头，用于禁止浏览器进行 MIME 类型嗅探。

## 2. 背景

浏览器有时会忽略服务器声明的 `Content-Type`，转而根据响应内容猜测实际类型（MIME sniffing）。例如，一个被标记为 `text/plain` 的文件，可能被浏览器 sniff 出是 HTML/JS 并执行，从而带来 XSS/内容注入风险。

## 3. 启用后的行为

加上 `nosniff` 后，浏览器会严格按服务器声明的 `Content-Type` 处理，不再猜测。
