## 1. 概述

`Cache-Control` 是 HTTP/1.1 引入的核心通用标头（常用作响应头），用于控制浏览器及中间代理（如 CDN、反向代理网关）的缓存行为。

## 2. 核心指令速查表

| 指令类别     | 指令                          | 说明                                                                                | 适用场景                              |
| :----------- | :---------------------------- | :---------------------------------------------------------------------------------- | :------------------------------------ |
| **缓存位置** | `public`                      | 任何节点（浏览器、CDN、代理服务器）均可缓存该响应                                   | 公共公开资源、静态文件                |
|              | `private`                     | **仅最终客户端（浏览器）**可以缓存，中间代理/CDN 严禁缓存                           | 用户个人数据、含私密信息的页面        |
| **缓存策略** | `no-cache`                    | **可以缓存**，但每次使用前**必须向源服务器发起协商验证**（配合 ETag/Last-Modified） | `index.html`、实时性要求高的配置      |
|              | `no-store`                    | **彻底禁止缓存**，客户端与代理均不存储任何副本，每次完整重新请求                    | 登录凭证、支付信息、敏感 API          |
| **有效期**   | `max-age=<秒>`                | 资源在客户端被视为新鲜（Fresh）的最大生存时间（秒）                                 | 绝大多数需要强缓存的资源              |
|              | `s-maxage=<秒>`               | 仅对**共享缓存（CDN/代理）**生效的生存时间，覆盖 `max-age`                          | CDN 分层缓存加速                      |
| **重新验证** | `must-revalidate`             | 一旦缓存过期，**必须向源站验证**，网络不可达时严禁返回陈旧缓存                      | 严谨数据接口                          |
|              | `proxy-revalidate`            | 类似 `must-revalidate`，但仅对共享代理/CDN 生效                                     | 代理层一致性控制                      |
|              | `immutable`                   | 告知浏览器在 `max-age` 内**内容永不变更**，用户按 F5 刷新也不发送条件请求           | 带 Hash 的静态构建产物（JS/CSS/图片） |
| **高级体验** | `stale-while-revalidate=<秒>` | 缓存过期后的指定窗口内，允许先直接使用旧缓存响应，并在后台异步请求源站更新          | 追求极致响应体验的只读列表/首页数据   |
|              | `stale-if-error=<秒>`         | 缓存过期后若源站故障（500/502/超时等），允许继续返回旧缓存兜底                      | 高可用兜底保障                        |

## 3. 常见场景配置方案

### 3.1 带 Hash 指纹的前端静态资源（JS / CSS / 图片 / 字体）

**策略**：永久强缓存。

打包生成的 JS/CSS 文件名包含内容哈希（例如 `app.a8f9c2.js`）。如果代码更新，文件名必定改变，浏览器请求的将是一个新 URL。

对应的响应头配置如下：

```http
Cache-Control: public, max-age=31536000, immutable
```

### 3.2 单页应用（SPA）入口文件 `index.html`

**策略**：始终走协商缓存，确保前端发布新版本后，用户刷新即可获取最新 HTML，并加载最新的 JS/CSS 文件。

入口文件对应的响应头配置如下：

```http
Cache-Control: no-cache
```

_同时确保服务端配合输出 `ETag` 或 `Last-Modified`。_

### 3.3 用户敏感数据 API（个人中心、订单、支付、认证接口）

**策略**：完全禁止缓存，防止数据泄露或串号。

对应的响应头配置如下：

```http
Cache-Control: no-store
```

### 3.4 读多写少的公共业务 API（商品详情、文章内容、活动页面）

**策略**：允许短时间本地强缓存，配合异步刷新提高加载速度。

对应的响应头配置如下：

```http
Cache-Control: public, max-age=60, stale-while-revalidate=300
```

- 用户在 1 分钟内访问时，可瞬间得到结果。
- 在 1~6 分钟内访问时，先秒开旧数据，后台静默拉取新数据。

## 4. 常见服务端配置示例

### 4.1 Nginx 配置

以下配置分别针对 HTML 入口文件、带 Hash 的静态资源与动态 API：

```nginx
server {
    # 1. HTML 入口文件：禁止强缓存，强制协商验证
    location ~* \.html$ {
        add_header Cache-Control "no-cache";
        expires -1;
    }

    # 2. 带 Hash 的打包静态资源：永久强缓存
    location /assets/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # 3. 动态 API 反向代理：禁用缓存
    location /api/ {
        proxy_pass http://backend_upstream;
        add_header Cache-Control "no-store";
    }
}
```

### 4.2 Express / Node.js

以下示例分别演示敏感路由与静态文件托管的缓存配置：

```javascript
// 针对特定敏感路由
app.get("/api/user/profile", (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json({ name: "Alice" });
});

// 针对静态文件托管
app.use(
  "/static",
  express.static("public", {
    maxAge: "1y",
    immutable: true,
  }),
);
```

### 4.3 Spring Boot (Java)

以下示例分别演示通过 `ResponseEntity` 与拦截器/过滤器设置缓存头：

```java
// 方式一：ResponseEntity
@GetMapping("/api/config")
public ResponseEntity<ConfigVO> getConfig() {
    return ResponseEntity.ok()
            .cacheControl(CacheControl.maxAge(60, TimeUnit.SECONDS).cachePublic())
            .body(configService.getGlobalConfig());
}

// 方式二：拦截器/过滤器设置
response.setHeader("Cache-Control", "no-store");
```
