## 1. Sequelize 简介

**Sequelize** 是 Node.js 生态中最老牌且广泛使用的基于 Promise 的 ORM 库。

## 2. 核心特性

- **多数据库支持**：支持 PostgreSQL、MySQL、MariaDB、SQLite、Microsoft SQL Server、Oracle 等。
- **Promise 机制**：全面支持 `async/await`，调用异步数据库操作非常直观。
- **事务管理**：内置支持全自动和手动事务处理。
- **生命周期钩子（Hooks）**：提供类似拦截器/监听器的机制（如 `beforeCreate`、`afterUpdate` 等）。
- **迁移机制（Migrations）与种子数据（Seeders）**：通过配套的 `sequelize-cli` 工具，可轻松进行数据库版本控制与结构迁移。
- **关联关系（Associations）**：提供 `hasOne`、`belongsTo`、`hasMany`、`belongsToMany` 等完整的实体关系映射支持。

## 3. 快速上手与使用示例

以 MySQL 为例，需要安装核心包和对应的数据库驱动：

```bash
npm install sequelize mysql2
```

### 3.1 初始化数据库连接

使用 `Sequelize` 构造函数配置连接池与数据库连接参数：

```js
const { Sequelize, DataTypes } = require('sequelize');

// 配置连接池与数据库连接参数
const sequelize = new Sequelize('my_database', 'root', 'password', {
  host: 'localhost',
  dialect: 'mysql',
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  logging: console.log, // 打印执行的底层 SQL，排查问题非常有用
});
```

### 3.2 定义模型（Model）

模型相当于数据库表的抽象定义：

```js
const User = sequelize.define('User', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING(100),
    validate: {
      isEmail: true, // 内置字段校验
    },
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
  },
}, {
  tableName: 'users',      // 指定映射的表名
  timestamps: true,        // 自动管理 createdAt 与 updatedAt 字段
});
```

### 3.3 常见 CRUD 操作

以下代码演示模型同步与常见的增删改查操作：

```js
async function testCRUD() {
  // 1. 同步模型到数据库（开发阶段可用，生产环境建议用 Migrations）
  await sequelize.sync();

  // 2. Create（新增）
  const newUser = await User.create({
    username: 'alice',
    email: 'alice@example.com',
  });

  // 3. Read（查询）
  // 按主键查
  const user = await User.findByPk(newUser.id);

  // 条件查询
  const activeUsers = await User.findAll({
    where: { status: 1 },
    attributes: ['id', 'username'], // 仅投影特定字段
    limit: 10,
    order: [['id', 'DESC']],
  });

  // 4. Update（更新）
  await User.update(
    { status: 0 },
    { where: { username: 'alice' } }
  );

  // 5. Delete（删除）
  await User.destroy({
    where: { username: 'alice' }
  });
}
```

### 3.4 关系映射（关联查询）

定义 `Post` 模型，建立 `User` 与 `Post` 的 1:N 关系，并进行预加载查询：

```js
const Post = sequelize.define('Post', {
  title: DataTypes.STRING,
  content: DataTypes.TEXT,
});

// 建立 1:N 关系
User.hasMany(Post, { foreignKey: 'userId', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'userId', as: 'author' });

// 级联/预加载（Eager Loading）查询
const usersWithPosts = await User.findAll({
  include: [{
    model: Post,
    as: 'posts',
    attributes: ['title'],
  }],
});
```

## 4. Sequelize CLI 初始化

`sequelize init` 是 **Sequelize CLI** 提供的脚手架初始化命令，用于在项目中快速生成标准的数据库迁移（Migrations）、模型（Models）、配置（Config）与种子数据（Seeders）目录结构。

### 4.1 安装与初始化

安装 Sequelize CLI：

```bash
npm install --save-dev sequelize-cli
```

在项目根目录下运行初始化命令：

```bash
npx sequelize-cli init
```

### 4.2 生成的目录结构

执行成功后，终端会提示已生成 4 个核心目录：

```text
├── config/
│   └── config.json          # 数据库多环境配置文件 (development, test, production)
├── models/
│   └── index.js             # 模型自动载入入口，负责遍历 models 目录并建立关联
├── migrations/              # 存放数据库结构变更的迁移文件
└── seeders/                 # 存放初始化/测试用的假数据（种子文件）
```

## 5. 核心文件配置与说明

### 5.1 config/config.json

配置不同环境下的数据库连接信息：

```json
{
  "development": {
    "username": "root",
    "password": "your_password",
    "database": "my_db_dev",
    "host": "127.0.0.1",
    "dialect": "mysql"
  },
  "test": {
    "username": "root",
    "password": "your_password",
    "database": "my_db_test",
    "host": "127.0.0.1",
    "dialect": "mysql"
  },
  "production": {
    "use_env_variable": "DATABASE_URL",
    "dialect": "mysql"
  }
}
```

### 5.2 migrations/

运行cli得到模板文件，填充 `up`（数据库迁移）和 `down`（数据库回滚）逻辑：

```js
module.exports = {
  // 升级操作：执行迁移时调用
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'avatar_url', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: '用户头像地址',
    });
  },

  // 降级操作：回滚迁移时调用
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'avatar_url');
  }
};
```

### 5.3 seeders/

运行cli得到模板文件，填充 `up`（插入数据）和 `down`（清理回滚数据）逻辑：

```js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  // 1. 执行注入数据时调用
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('users', [
      {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: 'ADMIN',
        status: 1,
        // 如果表开启了 timestamps，底层 bulkInsert 不会自动填充时间，必须显式赋值
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 2,
        username: 'test_user',
        email: 'test@example.com',
        role: 'USER',
        status: 1,
        created_at: new Date(),
        updated_at: new Date(),
      }
    ], {});
  },

  // 2. 回滚撤销种子数据时调用
  async down(queryInterface, Sequelize) {
    // 按主键或特定条件精确删除，避免清空全表
    await queryInterface.bulkDelete('users', {
      id: [1, 2]
    }, {});
  }
};
```
## 6. 初始化后的常用 CLI 工作流

初始化完成后，日常数据库管理主要依靠以下 CLI 命令。

### 6.1 创建数据库

读取 `config.json` 中的当前环境配置直接创建数据库：

```bash
npx sequelize-cli db:create
```

### 6.2 生成模型与对应的迁移文件

使用 CLI 自动生成 `User` 模型以及创建该表的 migration：

```bash
npx sequelize-cli model:generate --name User --attributes firstName:string,lastName:string,email:string
```

该命令会自动生成：

- `models/user.js`：定义业务逻辑中的模型
- `migrations/YYYYMMDDHHMMSS-create-user.js`：定义版本化的 DDL 变更脚本

### 6.3 执行迁移（应用到数据库）

在终端执行迁移，将变更应用到数据库：

```bash
npx sequelize-cli db:migrate
```

执行后，Sequelize 会在数据库中生成一张名为 `SequelizeMeta` 的表，用于记录当前已执行的迁移文件版本，避免重复执行。

### 6.4 回滚迁移

在终端执行回滚命令：

```bash
# 回滚最近一次执行的迁移
npx sequelize-cli db:migrate:undo

# 回滚所有迁移
npx sequelize-cli db:migrate:undo:all
```

### 6.5 种子数据

用于批量插入初始配置或假数据：

```bash
# 生成种子文件
npx sequelize-cli seed:generate --name demo-user

# 执行所有种子文件填充数据
npx sequelize-cli db:seed:all

# 回滚种子数据
npx sequelize-cli db:seed:undo
```
