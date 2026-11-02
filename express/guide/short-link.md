---
title: 短链接
---

短链接是一种缩短长网址的方法，它将原始的长网址转换为更短的形式。短链接通常由一系列的字母、数字和特殊字符组成。比起原始的长网址，短链接更加简洁、易于记忆和分享。

## 1. 作用

### 1.1 在社交媒体平台分享链接

短链接的主要用途之一是在社交媒体平台进行链接分享。由于这些平台对字符数量有限制，长网址可能会占用大量的空间。因此使用短链接可以节省字符数，并且更方便在推特、短信等限制字数的场景下使用。

### 1.2 跟踪和统计链接点击量

短链接还可以用于跟踪和统计链接的点击量。通过在短链接中嵌入跟踪代码，网站管理员可以获得关于点击链接的详细统计数据，包括访问量、来源、地理位置等信息。这对于营销活动、广告推广或分析链接的效果非常有用。

## 2. 实现

### 2.1 思路

1. 用户请求创建短链接的接口，请求带有长链接。
2. 服务器存储长链接与短链接的映射关系到数据库。
3. 访问短链时将重定向至长链接接口。

### 2.2 数据库

存储长链接与短链接映射关系的表结构如下：

| 字段名 | 数据类型 | 描述 |
| -------------- | ------------- | -------------------------------------- |
| `id` | INT | 主键，自增 |
| `original_url` | VARCHAR(2048) | 长链接 |
| `short_url` | VARCHAR(255) | 短链接（通常是一个缩短后的随机字符串） |
| `expiration` | TIMESTAMP | 过期时间 |
| `access_count` | INT | 点击次数 |
| `last_access` | TIMESTAMP | 最后访问时间 |
| `referrer` | TEXT | 引荐来源 |

### 2.3 服务器

服务器代码示例如下：

```js
import knex from 'knex'
import express from 'express'
import shortid from 'shortid'

const app = express()
app.use(express.json())

const db = knex({
  client: 'mysql2',
  connection: {
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'short_link'
  }
})

//生成短码 存入数据库
app.post('/create_url', async (req, res) => {
  const { url } = req.body
  const short_id = shortid.generate()
  const result = await db('short').insert({ short_id, url })
  res.send(`http://localhost:3000/${short_id}`)
})

//重定向
app.get('/:shortUrl', async (req, res) => {
  const short_id = req.params.shortUrl
  const result = await db('short').select('url').where('short_id', short_id)
  if (result && result[0]) {
    res.redirect(result[0].url)
  } else {
    res.send('Url not found')
  }
})

app.listen(3000, () => {
  console.log('Server is running on port 3000')
})
```

### 2.4 生成短码的算法

生成短链的算法可以使用哈希算法，然后取哈希结果的前几位（例如 6 位）。
