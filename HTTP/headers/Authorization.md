---
title: Authorization
---

## 1. 为什么不直接传 Token，一定要加 `Bearer ` 前缀？

这主要是为了**协议的扩展性**。`Authorization` 请求头是一个通用的身份验证字段，除了 `Bearer` 之外，它还可以支持很多其他类型的认证方案（Authentication Schemes）。

服务器需要通过前缀来判断**接下来该用什么逻辑来解析**后面的字符串。

| **方案 (Scheme)** | **示例** | **含义/用途** |
| ----------------- | -------------------------------------- | ------------------------------------------------------------ |
| **`Bearer`** | `Authorization: Bearer eyJhbGci...` | 持票人机制，后面通常跟的是 **JWT (JSON Web Token)** 或 OAuth2 的 Access Token。 |
| **`Basic`** | `Authorization: Basic dXNlcjpwYXNz` | 基础认证，后面跟着的是 `用户名:密码` 经过 Base64 编码后的字符串。 |
| **`Digest`** | `Authorization: Digest username="..."` | 摘要认证，比 Basic 安全，会包含哈希值和随机数。 |
| **`APIKey`** | `Authorization: APIKey 12345` | 自定义的一些 API 密钥认证。 |

## 2. Bearer Token

**Bearer** 从字面意思上理解是“持票人”或“携带者”。

在 OAuth 2.0 规范中，对 Bearer Token 的定义是：

> 任何拿到该字符串（Token）的请求者，都可以直接使用它来访问受保护的资源，而无需证明自己拥有加密密钥（不像某些需要私钥签名的复杂协议）。

因此，它的核心特点是**简单、直接**。但也正因为“认票不认人”，Bearer Token **必须通过 HTTPS 进行加密传输**，否则一旦在网络中被窃听拦截，任何人都可以冒充你。
