**Multer** 是 Node.js 环境中专门用于处理 `multipart/form-data` 类型表单数据的 Express 中间件，主要用于**文件上传**。

## 1. 安装

通过 npm 安装 `multer` 依赖：

```bash
npm install multer
```

## 2. 基础配置与常用存储模式

### 2.1 磁盘存储

将文件直接写入服务器硬盘，并可自定义文件名与目录。

以下代码先用 `multer.diskStorage` 配置目标目录与自定义文件名（防止重名覆盖），再通过 `limits` 与 `fileFilter` 限制文件大小和允许的 MIME 类型：

```javascript
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();

// 1. 配置存储引擎
const storage = multer.diskStorage({
  // 目标目录
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  // 自定义文件名（防止重名覆盖）
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// 2. 限制与文件过滤
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制 5MB
  },
  fileFilter: (req, file, cb) => {
    // 允许的 MIME 类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持 JPG, PNG, WEBP 格式图片'));
    }
  }
});
```

### 2.2 内存存储

文件保存在内存中作为 `Buffer`，适用于直传 OSS/S3、计算 MD5 校验码等场景。

以下代码使用 `multer.memoryStorage()` 创建内存存储实例，并将文件大小限制为 10MB：

```javascript
const uploadToMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});
```

> [!warning] 注意
> fileSize应该小于服务器的可用内存大小，如果需要传大文件到OSS，应该使用磁盘存储。
## 3. 常见路由接收场景

### 3.1 单文件上传

使用 `upload.single(fieldname)` 接收单文件：文件信息挂载在 `req.file`，普通文本字段挂载在 `req.body`。

```javascript
app.post('/api/upload/avatar', upload.single('avatar'), (req, res) => {
  // req.file:
  // { fieldname, originalname, encoding, mimetype, destination, filename, path, size }
  if (!req.file) {
    return res.status(400).json({ code: 400, message: '请选择要上传的文件' });
  }

  res.json({
    code: 200,
    message: '上传成功',
    url: `/static/${req.file.filename}`
  });
});
```

### 3.2 多文件上传（同字段）

使用 `upload.array(fieldname[, maxCount])` 接收同一字段下的多个文件，文件数组挂载在 `req.files`。

以下路由以 `photos` 字段接收最多 5 个文件，并返回每个文件的原始名称与路径：

```javascript
app.post('/api/upload/photos', upload.array('photos', 5), (req, res) => {
  res.json({
    code: 200,
    files: req.files.map(f => ({ name: f.originalname, path: f.path }))
  });
});
```

### 3.3 多字段组合上传

使用 `upload.fields(fields)` 按字段分别接收文件。

以下路由同时接收 `avatar` 与 `cover` 两个字段（各最多 1 个文件），并从 `req.files` 中取出对应文件返回其路径：

```javascript
app.post(
  '/api/upload/profile',
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'cover', maxCount: 1 }
  ]),
  (req, res) => {
    const avatarFile = req.files['avatar']?.[0];
    const coverFile = req.files['cover']?.[0];
    res.json({ avatar: avatarFile?.path, cover: coverFile?.path });
  }
);
```

## 4. 统一错误捕获中间件

Multer 抛出的错误可以通过判断 `instanceof multer.MulterError` 进行精细化捕获。

以下错误处理中间件区分 Multer 内部错误（如超大文件的 `LIMIT_FILE_SIZE`）与自定义 `fileFilter` 抛出的错误，并分别返回对应的响应：

```javascript
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer 内部错误（如超大文件 LIMIT_FILE_SIZE）
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ code: 413, message: '文件大小超出限制（最大 5MB）' });
    }
    return res.status(400).json({ code: 400, message: `上传错误: ${err.message}` });
  } else if (err) {
    // 自定义 filter 抛出的错误
    return res.status(400).json({ code: 400, message: err.message });
  }
  next();
});
```

## 5. 注意事项

- **Content-Type 限制**：Multer **只处理** `multipart/form-data` 请求。如果前端传递的是 `application/json`，Multer 不会解析任何字段。
- **避免未限制的全局中间件**：永远不要直接在全局 `app.use(upload.any())`，因为恶意用户可能会通过上传大量恶意文件耗尽磁盘或内存。建议按路由按需挂载。
- **内存占用风险**：如果使用 `memoryStorage`，务必严格设置 `limits.fileSize`，避免并发大文件请求导致 Node.js 进程内存溢出（OOM）。
