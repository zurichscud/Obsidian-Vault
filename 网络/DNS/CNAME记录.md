## 1. 概述

**CNAME（Canonical Name Record，规范名称记录）** 是 DNS（域名系统）中的一种资源记录类型，用于将一个域名（别名）映射到另一个域名（规范域名）。

通俗来说，它相当于给一个现有的域名起了个“域名别名”，而不是直接指向一个具体的 IP 地址。

## 2. CNAME 的工作原理

假设你拥有域名 `static.example.com`，并接入了 CDN 服务商提供的加速域名 `example.cdn-provider.com`。

### 2.1 DNS 记录配置

对应的 DNS 记录配置如下：

```
static.example.com    CNAME    example.cdn-provider.com
```

### 2.2 解析过程

解析过程如下：

1. 用户在浏览器请求 `static.example.com`。
2. 本地 DNS 查询你的权威域名服务器，得到一条 `CNAME` 记录，指向 `example.cdn-provider.com`。
3. 本地 DNS 随后自动对 `example.cdn-provider.com` 发起第二轮查询（可能解析为具体的 A/AAAA 记录或走 CDN 的 GSLB 智能调度）。
4. 最终解析出目标 IP，返回给客户端建立连接。

## 3. A 记录与 CNAME 记录对比

下表从指向目标、解析开销、灵活性与主要用途四个方面，对比 A 记录与 CNAME 记录：

| **维度** | **A 记录 (Address Record)** | **CNAME 记录 (Canonical Name)** |
| --- | --- | --- |
| **指向的目标** | 直接指向具体的 **IPv4 地址**（如 `1.2.3.4`） | 指向另一个**域名**（如 `cdn.cloudflare.net`） |
| **解析开销** | 仅需 1 次解析即可得到最终 IP | 通常需要递归进行多次查询（先找别名，再解析真实域名的 IP） |
| **灵活性** | 服务器更换 IP 时，必须手动修改 DNS 记录 | 目标域名的 IP 变动时，CNAME 端无需任何修改，完全透明解耦 |
| **主要用途** | 绑定明确的单台服务器或固定公网 IP | 接入 CDN、云存储（如 OSS/S3）、SaaS 服务、多子域名统一部署 |
