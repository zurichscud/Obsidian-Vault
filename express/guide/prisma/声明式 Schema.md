**声明式 Schema** 是 Prisma 的核心设计理念。与传统 ORM 使用“命令式”代码定义模型（如 `class User extends Model`）不同，Prisma 让你用**一种专门的 DSL——Prisma Schema Language（PSL）**，以纯声明式的方式描述“数据世界”，剩下的交给工具链自动推导和生成。

> 你只需说“**我有什么数据**”，Prisma 负责“**怎么实现它**”。

## 1. Schema 文件的三要素

一个完整的 `schema.prisma` 通常包含三个部分：

```prisma
// ① 数据源（Datasource）—— 告诉 Prisma 用什么数据库
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ② 生成器（Generator）—— 告诉 Prisma 生成什么
generator client {
  provider = "prisma-client-js"
}

// ③ 数据模型（Data Model）—— 定义你的业务结构
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
  posts Post[]
}

model Post {
  id        Int     @id @default(autoincrement())
  title     String
  content   String?
  published Boolean @default(false)
  author    User    @relation(fields: [authorId], references: [id])
  authorId  Int
}
```

### 1.1 Datasource 块

- `provider`：指定数据库类型（`postgresql` / `mysql` / `sqlite` / `sqlserver` / `mongodb` 等）。
- `url`：数据库连接地址（通常通过 `env()` 引用环境变量，避免硬编码敏感信息）。

### 1.2 Generator 块

- `provider`：指定生成器类型，最常用的是 `prisma-client-js`（v7+ 改为 `prisma-client`）。
- `output`：可选，指定生成代码的输出目录。

### 1.3 Model 块

- 每个 `model` 对应数据库中的一张**表**。
- 每个字段包含：**字段名 + 类型 + 修饰符/属性**。
- 字段类型：标量类型（`String`、`Int`、`Boolean`、`DateTime`、`Float`、`Json`、`Bytes` 等）、关系字段（`Post[]`、`User?`）。
- 常用属性：
  - `@id`：主键。
  - `@unique`：唯一约束。
  - `@default(value)`：默认值（`autoincrement()` / `now()` / `false` / 自定义值）。
  - `@updatedAt`：自动更新时间。
  - `@relation(...)`：定义关系。
  - `@map("table_name")` / `@@map("table_name")`：映射到实际表名。

## 2. 关系声明式写法

### 基本语法

`@relation` 的通用写法如下：

```text
@relation(关系名?, fields: [外键字段], references: [目标字段], 其他配置?)
```

当你运行 `npx prisma generate` 之后，Prisma 会在 `@prisma/client` 中生成 TypeScript 类型定义：

```ts
// Prisma 生成的代码提示结构
type User = {
  id: number;
  posts?: Post[]; // 作为可选属性存在于 TS 类型中，posts不是User表中的字段
}
```

默认查询只读数据库原表字段，不会返回 `posts`：

```js
// 1. 默认查询：结果里没有 posts
const user = await prisma.user.findUnique({ where: { id: 1 } });
// 输出：{ id: 1 }

// 2. 带 include 查询：Prisma 在底层帮你 JOIN 了 Post 表，返回对象里才看得到 posts
const userWithPosts = await prisma.user.findUnique({
  where: { id: 1 },
  include: { posts: true }
});
// 输出：
// {
//   id: 1,
//   posts: [
//     { id: 101, title: '文章1', authorId: 1 },
//     { id: 102, title: '文章2', authorId: 1 }
//   ]
// }
```

- **数据库表视角**：`posts` 是虚拟的，不存在这一列。
- **Prisma 视角**：`posts` 是一个“语法开关”和导航属性，用来告诉 Prisma 引擎：“在查 User 时，如果用户写了 `include: { posts: true }`，请去 `Post` 表按外键把关联文章查出来拼给我”。

### 2.1 一对一

一对一关系示例如下：

```prisma
model User {
  id      Int      @id @default(autoincrement())
  profile Profile?
}

model Profile {
  id     Int     @id @default(autoincrement())
  bio    String?
  user   User    @relation(fields: [userId], references: [id])
  userId Int     @unique // 唯一约束
}
```


### 2.2 一对多

一个用户可以有多篇文章：

```prisma
model User {
  id    Int    @id @default(autoincrement())
  posts Post[]   // 一个用户有多个文章
}

model Post {
  id       Int  @id @default(autoincrement())
  author   User @relation(fields: [authorId], references: [id])
  authorId Int
}
```

用户表与文章表的数据示例如下：

| **id** | **name** | **email** |
| --- | --- | --- |
| **1** | Alice | alice@example.com |
| **2** | Bob | bob@example.com |
| **3** | Charlie | charlie@example.com |

| **id** | **title** | **content** | **authorId（外键）** |
| --- | --- | --- | --- |
| **101** | Prisma 基础入门 | 介绍 Schema 定义... | **1**（Alice） |
| **102** | 深入理解关系字段 | 虚拟字段与外键的区别... | **1**（Alice） |
| **103** | Node.js 最佳实践 | 关于性能与架构... | **2**（Bob） |
| **104** | TypeScript 高级技巧 | 类型推导与泛型... | **1**（Alice） |

### 2.3 多对多

Prisma 支持**隐式关联**，无需手动创建中间表：

```prisma
model Post {
  id    Int    @id @default(autoincrement())
  tags  Tag[]
}

model Tag {
  id    Int    @id @default(autoincrement())
  posts Post[]
}
```

如需在中间表存额外字段，则需**显式关联**：

```prisma
model Post {
  id       Int        @id @default(autoincrement())
  taggings PostTag[]
}

model Tag {
  id       Int        @id @default(autoincrement())
  postTags PostTag[]
}

model PostTag {
  post   Post @relation(fields: [postId], references: [id])
  postId Int
  tag    Tag  @relation(fields: [tagId], references: [id])
  tagId  Int
  note   String?    // 额外字段

  @@id([postId, tagId])
}
```


## 3. 多文件 Schema（v6.7+）

从 v6.7 起，Prisma 支持将 Schema 拆分为多个 `.prisma` 文件，便于大型项目维护：

```text
prisma/
├── migrations/
├── models/
│   ├── users.prisma
│   ├── posts.prisma
│   └── tags.prisma
└── schema.prisma    # 必须包含 generator 块（主文件）
```

`schema.prisma` 仍作为**唯一主文件**，`migrations` 目录必须与它同级。可通过 `prisma.config.ts` 或 `--schema` 参数指定目录。

## 4. v7 的变化：prisma.config.ts

**Prisma ORM v7+** 将数据库连接配置从 `schema.prisma` 移到了 **`prisma.config.ts`** 文件中：

```ts
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),  // 不再写在 schema.prisma 里
  },
})
```

**注意**：Prisma ORM 不会自动加载 `.env` 文件，需要显式引入 `dotenv/config`。