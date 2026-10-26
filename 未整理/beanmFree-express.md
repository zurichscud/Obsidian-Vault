## 1. Express 基础

- 1.1 Node.js 与 Express 简介
- 1.2 安装与环境搭建
- 1.3 第一个 Express 应用
- 1.4 项目结构与 conventions

## 2. 路由（Routing）

- 2.1 基本路由（GET/POST/PUT/DELETE）
- 2.2 路由参数（req.params）
- 2.3 查询字符串（req.query）
- 2.4 请求体（req.body）
- 2.5 路由模块化（express.Router）
- 2.6 路由前缀与挂载

## 3. 中间件（Middleware）

- 3.1 中间件概念与执行链
- 3.2 应用级中间件
- 3.3 路由级中间件
- 3.4 错误处理中间件
- 3.5 内置中间件（express.json、express.urlencoded、express.static）
- 3.6 第三方中间件（cors、morgan、helmet、compression）

## 4. 请求与响应

- 4.1 Request 对象常用属性
- 4.2 Response 对象常用方法（res.send、res.json、res.status、res.redirect）
- 4.3 设置响应头与 Cookie
- 4.4 文件下载与流式响应

## 5. 模板引擎（View Engine）

- 5.1 EJS / Pug / Handlebars 配置
- 5.2 模板渲染与布局
- 5.3 静态资源服务

## 6. 数据持久化

- 6.1 MongoDB + Mongoose
- 6.2 MySQL + Sequelize / Prisma
- 6.3 Redis 缓存
- 6.4 数据库连接池与事务

## 7. 认证与授权

- 7.1 Session 与 Cookie
- 7.2 JWT 认证
- 7.3 Passport.js
- 7.4 RBAC 权限控制

## 8. API 设计

- 8.1 RESTful API 规范
- 8.2 API 版本控制
- 8.3 分页、过滤、排序
- 8.4 统一响应格式与错误码

## 9. 文件上传与处理

- 9.1 Multer 文件上传
- 9.2 文件类型与大小校验
- 9.3 图片处理（sharp）
- 9.4 云存储（OSS/S3）

## 10. 安全与防护

- 10.1 XSS / CSRF 防护
- 10.2 速率限制（express-rate-limit）
- 10.3 输入校验（express-validator / Joi / Zod）
- 10.4 Helmet 安全头
- 10.5 环境变量与密钥管理

## 11. 性能与优化

- 11.1 缓存策略
- 11.2 压缩与 Gzip
- 11.3 集群与多进程（cluster）
- 11.4 日志与监控

## 12. 测试

- 12.1 单元测试（Jest / Mocha）
- 12.2 集成测试（Supertest）
- 12.3 Mock 与测试覆盖率

## 13. 部署与运维

- 13.1 PM2 进程管理
- 13.2 Docker 容器化
- 13.3 Nginx 反向代理
- 13.4 CI/CD 流水线
- 13.5 日志收集与 APM

## 14. 进阶主题

- 14.1 WebSocket（Socket.IO）
- 14.2 GraphQL（Apollo Server）
- 14.3 微服务与消息队列
- 14.4 TypeScript + Express