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



CJS 是**执行到 `require` 那一行才加载**，边执行边加载。


```js
// main.js
console.log('main 开始');
require('./a.js');
console.log('main 中间');
require('./b.js');
console.log('main 结束');
```

输出顺序：

```
main 开始
a 执行
main 中间
b 执行
main 结束
```

`require` 是**同步**的：读文件、编译、执行完这个模块，才会返回，后面的代码才能继续。

所以：

- **CJS**：`require` 写在哪、什么时候执行，就在那时加载。可以放在 `if` 里、函数里，也可以用变量拼路径。
- **ESM 静态 `import`**：先全部加载，再执行，不受书写位置影响。

这也是 CJS 无法做 Tree Shaking 的原因：不执行代码，就不知道会 `require` 什么。