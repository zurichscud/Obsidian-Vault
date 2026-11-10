---
title: "stream"
---

Stream 用于**处理流式数据**（如大文件读写、网络数据传输、实时日志等），允许数据被分块（chunk）逐次读取和处理，而不需要将所有内容一次性加载进内存。

## 1. 为什么必须使用 Stream？

如果不使用 Stream，读取一个 2GB 的文件需要将这 2GB 完整加载到内存（Buffer）中，会导致：

1. **内存暴涨/溢出**。
2. **响应耗时长**：用户必须等待全部 2GB 读取完毕后才能收到第一个字节。

使用 Stream 后，数据就像流水一样，边读取、边处理、边输出，**占用内存极小且恒定**（仅由缓冲池 `highWaterMark` 决定，默认 64KB 或 16KB）。

## 2. 四种基本流类型

`stream` 模块提供了 4 种基础的类：

1. **`Readable`（可读流）**：数据的生产方。
2. **`Writable`（可写流）**：数据的消费方。
3. **`Duplex`（双工流）**：既可读又可写，读写通道独立。
4. **`Transform`（转换流）**：特殊的 Duplex，写入的数据经过处理后自动作为读取的数据输出。

## 3. 创建可读流

### 3.1 指定文件数据源

`fs.createReadStream()` 是 Node 帮你封装好的「文件读取流」：

```js
import fs from 'node:fs'

const stream = fs.createReadStream('./test.txt')

stream.on('data', chunk => {
  console.log(chunk)
})
```

### 3.2 自定义数据源

`new Readable()` 是你自己定义「数据怎么产生」：

```js
import { Readable } from 'node:stream'

const stream = new Readable({
  read() {
    this.push('hello')
    this.push('world')
    this.push(null)
  }
})
```

## 4. 转换流

用 `pipeline()` 串联可读流、转换流和可写流：

```js
import { pipeline } from 'node:stream/promises';
import fs from 'node:fs';
import zlib from 'node:zlib';

async function processFile() {
  try {
    await pipeline(
      fs.createReadStream('large-file.log'),
      zlib.createGzip(), // 转换流
      fs.createWriteStream('large-file.log.gz')
    );
    console.log('压缩成功，所有流已安全关闭');
  } catch (err) {
    console.error('传输中断/出错，相关流已被自动清理:', err);
  }
}
```

## 5. pipeline

在 Node.js 中，`pipeline` 方法是 `stream` 模块提供的一个核心工具函数，主要用于**安全地将多个流连接（pipe）在一起**，并在传输完成后进行资源清理或错误捕获。

`pipeline` 方法的参数个数是**变长的（不定长）**，最少需要 **2 个参数**，最多可以传入**任意多个中间转换节点**。

$$\text{pipeline}(\text{source}, \text{\dots transforms}, \text{destination}, [\text{options}], [\text{callback}])$$

**流的类型顺序**：

- 第 1 个参数必须是 **Readable** 或 **Async Iterable**。
- 中间参数必须是 **Transform（转换流）**。
- 最后一个参数必须是 **Writable（可写流）**。

## 6. 读取字符

设置编码后读取文本文件，`data` 事件返回字符串：

```js
import fs from 'node:fs';

const stream = fs.createReadStream('./test.txt');

stream.setEncoding('utf8');

stream.on('data', chunk => {
  console.log(chunk); // 字符串
  //stream.destroy();//手动中止
});

stream.on('end', () => {
  console.log('读取完成');
});
```
