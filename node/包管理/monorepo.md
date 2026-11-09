## 1. 概念

**Monorepo（单体代码仓库，Monolithic Repository）** 是一种软件工程架构模式：将多个独立项目或子模块的代码存放在同一个版本控制仓库（如单个 Git Repo）中统一管理。与之相对的是传统的 **Multi-repo / Polyrepo（多仓库模式）**。

## 2. 典型的工程目录结构

典型目录结构如下，`apps` 存放各端应用，`packages` 存放共享包，根目录放置工作区与流水线配置：

```text
my-monorepo/
├── apps/
│   ├── web/                # 用户端应用（Vue 3 + Vite）
│   │   └── package.json
│   └── admin/              # 后台管理系统（Vue 3 + Vite）
│       └── package.json
├── packages/
│   ├── ui/                 # 团队公共组件库
│   │   └── package.json
│   ├── utils/              # 通用工具函数
│   │   └── package.json
│   └── tsconfig/           # 统一的 TypeScript 配置
├── pnpm-workspace.yaml     # 定义工作区
├── turbo.json              # 任务流水线与缓存规则
└── package.json            # 根配置与统一开发脚本
```

在 `packages/ui` 中声明包名后，`apps/web` 的 `package.json` 即可直接声明依赖，通过 `workspace:*` 指向本地工作区包：

```json
{
  "dependencies": {
    "@my-org/ui": "workspace:*"
  }
}
```

本地修改 `@my-org/ui` 时，前端 Vite 热更新会直接生效，无需手动编译发布。

## 3. 包含后端时的两种模式

在包含后端的场景下，Monorepo 的架构主要取决于**技术栈是否同构**，常见有两种模式：

1. **多语言混合 Monorepo（Polyglot Monorepo）：** 例如前端是 `Vue 3 / TypeScript`，后端是 `Java (Spring Boot / Maven 或 Gradle)`。
2. **同构语言 Monorepo（Full-stack TypeScript）：** 前端与后端均采用 Node.js（如 `Express` / `NestJS` / `Next.js`）。

## 4. 方案 A：多语言混合架构

以 Vue 3 + Java Spring Boot 为例，这是企业级业务中最常见的组合。Java 生态依赖 Maven/Gradle，前端依赖 pnpm，**两者的依赖机制无法完全合并**，通常采用“**统一仓库、分域构建、契约共享**”的方式组织。

### 4.1 目录结构

方案 A 的目录结构如下，`apps` 下同时放置 Vue 应用与 Spring Boot 服务，`packages` 存放前端共享包，`contracts` 存放前后端共用的契约文件：

```text
my-project-monorepo/
├── apps/
│   ├── web-client/            # Vue 3 用户端
│   │   └── package.json
│   ├── admin-portal/          # Vue 3 管理后台
│   │   └── package.json
│   └── api-server/            # Java Spring Boot 服务
│       ├── pom.xml (或 build.gradle)
│       └── src/
├── packages/
│   ├── api-client/            # 前端通用的 API SDK（由后端契约自动生成）
│   ├── ts-configs/            # 前端公共 TS 配置
│   └── ui-components/         # 前端公共组件库
├── contracts/                 # 核心连接点：OpenAPI / Swagger 契约文件
│   └── openapi.json (或 swagger.yaml)
├── pnpm-workspace.yaml        # 管理前端所有 workspace
├── pom.xml (可选，根聚合工程) # 统一管理 Java 子模块
└── turbo.json                 # 编排前端构建流水线
```

### 4.2 收益：消除前后端接口不一致

这种架构下，Monorepo 最大的收益是**消除前后端接口不一致**，实现路径分为三步：

1. **后端定义接口：** Spring Boot 项目通过注解生成 OpenAPI/Swagger 规范（或直接采用 Code-First 暴露 JSON 规范）。
2. **自动化生成前端 SDK/类型：**
   - 在根目录利用脚本（如 `openapi-typescript` 或 `openapi-generator-cli`）读取生成的 OpenAPI 规范。
   - 直接将 TS 类型和请求方法输出到 `packages/api-client`。
3. **前端消费：**
   - `web-client` 和 `admin-portal` 在 `package.json` 中声明 `"@proj/api-client": "workspace:*"`。
   - 后端一旦重构字段，一键生成命令，前端代码会在编译期直接报错，无需等到运行时联调。

## 5. 方案 B：全栈 TypeScript 架构

如 Vue 3 + Express / NestJS

如果后端也是基于 Node.js 技术栈，Monorepo 的威力会完全释放，因为**前后端共享统一的包管理工具（pnpm）与运行时类型验证**。

### 5.1 目录结构

方案 B 的目录结构如下，前端与后端分别位于 `apps/web` 与 `apps/server`，前后端公用的数据验证与类型定义集中在 `packages/schema`：

```text
my-ts-monorepo/
├── apps/
│   ├── web/                   # Vue 3 前端
│   └── server/                # Express / Node 后端
├── packages/
│   ├── schema/                # 【核心】前后端公用的数据验证与类型定义（如 Zod）
│   ├── utils/                 # 通用函数（日期格式化、加解密等）
│   └── ts-config/             # 共享的 tsconfig.base.json
├── pnpm-workspace.yaml
└── turbo.json
```

### 5.2 最大收益

通过在 `packages/schema` 中使用类似 **Zod** 的工具，定义一套规则，前后端同时复用。下面的 Schema 同时给出运行时验证规则与静态 TypeScript 类型推导：

```ts
// packages/schema/src/user.ts
import { z } from 'zod';

// 1. 运行时验证规则（Schema）
export const CreateUserSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  password: z.string().min(6),
});

// 2. 静态 TypeScript 类型推导
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
```

#### 后端（Express）消费

后端引入该 Schema，对请求体做运行时校验，校验通过后 `parseResult.data` 具有完整的 TS 类型安全：

```ts
import { CreateUserSchema } from '@my-proj/schema';

app.post('/api/users', (req, res) => {
  const parseResult = CreateUserSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ errors: parseResult.error.issues });
  }
  // parseResult.data 此时具有完整的 TS 类型安全
});
```

#### 前端（Vue 3 表单校验）消费

前端复用同一份 Schema 做表单校验，无需重复编写正则表达式或校验规则：

```ts
import { CreateUserSchema, type CreateUserInput } from '@my-proj/schema';

// 直接用于表单前端校验，无需重复编写正则表达式或校验规则
```

## 6. 工作区管理

### 6.1 pnpm-workspace.yaml 的作用

`pnpm-workspace.yaml` 是使用 **pnpm** 管理 Monorepo时的**核心配置文件**。

只要在仓库根目录下放置该文件，pnpm 就会将当前项目识别为一个 Workspace 架构，并自动处理各子包之间的符号链接（Symlink）、本地依赖解析和批量指令执行。

下面的配置声明 `apps` 与 `packages` 目录下的所有直接子项目，并排除测试目录：

```yaml
packages:
  # 包含 apps 目录下的所有直接子项目（如 web, admin）
  - 'apps/*'
  # 包含 packages 目录下的所有直接子项目（如 ui, utils, types）
  - 'packages/*'
  # 排除某些不希望作为包解析的目录（支持 ! 排除语法）
  - '!**/test/**'
```

### 6.2 子包之间如何互相引用

工作区内各子包相互依赖时，使用 `workspace:` 协议，避免从远程 npm 镜像下载。

假设有以下两个包：公共库 `packages/utils/package.json` 与业务应用 `apps/web/package.json`。公共库声明包名与版本：

```json
{
  "name": "@my-org/utils",
  "version": "1.0.0"
}
```

业务应用在依赖中通过 `workspace:*` 引用该公共库：

```json
{
  "name": "web-app",
  "dependencies": {
    "@my-org/utils": "workspace:*"
  }
}
```

### 6.3 内部包命名规范

在 Monorepo 中，强烈建议为内部包使用带 `@` 作用域的命名规则：

| 推荐格式                          | 示例                                                |
| ----------------------------- | ------------------------------------------------- |
| `@<org-or-project>/<package>` | `@my-app/ui`、`@my-app/types`、`@my-app/api-client` |
1. **避免重名冲突**：防止无意中与 npm 官方公开库（如 `utils`、`ui`）同名引发误解。
2. **语义清晰**：在业务代码里 `import { Button } from '@my-app/ui'` 一眼就能看出是公司内部公共包。