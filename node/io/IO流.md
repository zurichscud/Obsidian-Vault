---
title: "IO流"
---

Node.js 的文件 IO 主要围绕 `node:fs`（文件系统）和 `node:stream`（流）两个模块。它不像 Java 那样严格区分字节流和字符流，这里借用这两个词来区分两种数据形态：

- **字节流**：不指定编码时，读写的数据都是 `Buffer`（二进制），适合图片、压缩包等非文本文件。
- **字符流**：传入 `encoding`（通常是 `"utf8"`）后，读写的数据是字符串，适合文本文件。

> 优先使用 `node:fs/promises` 的 Promise API（或 `node:fs` 的同步方法），回调风格的 API 已经过时。

## 1. 字节流

### 1.1 文件读取

读取图片文件，得到 `Buffer`：

```js
import { readFile } from "node:fs/promises";

const buffer = await readFile("a.png");

console.log(buffer); // <Buffer 89 50 4e 47 ...>
console.log(buffer.length); // 字节数
```

- `readFile` 会把**整个文件读进内存**，大文件应该改用流（见「文件复制」）。
- 文件不存在时抛出 `ENOENT`，通常配合 try/catch 处理。

### 1.2 文件写入

写入文件时，文件不存在会自动创建，已存在则**覆盖**原内容：

```js
import { writeFile } from "node:fs/promises";

const buffer = Buffer.from("hello");

await writeFile("test.bin", buffer);
```

追加写入用 `appendFile`：

```js
import { appendFile } from "node:fs/promises";

await appendFile("test.bin", Buffer.from("abc"));
```

### 1.3 文件复制

小文件直接用 `copyFile`：

```js
import { copyFile, mkdir } from "node:fs/promises";

await mkdir("backup", { recursive: true });
await copyFile("a.zip", "backup/a.zip");
```

大文件用**流**边读边写，内存占用恒定：

```js
import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";

await pipeline(
  createReadStream("a.zip"),
  createWriteStream("backup/a.zip"),
);
```

`pipeline()` 会在任意一环出错时自动销毁所有流，比手写 `readStream.pipe(writeStream)` 更安全。

### 1.4 文件夹复制

Node 16.7+ 自带递归复制：

```js
import { cp } from "node:fs/promises";

await cp("source", "backup", { recursive: true });
```

## 2. 字符流

读写文本时传入 `encoding`，拿到的就是字符串，这就是 Node 里的「字符流」。

### 2.1 字符读取

读取文本文件时传入编码，得到字符串：

```js
import { readFile } from "node:fs/promises";

const text = await readFile("a.txt", "utf8");

console.log(text);
```

按行拆分：

```js
const lines = text.split(/\r?\n/);
```

大文件按行读取用 `readline`，同样**不会把整个文件读进内存**：

```js
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";

const rl = createInterface({
  input: createReadStream("a.txt"),
  crlfDelay: Infinity,
});

for await (const line of rl) {
  console.log(line);
}
```

### 2.2 字符写入

写入文本文件时传入编码：

```js
import { writeFile, appendFile } from "node:fs/promises";

await writeFile("test.txt", "hello 你好", "utf8");

await appendFile("test.txt", "追加一行\n", "utf8");
```

流式写入：

```js
import { createWriteStream } from "node:fs";

const out = createWriteStream("test.txt", "utf8");

out.write("hello\n");
out.write("你好\n");

out.end(() => console.log("写入完成"));
```

- 写入流内部有缓冲区，`end()` 的回调（`finish` 事件）触发时才表示数据**真正落盘**。
- `newLine()` 这种平台换行不再需要：统一写 `\n` 即可，Node 不会自动转换。
