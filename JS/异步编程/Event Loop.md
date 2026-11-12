![[Pasted image 20261112154436.png]]

> **执行一个宏任务 → 清空所有微任务 →（浏览器可能渲染）→ 再取下一个宏任务**，如此往复。

## 1. 为什么需要事件循环？

JavaScript 是**单线程**的：同一时刻只能执行一段代码。而网络请求、定时器、用户交互这类任务都需要等待，如果同步等待，页面就会卡死。

事件循环就是让单线程“看起来能并发”的调度机制：耗时操作交给宿主环境（浏览器或 Node.js）处理，完成后再把回调排队，等主线程空闲时执行。

## 2. 核心组成

### 2.1 调用栈（Call Stack）

同步代码的执行场所，后进先出。

### 2.2 宿主 API（Web APIs / libuv）

负责定时器、网络、DOM 事件等异步工作，它们不在 JS 主线程中运行。

### 2.3 任务队列

任务队列分两类：

- **宏任务（Macrotask）**：`setTimeout`、`setInterval`、I/O、UI 事件、`MessageChannel`、`setImmediate`（Node）等。
- **微任务（Microtask）**：`Promise.then/catch/finally`、`queueMicrotask`、`MutationObserver`、`async/await` 中 `await` 之后的代码。

两类任务的语义不同：

> [!note] 宏任务语义
> “让出控制权，稍后再来”

> [!note] 微任务语义
> 当前任务的“收尾延续”

## 3. 执行流程

### 3.1 执行步骤

1. 执行当前宏任务（初始时是整个脚本）里的同步代码，直到调用栈清空。
2. **清空整个微任务队列**（包括执行过程中新产生的微任务）。
3. 如有必要，浏览器进行一次渲染（样式计算、布局、绘制）。
4. 取下一个宏任务，回到第 1 步。

### 3.2 关键规则

**每个宏任务结束后，必须把微任务队列清空，才会进入下一个宏任务。** 所以微任务优先级高于宏任务。

### 3.3 经典案例

下面的代码同时包含同步输出、`setTimeout` 回调与 `Promise.then` 回调：

```js
console.log('1');

setTimeout(() => console.log('2'), 0);

Promise.resolve().then(() => console.log('3'));

console.log('4');
```

输出：`1 → 4 → 3 → 2`

分析：

- `1`、`4` 是同步代码，先执行。
- `setTimeout` 回调进入宏任务队列。
- `Promise.then` 回调进入微任务队列。
- 同步代码结束后先清微任务（输出 `3`），再取宏任务（输出 `2`）。

### 3.4 await/async

下面的代码演示 `await` 前后代码的执行时机：

```js
async function foo() {
  console.log('foo start');
  await bar();               // ① 调用 bar()：同步    ② await：把后面的代码变成微任务
  console.log('foo end');
}
```

1. **`bar()` 的调用是同步的。** `bar` 函数体会立刻执行，直到它自己遇到 `await` 或 `return`。如果 `bar` 是 `async` 函数，里面第一个 `await` 之前的代码也是同步执行的。
2. **`await` 之后的代码是微任务。** `bar()` 返回一个 Promise，`await` 相当于对这个 Promise 调用 `.then`，把 `console.log('foo end')` 作为回调，**等 Promise 完成后以微任务的形式执行**。

> [!note]
> `then` 的回调，在对应的 Promise 变为 settled（fulfilled 或 rejected）的那一刻，才被放入微任务队列。

### 3.5 Promise

下面的代码演示 executor 与 `then` 回调的执行时机：

```js
new Promise(resolve => {            // ① executor：同步，立刻执行
  console.log('promise executor');
  resolve();
}).then(() => {                     // ② then 回调：微任务
  console.log('promise then');
});
```

- **executor**（传给 `new Promise` 的函数）：调用 `new Promise(...)` 的那一刻就立刻执行，和普通函数调用没有区别。
- **`.then` / `.catch` / `.finally` 的回调**：才是微任务。Promise 状态变为完成后，这些回调被放进微任务队列。

## 4. 同步代码属于哪个任务

同步代码本身不是一种任务，它是在某个任务**内部**执行的。同步代码属于**当前正在运行的那个任务**：

### 4.1 归属规则

- 整段 `<script>` 的执行本身就是第一个**宏任务**，里面所有顶层同步代码都在这个宏任务里跑。
- 某个 `setTimeout` 回调里的同步代码，属于这个回调所在的宏任务。
- 某个 `Promise.then` 回调里的同步代码，属于这个回调所在的微任务。

所以常说的“同步 → 微任务 → 宏任务”，其实是一种简化。更准确的说法是：

> 当前宏任务里的同步代码跑完 → 清空微任务队列 → 取下一个宏任务

### 4.2 示例

下面的代码在注释中标出了每行代码所属的任务：

```js
console.log('A');                          // 属于：脚本这个宏任务

setTimeout(() => {
  console.log('B');                        // 属于：定时器回调这个宏任务
  Promise.resolve().then(() => console.log('C'));
}, 0);

Promise.resolve().then(() => {
  console.log('D');                        // 属于：这个微任务
});

console.log('E');                          // 属于：脚本这个宏任务
```

输出：`A → E → D → B → C`

- `A`、`E` 是脚本宏任务里的同步代码。
- `D` 是微任务回调里的代码，虽然它也是“顺序执行”的，但它是在微任务阶段执行的。
- `B` 是下一个宏任务里的同步代码，`C` 是它产生的微任务，要等 `B` 所在的宏任务结束后才执行。

## 5. 综合示例

下面的代码综合了 `async/await`、`Promise` 与 `setTimeout`：

```js
async function foo() {
  console.log('foo start');
  await bar();
  console.log('foo end');   // 相当于 .then 里的微任务
}

async function bar() {
  console.log('bar');
}

console.log('script start');
setTimeout(() => console.log('timeout'), 0);
foo();
new Promise(resolve => {
  console.log('promise executor'); // executor 是同步执行的
  resolve();
}).then(() => console.log('promise then'));
console.log('script end');
```

输出顺序：

```
script start
foo start
bar
promise executor
script end
foo end
promise then
timeout
```
