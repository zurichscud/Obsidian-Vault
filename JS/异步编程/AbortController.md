`AbortController` 是一个"遥控器"，用来中途取消一个正在进行的异步操作（比如 `fetch` 请求）。

## 1. 为什么需要它

`fetch` 发出去后，Promise 本身没有"取消"的功能。但现实中经常要取消：

- 请求太慢，想设置**超时**
- 用户离开了页面，请求没必要继续了
- 搜索框连续输入，**上一次的请求**应该作废

## 3. 最简单的例子

### 3.1 示例代码

下面的示例把信号绑定到请求，并在 1 秒后取消：

```js
const controller = new AbortController();

fetch('/api/slow', { signal: controller.signal })
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => {
    if (err.name === 'AbortError') console.log('请求被取消了');
  });

// 1 秒后取消
setTimeout(() => controller.abort(), 1000);
```

### 3.2 逐行解释

1. `new AbortController()`：创建遥控器，它有两个东西：
    - `controller.signal`：信号对象，**交给 fetch**
    - `controller.abort()`：方法，**你自己调用**来触发取消
2. `{ signal: controller.signal }`：把信号绑定到这次请求
3. `controller.abort()`：触发后，fetch 的 Promise 会 **reject**，错误名为 `AbortError`

## 4. 核心要点

| 概念                  | 作用       | 谁来用             |
| ------------------- | -------- | --------------- |
| `controller`        | 控制端      | 你（调用 `abort()`） |
| `controller.signal` | 信号端      | 传给 fetch（让它监听）  |
| `AbortError`        | 取消后抛出的错误 | 你在 `catch` 里识别它 |

- **一个 controller 只能用一次**：`abort()` 之后它就永久处于"已取消"状态，下次请求要新建一个。
- **取消不代表服务端停止处理**：`abort()` 只是客户端断开连接，服务端可能已经在执行了

## AbortController 是怎么触发的

**核心原理：就是一个简单的"观察者模式"（发布订阅）。** `signal` 本质上是一个事件对象，`fetch` 在内部**监听**它的 `abort` 事件，`controller.abort()` 就是**触发**这个事件。