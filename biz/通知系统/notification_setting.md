## 1. 作用

`notification_setting` 表保存用户对各通知分类的站内接收偏好。通知服务写入 `notification` 前，先查本表确认该用户是否开启了对应 `category` 的站内通知；已关闭则直接结束，不生成通知记录。

## 2. 表结构

### 2.1 建表语句

以下是 `notification_setting` 的完整建表语句，以 `(user_id, category)` 唯一确定一条偏好记录。

```sql
CREATE TABLE notification_setting (
  id         BIGINT      PRIMARY KEY,
  user_id    BIGINT      NOT NULL,           -- 用户 ID
  category   VARCHAR(32) NOT NULL,           -- 通知分类：interaction/trade/system
  in_site    TINYINT     NOT NULL DEFAULT 1, -- 站内通知开关：1=开启 0=关闭
  created_at DATETIME    NOT NULL,
  updated_at DATETIME    NOT NULL,
  UNIQUE KEY uk_user_category (user_id, category)
);
```

### 2.2 字段说明

| 字段 | 含义 |
|---|---|
| `user_id` | 偏好所属用户 |
| `category` | 通知分类，与 `notification_template.category` 和 `notification.category` 保持一致 |
| `in_site` | 站内通知开关；关闭后该分类的通知不再写入 `notification` 表 |

### 2.3 通知分类

`category` 的取值如下：

| 分类 | 说明 | 通知示例 |
|---|---|---|
| interaction | 互动通知 | 评论、回复、点赞 |
| trade | 交易通知 | 订单、支付、退款 |
| system | 系统通知 | 系统公告、账号安全 |

## 3. 核心设计

假设系统有 100 万用户、4 种渠道。如果每个用户注册时都预先初始化全量配置，这张表瞬间就会膨胀到 **8,000 万行**，而实际上 90% 的用户根本不会去点开“通知设置”页面。

- `user_id + category` 建唯一索引。
- 四个渠道使用 `TINYINT(1)`。
- 不提前为每个用户初始化 4 条记录。
- **用户修改哪个分类的通知设置，就只插入或更新该分类对应的一条记录。**
- 没有配置记录时，使用系统默认配置。

## 4. 与其他表的关系

| 关联表 | 关系 |
|---|---|
| `notification_template` | 通过 `category` 关联；模板的 `category` 决定查哪条偏好记录 |
| `notification` | 写入 `notification` 前先通过本表过滤；`notification.category` 与本表 `category` 一致 |

## 5. 扩展

如果消息的提示方式存在多种，可以根据需求添加相关的列：

| 字段名 | 中文名称 | 默认值 | 说明 |
|---|---|---|---|
| `in_app_enabled` | 站内通知 | 1 | 是否接收站内通知 |
| `email_enabled` | 邮件通知 | 0 | 是否接收邮件通知 |
| `sms_enabled` | 短信通知 | 0 | 是否接收短信通知 |
| `push_enabled` | APP 推送 | 1 | 是否接收 APP 推送 |
