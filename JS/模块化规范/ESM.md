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

// main.js - 导入时可以任意命名，不需要加花括号
import myLogger from './logger.js';
```

## 3. 动态导入

`import()` 函数可以在运行时调用，返回一个 `Promise`，常用于路由懒加载或条件按需加载：

```js
async function loadChart() {
  const { renderChart } = await import('./chart.js');
  renderChart();
}
```

## 4. 模块转发（Re-export / Barrel Export）

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
