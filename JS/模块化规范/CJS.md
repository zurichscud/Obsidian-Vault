主要用于服务器端（Node.js 原生支持），文件即模块。

## 1. 核心特点

| 特性 | 说明 |
| --- | --- |
| **同步加载** | 模块在代码执行时立即加载，适用于服务器端环境 |
| **单例模式** | 每个模块首次加载后会被缓存，后续加载直接返回缓存实例 |
| **文件即模块** | 每个文件都是独立模块，拥有私有作用域 |
| **值拷贝导出** | 导出的是值的拷贝，模块内部变化不会影响已导出的值 |

## 2. 基本用法

### 2.1 模块导出

以下示例在 `math.js` 中导出多个方法，给出 `module.exports` 与 `exports` 两种写法：

```js
// math.js - 导出多个方法
function add(a, b) {
  return a + b;
}
function subtract(a, b) {
  return a - b;
}

// 方式一：使用 module.exports
module.exports = {
  add,
  subtract
};

// 方式二：使用 exports（添加属性）
exports.add = add;
exports.subtract = subtract;
```

### 2.2 模块引入

在 `app.js` 中用 `require()` 引入该模块并使用其导出的方法：

```js
// app.js
const math = require('./math');
console.log(math.add(2, 3));      // 输出: 5
console.log(math.subtract(5, 3)); // 输出: 2
```

### 2.3 `exports` 与 `module.exports` 的关系

`exports` 是指向 `module.exports` 初始内存地址的引用（快捷别名），而最终被导出并被 `require()` 接收的，永远只有 `module.exports`。

```js
// 初始状态
exports === module.exports // true（指向同一对象）

// 正确用法
exports.myFunction = function() {}; // ✅ 添加属性

// 错误用法  
exports = { myFunction: function() {} }; // ❌ 重新赋值，切断引用关系
module.exports = { myFunction: function() {} }; // ✅ 正确替换导出对象
```

## 3. 模块加载机制

### 3.1 加载流程

1. **路径解析**：根据 `require()` 参数解析路径
   - 核心模块（如 `fs`、`http`）直接加载
   - 相对路径（`./math`）查找文件
   - 第三方模块从 `node_modules` 查找
2. **文件定位**：按顺序尝试 `.js` → `.json` → `.node`
3. **编译执行**：编译并执行模块代码
4. **缓存模块**：加载结果被缓存，后续 `require()` 直接返回缓存

### 3.2 模块缓存

下面的示例验证缓存行为：两次 `require()` 得到同一实例，计数状态在两者之间共享：

```js
// counter.js
let count = 0;
exports.increment = function() {
  count++;
  return count;
};

// app.js
const counter1 = require('./counter');
const counter2 = require('./counter');

console.log(counter1.increment()); // 输出: 1
console.log(counter2.increment()); // 输出: 2（共享同一实例）
console.log(counter1 === counter2); // true
```
