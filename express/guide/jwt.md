---
title: JWT
---

JWT（JSON Web Token）是一种开放的标准，用于在网络应用之间传递信息。它是一种基于 JSON 的安全令牌，用于在客户端和服务器之间传输信息。参考：[jwt.io](https://jwt.io/)

## 1. Session 缺陷

session 存在如下缺陷：

- 如果用户规模过大，服务器需要存储的 session 数据量将会变得庞大。
- 如果存在多个服务器，session 无法共享。

## 2. JWT 组成

JWT 由三部分组成，各部分通过点（.）分隔：

```js
Header.Payload.Signature
```

- Header（头部）：包含了令牌的类型和使用的加密算法等信息，通常采用 Base64 编码表示。
- Payload（负载）：包含了身份验证和授权等信息，如用户 ID、角色、权限等，也可以自定义其他相关信息，同样采用 Base64 编码表示。
- Signature（签名）：使用指定的密钥对头部和负载进行签名，以确保令牌的完整性和真实性。

## 3. JWT 工作流程

1. 用户通过提供有效的凭证（例如用户名和密码）进行身份验证。
2. 服务器验证凭证，并生成一个 JWT 作为响应。JWT 包含了用户的身份信息和其他必要的数据。
3. 服务器将 JWT 发送给客户端。
4. 客户端在后续的请求中，将 JWT 放入请求的头部或其他适当的位置。
5. 服务器在接收到请求时，验证 JWT 的签名以确保其完整性和真实性。如果验证通过，服务器使用 JWT 中的信息进行授权和身份验证。

## 4. 实现

### 4.1 JWT 类

JWT 类的实现如下：

```ts
import { injectable } from 'inversify'
import jsonwebtoken from 'jsonwebtoken'
import passport from 'passport'
import { Strategy, ExtractJwt } from 'passport-jwt'

@injectable()
export class JWT {
  private secret = 'xiaoman$%^&*()asdsd'
  private jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: this.secret
  }

  constructor() {
    this.strategy()
  }

  /**
   * 初始化jwt
   */
  public strategy() {
    const strategy = new Strategy(this.jwtOptions, (payload, done) => {
      done(null, payload)//// payload 会被存储到 req.user 中
    })
    passport.use(strategy)
  }

  /**
   *
   * @returns 中间件
   */
  public middleware() {
    return passport.authenticate('jwt', { session: false })
  }

  /**
   * 创建token
   * @param data Object
   */
  public createToken(data: object) {
    //有效期为7天
    return jsonwebtoken.sign(data, this.secret, { expiresIn: '7d' })
  }

  /**
   *
   * @returns 用于在express中注册中间件
   */
  public init() {
    return passport.initialize()
  }
}
```

### 4.2 在 Express 中使用

在 Express 中注册中间件并保护路由：

```ts
import express from 'express';
import { JWT } from './JWT'; // 假设你的 JWT 类在 JWT.ts 文件中

const app = express();
const jwtService = new JWT(); // 创建 JWT 实例

// 保护路由，只有有效的 JWT 才能访问
app.get('/protected', jwtService.middleware(), (req, res) => {
  res.json({
    message: 'This is a protected route',
    user: req.user // req.user 中会包含解码后的 JWT payload
  });
});

// 启动 Express 服务器
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

### 4.3 express JWT 设计哲学

> [!tip]
> 在 **Express** 中，为什么需要将 JWT 认证放到每个路由，而不直接在全局集中处理，主要是因为 **Express** 是一个轻量级的框架，它本身并没有强制要求使用全局的身份认证机制。Express 提供了非常灵活的中间件系统，你可以根据实际需求选择是否在全局或局部（单独路由）应用身份验证。

## 5. 为什么将 Token 放在请求头

如果用户已经登录并且 JWT 存在 Cookie 中，一个恶意网站可以通过 **`<img>`** 或 **`<form>`** 等方式，向你的应用发起一个伪造的请求。浏览器会自动携带 Cookie，从而未经授权执行某些敏感操作。

如果将 JWT 存储在**请求头**中，浏览器不会自动附加它，而是需要显式地将其添加到请求中。这样，攻击者就无法在跨站请求中通过自动携带 Cookie 来利用 JWT。

- 简化**防止 CSRF**：虽然 `SameSite` 属性能有效防止 CSRF，但将 **JWT** 存放在**请求头**中避免了自动附加 Cookie 的问题，并且不需要设置 SameSite，使用起来更简单。
- **跨域和跨平台支持**：
  - **原生 App（React Native/Flutter）**：没有浏览器的 Cookie 管理机制。
  - **微信小程序**：不支持标准的 Cookie。
- **灵活控制和透明性**：开发者可以精确控制 JWT 的传递与生命周期，而不依赖于浏览器的 Cookie 管理。
