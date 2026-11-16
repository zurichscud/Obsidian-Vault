## 1. 作用

notification 表保存每位用户收到的通知记录。通知服务在模板渲染完成后，将结果（`title`、`content`、`link`）直接写入本表；历史记录不受后续模板修改影响。

聚合场景下，同一条未读记录会被反复更新（count 累加、时间置顶），而不是插入新行。非聚合场景直接插入。

## 2. 表结构

### 2.1 建表语句

以下是 `notification` 的完整建表语句，包含各字段含义及聚合场景所需索引。

```sql
CREATE TABLE notification (
  id         BIGINT        PRIMARY KEY,
  user_id    BIGINT        NOT NULL,            -- 接收通知的用户
  sender_id  BIGINT,                            -- 触发通知的用户 ID，系统消息为 NULL
  code       VARCHAR(64)   NOT NULL,            -- 模板 code，如 POST_LIKED
  category   VARCHAR(32)   NOT NULL,            -- 从模板复制：interaction/trade/system
  title      VARCHAR(255)  NOT NULL,            -- 渲染后的标题（聚合时替换为 agg_title）
  content    VARCHAR(1024),                     -- 渲染后的正文，可空
  link       VARCHAR(512),                      -- 渲染后的跳转路径，可空
  biz_key    VARCHAR(128),                      -- 渲染后的聚合键，无聚合则为空
  is_read    TINYINT       NOT NULL DEFAULT 0,  -- 0=未读 1=已读
  read_time  DATETIME,                          -- 已读时间，未读时为空
  payload    JSON,                              -- 聚合元数据，如 {"count":5,"recent_senders":[...]}
  created_at DATETIME      NOT NULL,
  updated_at DATETIME      NOT NULL
);

-- 聚合查询：同用户、同 biz_key、未读
-- 因同一 biz_key 可重复出现，不能在 (user_id, biz_key) 上建唯一索引
CREATE INDEX idx_notification_biz ON notification (user_id, biz_key, is_read);
```

### 2.2 字段说明

| 字段                           | 含义                                             |
| ---------------------------- | ---------------------------------------------- |
| `sender_id`                  | 触发通知的用户 ID；系统消息为 `NULL`                        |
| `code`                       | 存模板 `code`，标识这条通知由哪个模板生成                       |
| `category`                   | 从模板复制，标识通知分类，对应 `notification_setting` 中的偏好开关  |
| `title` / `content` / `link` | 渲染后的最终文本，历史通知不受后续模板修改影响                        |
| `biz_key`                    | 渲染后的聚合键；相同键且未读的通知会被合并更新，无聚合时为空                 |
| `is_read`                    | 未读/已读状态；聚合查询只匹配未读记录                            |
| `read_time`                  | 已读时间；未读时为空                                     |
| `payload`                    | 聚合元数据，存 `count`（合并总数）和 `recent_senders`（发送者列表） |

## 4. 与其他表的关系

| 关联表 | 关系 |
|---|---|
| `notification_template` | `code` 对应模板 `code`；`category` 从模板复制；`biz_key` 由模板 `agg_key_tpl` 渲染而来 |
| `notification_setting` | `category` 对应用户偏好，写入前已按偏好过滤，未开启则不写入 |
