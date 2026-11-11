![[Pasted image 20261111113414.png]]
## 一、为什么需要事件循环？

### JavaScript 的单线程特性

JavaScript 是单线程语言，意味着同一时间只能执行一个任务。

## 组件
### 1. 调用栈（Call Stack）

- 后进先出（LIFO）的数据结构
- 用于跟踪函数调用位置
- 同步代码按顺序执行，执行完立即出栈

### 2. 堆（Heap）

- 存储对象、数组等复杂数据结构
- 内存分配区域

### 3. 任务队列（Task Queues）

分为两类：

- **宏任务队列（Macrotask Queue）**：存放宏任务回调
- **微任务队列（Microtask Queue）**：存放微任务回调

### 4. Web API/Node API

- 浏览器提供的异步 API（setTimeout、fetch 等）
- Node.js 通过 libuv 提供的异步 I/O API

## 宏任务和微任务

JavaScript 中常见的任务分为两类：

宏任务（Task）

- `setTimeout`
    
- `setInterval`
    
- DOM 事件回调
    
- 整体 Script 执行
    
- `MessageChannel`
    

微任务（Microtask）

- `Promise.then`
    
- `Promise.catch`
    
- `Promise.finally`
    
- `queueMicrotask`
    
- `MutationObserver`


