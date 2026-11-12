**ESM（ECMAScript Modules）** 是 ECMAScript 官方在 ES2015（ES6）中引入的 JavaScript 原生模块规范。

## 1. 命名导出与导入

以下示例在 `math.js` 中命名导出，在 `main.js` 中按名导入、重命名导入和命名空间导入：

```js
// math.js
export const pi = 3.14159;
export function add(a, b) {
  return a + b;
}

// 批量导出
const square = (n) => n * n;
export { square };

// main.js
import { pi, add, square as sq } from './math.js';
import * as MathKit from './math.js'; // 命名空间导入
```

## 2. 默认导出

一个模块只能有一个 `default` 导出：

```js
// logger.js
export default function log(message) {
  console.log(message);
}

// main.js - 导入时可以任意命名，不需要加花括号，导出的是default
import myLogger from './logger.js';
```

## 3. 动态导入

静态 `import` 必须写在模块顶层，且路径只能是字符串字面量。
而 **动态导入 `import()`** 是一个类似函数的语法，可以在运行时、任意位置调用，返回一个 **Promise**，resolve 的值是模块的命名空间对象。常用于路由懒加载或条件按需加载：

```js
async function loadChart() {
  const { renderChart } = await import('./chart.js');
  renderChart();
}
```

| 特性   | 静态 `import` | 动态 `import()`     |
| ---- | ----------- | ----------------- |
| 位置   | 只能在顶层       | 任意位置              |
| 路径   | 字符串字面量      | 可以是表达式、变量         |
| 加载时机 | 模块解析阶段，提前加载 | 执行到才加载            |
| 返回值  | 绑定到变量       | Promise           |
| 可用环境 | 仅 ESM       | ESM 和 CommonJS 均可 |
## 4. 模块转发

用于统一聚合多个子模块对外的 API 入口（例如 `index.js`）：

```js
export { add, pi } from './math.js';
export { default as logger } from './logger.js';
export * from './utils.js';
```

## 5. Node.js 中启用 ESM 的方式

Node.js 默认采用 CommonJS 规范，若要直接运行 ESM：

1. **在 `package.json` 中配置**：

    ```json
    {
      "type": "module"
    }
    ```

    配置后，当前目录及子目录下所有 `.js` 文件均被视为 ESM。

2. **使用文件扩展名显式区分**：

    - `.mjs`：始终作为 ESM 解析（无论 `package.json` 的 `type` 是什么）。
    - `.cjs`：始终作为 CommonJS 解析。

3. **替代 `__dirname` 与 `__filename`**：在 ESM 中若需要获取当前文件或目录路径，需借助 `import.meta.url`：

    ```js
    import { fileURLToPath } from 'node:url';
    import { dirname } from 'node:path';

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    ```

## 加载机制

> 静态 `import` 在任何代码执行之前，就已经全部加载完了。

1. **先加载**：从入口出发，递归把所有静态 `import` 的模块都下载、解析完，建好依赖图。
2. **再执行**：依赖图建好后，才开始按顺序执行代码。

所以不存在"执行到某个模块才去导入"的情况。


```js
// main.js
console.log('main 开始');
import './a.js';
import './b.js';
```

即使 `import` 写在 `console.log` 后面，实际输出顺序也是：

```
a 执行
b 执行
main 开始
```

因为 `import` 会被提升（hoist），依赖模块总是先于当前模块执行。

## 缓存机制

> require相同的模块会执行几次？


模块按解析后的完整 URL 存进缓存，同一个 URL 只获取、执行一次，之后的 `import` 或 `import()` 拿到的都是同一个模块命名空间对象。


```js
// a.js
console.log('a 执行了');
export const n = 1;

// main.js
import './a.js';                 // 打印 "a 执行了"
import './a.js';                 // 不打印
const m = await import('./a.js'); // 不打印
```