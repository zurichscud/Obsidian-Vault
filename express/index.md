```
express/
├── document/                  # 字典，讲是什么，查API用
│   ├── 01-overview.md         # Express是什么，v4 vs v5差异，核心概念
│   ├── 02-app.md              # app创建，app.set/use/listen，应用结构
│   ├── 03-routing.md          # 路由方法，Router，路由参数与匹配规则
│   ├── 04-request.md          # req.params/query/body/headers/cookies
│   ├── 05-response.md         # res.json/send/status/redirect/download
│   ├── 06-middleware.md       # 中间件机制，next()，分类，执行顺序
│   ├── 07-builtin-middleware.md # json/urlencoded/static，第三方一览
│   ├── 08-error-handling.md   # 错误中间件，404，async错误
│   ├── 09-security.md         # helmet/cors/rate-limit/最佳实践
│   └── 10-deploy.md           # env/PM2/Docker/Nginx，性能要点
│
└── guide/                     # 教程，讲怎么做，一步步跟做
    ├── 01-quickstart/         # Hello World + 健康检查
    │   └── README.md
    ├── 02-restful-crud/       # users CRUD，状态码规范
    │   └── README.md
    ├── 03-query-pagination/  # 分页+条件查询+中间件解析body
    │   └── README.md
    ├── 04-custom-middleware/  # 手写logger/auth/validate
    │   └── README.md
    ├── 05-upload-static/      # multer上传 + static访问
    │   └── README.md
    ├── 06-db-integration/    # 接Mongoose/Prisma，真库CRUD
    │   └── README.md
    ├── 07-auth-jwt/           # 注册/登录/bcrypt/requireAuth
    │   └── README.md
    ├── 08-validate-log/       # zod校验 + winston + 统一Result
    │   └── README.md
    ├── 09-test/               # jest + supertest
    │   └── README.md
    └── 10-final-project/      # 博客/短链接，分层Controller-Service-Model
        └── README.md
```