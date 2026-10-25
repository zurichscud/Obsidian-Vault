## 1. 概述

**CDN（Content Delivery Network，内容分发网络）** 是由分布在不同地理位置的服务器组成的网络，其核心目的在于**让用户就近获取内容，降低网络延迟，并减轻源站服务器的压力**。

## 2. 核心概念

### 2.1 源站（Origin）

源站是真正存放网站内容、提供原始数据的服务器或服务。

### 2.2 CDN 节点（Edge Node）

CDN 节点是分布在不同地区、负责接收用户请求和分发内容的服务器。

### 2.3 回源（Origin Fetch）

当 CDN 节点无法直接提供所请求的内容时，可能需要向源站请求数据，这一过程称为回源。

## 3. 核心工作原理

CDN 的底层逻辑可以概括为两点：**智能解析与调度**、**边缘缓存与回源**。

### 3.1 智能 DNS 调度（Anycast / GSLB）

用户发起请求时，DNS 解析流程与常规访问有所不同：

1. 用户在浏览器输入配置了 CDN 的域名（如 `static.example.com`）。
2. 本地 DNS（Local DNS）向权威 DNS 查询，源站的 DNS 记录通常会以 **CNAME** 指向 CDN 厂商提供的专属域名。
3. 请求被导向 CDN 的**智能调度系统（GSLB）**。
4. 调度系统根据用户的 IP 地址、运营商类型、节点负载等因素，返回离用户物理距离最近、且网络状态最优的**边缘节点 IP**。

### 3.2 边缘缓存与回源

用户拿到 IP 后，向边缘节点发送 HTTP 请求：

- **命中（Cache Hit）**：节点本地已缓存该资源且未过期，直接将内容返回给用户，响应时间通常在十几毫秒以内。
- **未命中 / 穿透（Cache Miss）**：节点本地没有该内容或已过期，边缘节点会向上层聚合节点或直接向源站（Origin Server）发起请求，拉取资源后缓存到节点，再响应给用户。

## 4. 缓存策略与动态加速

CDN 针对静态内容与动态内容采用不同的加速策略。

### 4.1 静态加速

针对 JS、CSS、图片、音视频等不易变动的静态资源，通过 HTTP 响应头精确控制缓存行为：

- 【强缓存】**`Cache-Control: public, max-age=31536000, immutable`**：配合前端打包的哈希文件名（如 `app.8f3d12.js`），实现永久缓存，更新时仅变更文件名。
- 【协商缓存】**`ETag` 与 `Last-Modified`**：用于条件请求（`304 Not Modified`），在资源过期后进行校验，减少无谓的流量传输。
- **主动刷新与预热**：发布新版本时，通过 API 触发节点缓存清理（Purge）；对于大流量活动，可提前将静态包推送到边缘节点（Warm-up）。

### 4.2 动态加速

针对 API 接口、实时交易等无法缓存的数据，CDN 通过以下技术提升传输速度：

- **链路优化**：CDN 各数据中心之间通常使用私有专线或优化的 BGP 路由，绕过拥堵的公网主干道。
- **协议优化**：全链路启用 HTTP/2、HTTP/3 (QUIC)，减少 TCP 三次握手和 TLS 握手开销；边缘节点与源站之间建立**长连接池**，避免频繁建立连接。

## 5. 应用场景

### 5.1 网站和静态资源使用同一个域名

以同一个域名访问网站和静态资源时，地址示例如下：

```
https://www.example.com/
https://www.example.com/logo.png
https://www.example.com/_next/static/...
```

你可以在域名层面配置 CDN，让相关请求经过 CDN。

对应的架构如下：

```
浏览器
  |
  v
www.example.com
  |
  v
CDN
  |
  v
Next.js 源站
```

### 5.2 把静态资源放到独立的 CDN 域名

网站与静态资源分别使用独立域名时，地址示例如下：

```
网站：
https://www.example.com

静态资源：
https://static.example.com
```

此时 HTML 中对图片的引用可能变成：

```
<img
  src="https://static.example.com/images/banner.jpg"
  alt="Banner"
/>
```

浏览器访问 HTML 时，走网站的域名；访问图片时，走静态资源域名。

这样可以分别管理网站请求和静态资源请求。

## 6. OSS + CDN

**CDN + OSS 是现代 Web 与移动端应用中最标准、最经济的静态资源与多媒体分发架构。OSS 负责海量文件的**持久化存储与管理**，CDN 负责边缘节点的**就近分发、加速与节省流量**。

直接让客户端访问 OSS 会面临三个致命问题：
- **访问延迟高**
- **公网流出带宽费用昂贵**
- **缺乏安全防护**。


假设你已经把图片上传到了 OSS，得到的地址如下：

```
https://my-bucket.oss-cn-hangzhou.aliyuncs.com/images/logo.png
```

这个地址直接指向 OSS。你希望通过 CDN 访问同一张图片。

### 6.1 第一步：配置 CDN

首先在 CDN 控制台添加加速域名：

```
static.example.com
```

然后将源站配置为你的 OSS Bucket。

配置完成后的访问关系大致如下：

```
static.example.com
        |
        v
      CDN
        |
        v
my-bucket.oss-cn-hangzhou.aliyuncs.com
```

> [!warning] 注意
> 你还需要根据服务商的要求配置 CNAME、HTTPS 证书和 OSS 访问权限。
>
> 设置 CNAME 只是让自己的域名转发到 CDN；要让 CDN 网络认这个域名，还需要在控制台添加加速域名。

完成上述配置后，CDN 就知道：用户请求 `static.example.com` 下的资源时，应该如何从 OSS 获取文件。

### 6.2 第二步：替换资源 URL

原来的 OSS 地址如下：

```
https://my-bucket.oss-cn-hangzhou.aliyuncs.com/images/logo.png
```

需要替换成 CDN 地址：

```
https://static.example.com/images/logo.png
```

注意路径保持一致：

| 项目 | 地址 |
| --- | --- |
| OSS 源站 | `my-bucket.oss-cn-hangzhou.aliyuncs.com` |
| CDN 域名 | `static.example.com` |
| OSS 对象 Key | `/images/logo.png` |
| CDN 访问路径 | `/images/logo.png` |

替换后，请求流程如下：

- 用户请求 CDN 域名（如 `https://static.example.com/images/avatar.jpg`）。
- **命中边缘缓存**：CDN 边缘节点直接将图片返回给用户。
- **未命中（回源）**：CDN 边缘节点向 OSS 节点发起回源请求，拉取文件，写入本地缓存，再响应给客户端。
