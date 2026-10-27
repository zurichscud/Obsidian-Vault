## 1. 两种上传方案

将文件上传到阿里云 OSS（Object Storage Service）通常有两种架构方案：

1. **服务端代理上传**：客户端把文件发给服务端，服务端接收后上传至 OSS，适合需要后端做文件校验、图片处理或记录日志的场景。
2. **客户端直传**：服务端生成带有效期的预签名上传凭证（STS / PostObject 策略），前端直接直传 OSS，**不占用服务器带宽与内存**。

## 2. 服务端代理上传

### 2.1 安装核心依赖

安装 Express、Multer、ali-oss 依赖：

```bash
npm install express multer ali-oss
```

### 2.2 环境配置

建议使用阿里云 RAM 用户的 AccessKey，并授予其对 OSS 的最小访问权限。以下为 `.env` 配置示例：

```
ALIYUN_REGION=oss-cn-hangzhou
ALIYUN_ACCESS_KEY_ID=your_ram_access_key_id
ALIYUN_ACCESS_KEY_SECRET=your_ram_access_key_secret
ALIYUN_BUCKET=your_bucket_name
```

### 2.3 核心实现代码

使用 `multer.memoryStorage()` 将上传文件保存在内存 Buffer 中，直接流式传给 OSS，无需写入本地磁盘临时目录。以下为 `app.js` 实现：

```javascript
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const OSS = require('ali-oss');
const path = require('path');
const crypto = require('crypto');

const app = express();

// 初始化 OSS 客户端
const client = new OSS({
  region: process.env.ALIYUN_REGION,
  accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
  bucket: process.env.ALIYUN_BUCKET,
  secure: true // 使用 HTTPS
});

// 配置 Multer 使用内存存储
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 限制最大 10MB
  }
});

// 单文件上传接口
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ code: 400, message: '请选择要上传的文件' });
    }

    // 生成唯一文件名，防止重名覆盖
    const ext = path.extname(file.originalname);
    const uniqueName = `uploads/${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;

    // 使用 put 直接上传内存数据
    const result = await client.put(uniqueName, file.buffer);

    res.json({
      code: 200,
      message: '上传成功',
      data: {
        name: result.name,
        url: result.url // 若 Bucket 是公共读，直接返回访问 URL
      }
    });
  } catch (err) {
    console.error('OSS 上传失败:', err);
    res.status(500).json({ code: 500, message: '上传失败', error: err.message });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
```

## 3. 客户端直传

### 3.1 PUT 直传

当文件较大或并发较高时，可由 Express 签发一个临时 `PUT` 签名 URL，前端拿到后通过 `axios.put(signedUrl, file)` 直传 OSS。以下为获取前端直传签名 URL 的接口实现：

```javascript
// 获取前端直传签名 URL
app.get('/api/oss/upload-url', async (req, res) => {
  try {
    const { filename } = req.query;
    const ext = path.extname(filename || '');
    const objectKey = `direct/${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;

    // 生成带签名的 PUT 上传链接，有效期 600 秒
    const url = client.signatureUrl(objectKey, {
      method: 'PUT',
      'Content-Type': req.query.contentType || 'application/octet-stream',
      expires: 600
    });

    res.json({
      code: 200,
      data: {
        uploadUrl: url,
        objectKey: objectKey
      }
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: '签名生成失败' });
  }
});
```

使用该方式时需注意：

- 在后端为文件生成随机唯一字符串，避免文件名相同导致文件覆盖，可使用 `uuid` 模块生成。
- 指定用户上传的路径，防止用户随意上传。

### 3.2 POST 直传

`client.calculatePostSignature(policy)` 是 `ali-oss` 官方 SDK 内置的开箱即用方法。它省去了手动进行 JSON 序列化、Base64 编码和 HMAC-SHA1 签名的模板代码，能够直接返回计算好的 `policy` 和 `Signature`。

以下为 POST 直传签名接口的实现：

```js
const express = require('express');
const OSS = require('ali-oss');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const client = new OSS({
  region: process.env.OSS_REGION,
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  bucket: process.env.OSS_BUCKET,
  secure: true
});

// 允许上传的 MIME 白名单
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

app.post('/api/oss/post-signature', (req, res) => {
  try {
    const { filename, mimeType } = req.body;

    if (!mimeType || !ALLOWED_MIME_TYPES.has(mimeType)) {
      return res.status(400).json({ code: 400, message: '不支持的文件类型' });
    }

    const ext = path.extname(filename || '').toLowerCase();
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const objectKey = `uploads/${datePrefix}/${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;

    // 1. 设置 10 分钟后过期
    const expiration = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // 2. 构造策略对象
    const policy = {
      expiration,
      conditions: [
        { bucket: process.env.OSS_BUCKET },
        // 精准匹配，防止前端覆盖其他路径
        ['eq', '$key', objectKey],
        // 核心安全：限制文件大小为 1B ~ 10MB
        ['content-length-range', 1, 10 * 1024 * 1024],
        // 核心安全：强校验 Content-Type
        ['eq', '$Content-Type', mimeType]
      ]
    };

    // 3. 一键计算 policy base64 和 signature
    const signatureData = client.calculatePostSignature(policy);

    // 构造直传地址：https://<bucket>.<region>.aliyuncs.com
    const host = `https://${process.env.OSS_BUCKET}.${process.env.OSS_REGION}.aliyuncs.com`;

    res.json({
      code: 200,
      data: {
        host,
        key: objectKey,
        contentType: mimeType,
        policy: signatureData.policy,
        signature: signatureData.Signature,
        ossAccessKeyId: client.options.accessKeyId
      }
    });
  } catch (err) {
    console.error('签名计算失败:', err);
    res.status(500).json({ code: 500, message: '获取签名失败' });
  }
});
```

#### SDK 返回结构与参数映射

`client.calculatePostSignature(policy)` 的返回值是一个扁平对象：

```js
{
  policy: 'eyBleHBpcmF0aW9uIjogIjIwMjYtMTAtMjdUMTE6...', // 已经 Base64 编码后的 policy 字符串
  Signature: 'v5sK2X6L7qj...'                            // 计算出的 HMAC-SHA1 签名
}
```

该对象中的键名存在大小写差异：

- 键名是 **首字母大写** 的 `Signature`。
- 前端组装 `FormData` 向 OSS 提交时，字段名必须严格区分大小写（`OSSAccessKeyId`、`policy`、`Signature`、`key`、`file`），否则 OSS 会报 `MissingArgument` 或 `AccessDenied`。

#### 前端提交表单

前端收到响应后，按上述字段名组装表单提交：

```js
const formData = new FormData();
formData.append('key', data.key);
formData.append('policy', data.policy);
formData.append('OSSAccessKeyId', data.ossAccessKeyId);
formData.append('success_action_status', '200');
formData.append('Signature', data.signature);
formData.append('Content-Type', data.contentType);
formData.append('file', file); // 必须在最后追加

await fetch(data.host, {
  method: 'POST',
  body: formData
});
```

## 4. PUT 直传与 POST 直传对比

两种直传方式的关键差异如下：

| **对比维度** | **signatureUrl (PUT 直传)** | **calculatePostSignature (POST 表单直传)** |
|---|---|---|
| **传输链路** | 客户端 ➔ 阿里云 OSS（直传） | 客户端 ➔ 阿里云 OSS（直传） |
| **HTTP 请求方法** | `PUT` | `POST` (`multipart/form-data`) |
| **参数位置** | 签名参数全部挂在 **URL Query 字符串** 中 | 签名与策略作为 **Form Data 表单字段** 提交 |
| **文件大小强制限制** | **不支持**（URL 签名机制无法原生约束 Body 体积上限） | **原生支持**（通过 `content-length-range` 严格硬约束） |
| **文件类型强制限制** | 较弱（URL 中仅能声明单一预期 `Content-Type`，无灵活策略） | **强校验**（支持等值匹配或白名单规则） |
| **前端调用方式** | `fetch(signedUrl, { method: 'PUT', body: file })` | 组装 `FormData` 并 `fetch(host, { method: 'POST', body: formData })` |
