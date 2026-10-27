**Multer** 是 Node.js 环境中专门用于处理 `multipart/form-data` 类型表单数据的 Express/Connect 中间件，主要用于**文件上传**。
  

### 1. 核心安装

Bash

```
npm install multer
# 或者
pnpm add multer
```

### 2. 基础配置与常用存储模式

#### 模式 A：磁盘存储（DiskStorage，推荐）

将文件直接写入服务器硬盘，并可自定义文件名与目录。

  

JavaScript

```
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

#### 模式 B：内存存储（MemoryStorage）

文件保存在内存中作为 `Buffer`（适用于直传 OSS/S3、计算 MD5 校验码等场景）。

  

JavaScript

```
const uploadToMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});
```

### 3. 常见路由接收场景

#### 单文件上传：`upload.single(fieldname)`

文件信息挂载在 `req.file`，普通文本字段挂载在 `req.body`。

  

JavaScript

```
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

#### 多文件上传（同字段）：`upload.array(fieldname[, maxCount])`

文件数组挂载在 `req.files`。

  

JavaScript

```
app.post('/api/upload/photos', upload.array('photos', 5), (req, res) => {
  res.json({
    code: 200,
    files: req.files.map(f => ({ name: f.originalname, path: f.path }))
  });
});
```

#### 多字段组合上传：`upload.fields(fields)`

JavaScript

```
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

### 4. 统一错误捕获中间件

Multer 抛出的错误可以通过判断 `instanceof multer.MulterError` 进行精细化捕获：

  

JavaScript

```
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

### 5. 关键注意事项

- **Content-Type 限制**：Multer **只处理** `multipart/form-data` 请求。如果前端传递的是 `application/json`，Multer 不会解析任何字段。
    
      
    
- **避免未限制的全局中间件**：永远不要直接在全局 `app.use(upload.any())`，因为恶意用户可能会通过上传大量恶意文件耗尽磁盘或内存。建议按路由按需挂载。
    
      
    
- **内存占用风险**：如果使用 `memoryStorage`，务必严格设置 `limits.fileSize`，避免并发大文件请求导致 Node.js 进程内存溢出 (OOM)。
    
      
    

你目前是打算将上传的文件直接保存在本地磁盘，还是需要结合内存流直接流式转发到 OSS/S3 等对象存储？