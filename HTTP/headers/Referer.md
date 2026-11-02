`Referer` 是 HTTP 请求头字段，用于告知服务器当前请求的**来源页面 URL**。由于 HTTP 规范早期的拼写错误，技术实现中沿用 `Referer`（少一个 `r`），但正确拼写应为 `Referrer`。

## 1. 核心作用

- **防盗链**：静态资源服务器（图片、视频、下载文件）通过检查请求头中的 `Referer` 是否属于自己的域名或白名单，来阻止其他网站直接外链自己的资源。
- **数据分析与用户行为追踪**：网站分析工具（如 Google Analytics、百度统计）通过解析 `Referer`，判断流量来源（如来自搜索引擎、社交媒体还是外部合作站）。
- **安全防护（CSRF 辅助防御）**：在处理敏感操作请求（POST/PUT）时，服务端可校验 `Referer` 是否来自同源站点，作为防范跨站请求伪造（CSRF）的补充手段。
- **日志排查与审计**：排查错误链接（404）时，可以通过 `Referer` 定位是哪一个页面上的死链接触发了错误。

## 2. 发送规则

当用户在 `https://example.com/blog/article-1` 页面点击了一个指向 `https://api.example.com/data` 的链接时，浏览器发出的请求会包含：

```http
GET /data HTTP/1.1
Host: api.example.com
Referer: https://example.com/blog/article-1
User-Agent: Mozilla/5.0 ...
```

## 3. 隐私风险

Referer 可能泄露敏感信息：

- **搜索关键词**：从搜索结果页跳转时，URL 中的查询参数会暴露给目标站点。
- **会话令牌**：URL 中的 `token`、`session_id` 等参数可能随 Referer 外泄。
- **内部路径**：管理后台路径可能暴露给第三方。

现代浏览器默认采用策略：如果页面与调用的后端接口属于**跨域请求**，浏览器出于隐私保护，跨域时只会发送源（`Origin`）。

## 4. 与 Origin 的区别

**Origin** 与 **Referer** 最根本的区别在于：

- Origin 只包含“协议 + 域名 + 端口”，且专为 CORS 与跨站安全设计。
- Referer 包含详细的“完整 URL 路径与参数”，主要用于来源追踪与上下文记录。

假设用户在 `https://a.com/pages/detail?id=10` 页面发起一个异步请求到 `https://b.com/api/data`：

```http
POST /api/data HTTP/1.1
Host: b.com
Origin: https://a.com
Referer: https://a.com/pages/detail?id=10
```

- **Origin** 告诉服务端：_“这是来自域 `https://a.com` 的跨域请求，请确认是否允许访问。”_
- **Referer** 告诉服务端：_“这个请求是在 `detail?id=10` 这个具体页面上被触发的。”_
