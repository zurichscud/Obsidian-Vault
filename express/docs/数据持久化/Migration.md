
## 1. 迁移的本质

**数据库迁移（Database Migration）**，本质上就是**数据库表结构的“版本控制系统（Git）”**。

在 MyBatis 或传统 Java 开发中，很多人习惯直接在 Navicat / DBeaver 里写 DDL 建表、改字段，或者在团队群里发一句：“我加了一个 status 字段，大家执行一下这段 SQL”。这种方式在个人开发时很灵活，但到了团队协作和多环境发布时很容易出事故。

迁移（Migration）正是为了解决“数据库结构变更难以协同、追踪和自动化”而诞生的机制。

## 2. 为什么 MyBatis 没有“迁移”

MyBatis 的定位是 **SQL 映射器**，它的设计哲学是：

1. **只关注数据操作**：负责将 Java 对象与 SQL 语句（DML）互相映射。
2. **不管表结构维护**：MyBatis 假设数据库表已经由运维或 DBA 建好了，它默认不提供管理 DDL的机制。

## 3. 迁移解决的核心痛点

| 痛点场景      | 传统纯手工执行 SQL                         | 使用迁移（Migration）                           |
| --------- | ----------------------------------- | ----------------------------------------- |
| **团队协同**  | 同事拉了你的代码，启动报错提示“字段不存在”，必须去问你改了什么表。  | 代码合并后，执行一条 `db:migrate`，所有新增的表结构自动同步。     |
| **多环境部署** | 测试服、预发服、生产服，需要人工逐个比对执行了哪些 SQL，极易遗漏。 | CI/CD 流水线自动检测未执行的迁移脚本并按序应用，完全自动化。         |
| **变更追溯**  | 不知道某个字段是谁在什么时候加的、为什么要加。             | 每个迁移文件都有时间戳和 Git 提交记录，有迹可循。               |
| **版本回滚**  | 发布失败需要回滚代码，但数据库改动的表结构很难一键还原。        | 迁移文件自带 `down` 回滚逻辑，执行 `undo` 即可自动退回上一个状态。 |

## 4. Sequelize 迁移的工作原理

迁移的核心机制非常直观：**时间戳文件 + 元数据记录表**。

### 4.1 迁移文件长什么样

每次需要变更结构时，生成一个带时间戳的文件（例如 `20261026-add-avatar-to-users.js`），其内容结构如下：

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

### 4.2 底层如何判断哪些执行过

当你在终端执行 `npx sequelize-cli db:migrate` 时：

1. Sequelize 会在你的数据库里自动创建或查找一张名为 **`SequelizeMeta`** 的表。
2. 它会比对 `migrations/` 目录下的文件名与 `SequelizeMeta` 表里的记录。
3. **只执行那些数据库里还没有记录的迁移文件**。
4. 执行成功后，把文件名写入 `SequelizeMeta`。

> 这就是为什么迁移不会重复执行，也能保证团队内不同机器、不同环境的表结构永远保持一致。

## 5. Sequelize 开发中的两种模式

在 Sequelize 中，管理表结构通常有两种风格。

### 5.1 粗暴同步模式（仅适合个人玩具项目/极早期原型）

启动时自动根据 Model 代码建表：

```js
// 启动时自动根据 Model 代码建表
await sequelize.sync({ alter: true });
```

缺点：生产环境极其危险，容易锁表甚至误删列，无法做到精细化变更和版本回滚。

### 5.2 标准工程化模式（推荐）

- 禁用 `sequelize.sync()`。
- 所有表的新建、字段增删、索引调整，全部通过 `npx sequelize-cli migration:generate` 编写迁移脚本，再用 `npx sequelize-cli db:migrate` 执行推送到数据库。

## 6. 示例：新增 phone 字段并加唯一索引

**现有一张 `users` 表，业务迭代需要给它新增一个 `phone`（手机号）字段，并给手机号加上唯一索引。**

整个操作包含 5 个标准步骤。

### 6.1 生成一个空白的迁移文件

在终端运行命令：

```bash
npx sequelize-cli migration:generate --name add-phone-to-users
```

- `migration:generate`：告诉 CLI “帮我生成一个新的迁移文件”。
- `--name`（简写形式为 `-n`）：参数名，表示“名称”。
- `add-phone-to-users`：参数的值，即你为这次变更起的名字。

CLI 会把这个名字拼接到时间戳后面，最终在 `migrations/` 目录下生成文件： `20261026133000-add-phone-to-users.js`。

如果没有 `--name`，生成的可能是无意义的文件名（如 `20261026133000-unnamed-migration.js`），后续排查和维护时根本看不出这次迁移具体干了什么。

时间戳前缀保证了所有迁移文件在任何机器上都会**严格按照创建时间的先后顺序**执行。

### 6.2 编写迁移逻辑

迁移文件的内容要开发者自己写

打开该文件，编写升级（`up`）与回滚（`down`）逻辑：

```js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  // 1. up: 执行迁移时要做的事情（向前推进）
  async up(queryInterface, Sequelize) {
    // 步骤 A: 给 users 表添加 phone 字段
    await queryInterface.addColumn('users', 'phone', {
      type: Sequelize.STRING(20),
      allowNull: true,
      comment: '用户绑定的手机号',
    });

    // 步骤 B: 给 phone 字段创建唯一索引
    await queryInterface.addIndex('users', ['phone'], {
      name: 'idx_users_phone_unique',
      unique: true,
    });
  },

  // 2. down: 回滚时要做的事情（严格与 up 做相反的操作，顺序相反）
  async down(queryInterface, Sequelize) {
    // 步骤 B 的相反操作: 先删索引
    await queryInterface.removeIndex('users', 'idx_users_phone_unique');

    // 步骤 A 的相反操作: 再删字段
    await queryInterface.removeColumn('users', 'phone');
  }
};
```

### 6.3 执行迁移，同步到数据库

在终端执行：

```bash
npx sequelize-cli db:migrate
```

终端会输出：

```text
Loaded configuration file "config/config.json".
Using environment "development".
== 20261026133000-add-phone-to-users: migrating =======
== 20261026133000-add-phone-to-users: migrated (0.042s)
```

此时数据库发生两个变化：

1. `users` 表里成功加上了 `phone` 字段和对应的唯一索引。
2. 数据库内部的元数据表 `SequelizeMeta` 自动插入了一条记录，可用下面的 SQL 查看：

   ```sql
   SELECT * FROM SequelizeMeta;
   -- 结果: '20261026133000-add-phone-to-users.js'
   ```

再次运行 `npx sequelize-cli db:migrate` 时，Sequelize 会发现该文件已经在 `SequelizeMeta` 中，终端会直接提示 `No migrations were executed, database schema was already up to date.`，**绝不重复执行**。

### 6.4 同步更新代码里的 Model

迁移只负责修改数据库底层物理表结构。业务代码模型（`models/user.js`）也需要同步补齐该字段，以便业务查询使用：

```js
// models/user.js
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {}
  User.init({
    username: DataTypes.STRING,
    email: DataTypes.STRING,
    // 补充新字段定义
    phone: DataTypes.STRING(20),
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
  });
  return User;
};
```

### 6.5 回滚

如果刚执行完发现字段长度设计错了，或者上线后出现紧急 Bug 需要撤回数据库变更，可以执行：

```bash
npx sequelize-cli db:migrate:undo
```

终端会触发刚刚在 `down` 函数中写的反向逻辑：

```text
== 20261026133000-add-phone-to-users: reverting =======
== 20261026133000-add-phone-to-users: reverted (0.028s)
```

数据库中的 `phone` 列与索引被干净移除，同时 `SequelizeMeta` 里的对应记录也会被删除，数据库恢复到变更前的状态。

### 6.6 团队协作场景

当你把包含这个迁移文件的代码 `git commit` 并推送到远程仓库后：

- **同事 A 拉取代码**：只需在本地终端运行一次 `npx sequelize-cli db:migrate`，他的本地数据库就会自动补齐 `phone` 字段，无需找你索要 SQL 脚本。
- **CI/CD 部署到测试/生产环境**：发布脚本中加入 `npx sequelize-cli db:migrate`，服务启动前就会自动检测是否有新的迁移文件并按序应用。
