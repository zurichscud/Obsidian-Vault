## 1. 作用

定义用户接收通知的偏好。

## 2. 表结构

### 2.1 建表语句

`notification_template` 的完整建表语句如下，注释标出了各字段的用途与示例。

```sql
CREATE TABLE notification_template (
  id            BIGINT PRIMARY KEY,
  code          VARCHAR(64)  NOT NULL UNIQUE,   -- 模板编码，如 COMMENT_REPLY
  category      VARCHAR(32)  NOT NULL,          -- 分类：interaction/trade/system
  title_tpl     VARCHAR(255) NOT NULL,          -- "{sender_name} 评论了你的帖子"
  body_tpl      VARCHAR(1024),                  -- "{comment_excerpt}"，可空
  link_tpl      VARCHAR(512),                   -- "/posts/{post_id}?comment={comment_id}"，可空
  agg_key_tpl   VARCHAR(128),                   -- 聚合键模板，可空
  agg_title_tpl VARCHAR(255),                   -- 聚合后的标题模板，可空
  params_schema JSON,                           -- 必填参数声明，如 ["sender_name","post_id"]
  status        TINYINT      NOT NULL DEFAULT 1,-- 1=启用 0=停用
  created_at    DATETIME     NOT NULL,
  updated_at    DATETIME     NOT NULL
);
```

### 2.2 字段说明

| 字段 | 含义 |
|---|---|
| `code` | 业务方引用模板的唯一标识，发布后不改名、不复用 |
| `category` | 决定通知归属哪个 Tab，也关联用户偏好设置 |
| `title_tpl` / `body_tpl` | 带 `{占位符}` 的标题和正文 |
| `link_tpl` | 点击后跳转的站内相对路径，不含域名；为空则不可点击 |
| `agg_key_tpl` | 聚合键：渲染出相同键的事件会合并成一条；为空则不聚合 |
| `agg_title_tpl` | 合并后（count > 1）使用的标题 |
| `params_schema` | 声明需要哪些参数，缺参就拒绝生成 |
| `status` | 停用后不再生成新通知，历史通知不受影响 |

## 3. 处理流程

一个业务事件从进入通知服务到写入通知表，依次经过以下步骤。

```
业务事件 {code, user_id, params}
   │
   ▼
1. 按 code 取模板（内存缓存）
   │  不存在或已停用 → 丢弃并记日志
   ▼
2. 校验 params 是否满足 params_schema
   │  缺参 → 报错/告警，不生成残缺通知
   ▼
3. 查用户偏好：该 category 的站内通知是否开启
   │  关闭 → 结束
   ▼
4. 渲染 title / body / link / agg_key（替换占位符）
   ▼
5. 写 notification 表
   │  有 agg_key：找该用户【未读】且 biz_key 相同的通知
   │     ├─ 有 → UPDATE：count+1、追加发送者、标题换成 agg_title、时间顶到最前
   │     └─ 无 → INSERT
   │  无 agg_key：直接 INSERT
   ▼
6. Redis 未读数 +1（聚合更新时，如果该通知本来就是未读，则不加）
```

## 4. 渲染规则

### 4.1 占位符替换

占位符只做简单替换，格式为 `{变量名}`，模板里不写条件、循环。需要不同文案就拆成不同模板。

### 4.2 渲染结果的存储

渲染结果直接存进 `notification`（`title`、`content`、`link`）。之后修改模板只影响新通知，历史通知不变。

### 4.3 参数值处理

- 用户输入的内容（昵称、评论摘要）前端一律按**纯文本**展示，防 XSS。
- 长文本渲染时截断，如评论摘要取前 50 字。
- 写入 `link` 的参数值要做 **URL 编码**。

### 4.4 link 校验

`link` 渲染后要校验：必须以 `/` 开头且不以 `//` 开头，防止开放重定向。

### 4.5 缺参处理

占位符没有对应参数时，不能原样输出 `{xxx}`，按缺参处理。

## 5. 聚合的逻辑

`agg_key_tpl` 决定"哪些事件合成一条"。

### 5.1 聚合键取值

| 想要的效果 | agg_key_tpl |
|---|---|
| 同一帖子的点赞合并 | `like:post:{post_id}` |
| 同一帖子的评论合并 | `comment:post:{post_id}` |
| 不聚合 | 留空 |

### 5.2 聚合规则

- 渲染出的键存入 `notification.biz_key`。
- **只合并未读的**：用户读过之后再有人点赞，生成新的一条未读通知，不会被悄悄吞掉。
- 聚合后的标题用 `agg_title_tpl`，参数来自合并状态：`{first_sender}`（第一位或最新一位）、`{count}`（总数）。这些值存在 `notification.payload` 里（如 `{"count":5,"recent_senders":[...]}`）。
- 因为同一个键会重复出现，`notification` 表上**不能**对 `(user_id, biz_key)` 建唯一索引，用普通索引 `(user_id, biz_key, is_read)` 即可。

## 6. 示例数据

| code | category | title_tpl | body_tpl | link_tpl | agg_key_tpl | agg_title_tpl |
|---|---|---|---|---|---|---|
| `COMMENT_REPLY` | interaction | `{sender_name} 评论了你的帖子` | `{comment_excerpt}` | `/posts/{post_id}?comment={comment_id}` | 空 | 空 |
| `POST_LIKED` | interaction | `{sender_name} 赞了你的帖子` | `{post_title}` | `/posts/{post_id}` | `like:post:{post_id}` | `{first_sender} 等 {count} 人赞了你的帖子` |
| `ORDER_SHIPPED` | trade | `你的订单已发货` | `订单 {order_no} 已由 {carrier} 发出` | `/orders/{order_id}` | 空 | 空 |
| `SYSTEM_NOTICE` | system | `{title}` | `{content}` | 空 | 空 | 空 |

## 7. 管理规则

### 7.1 缓存

读多写少，服务内存缓存，修改后 1～5 分钟内刷新。

### 7.2 变更约束

- `code` 不改名、不复用。
- 新增必填参数前，先让调用方改好。
- 修改 `link_tpl` 路径时，前端要保留旧路径的兼容或重定向，因为历史通知里存的是旧链接。

### 7.3 停用与预览

- **停用而不是删除**：用 `status=0`，方便排查历史通知。
- **发布前预览**：后台提供"填示例参数 → 看渲染结果"，避免上线后才发现文案或链接错误。

## 8. 与其他表的关系

| 关联表 | 关系 |
|---|---|
| `notification` | 渲染结果落库：`code` 存模板 `code`，`category` 从模板复制，`biz_key` 存聚合键 |
| `notification_setting` | 通过 `category` 关联，决定该用户是否接收这类站内通知 |
