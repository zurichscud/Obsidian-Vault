**Promise** 是 JavaScript 中用于表示**异步操作最终完成或失败及其结果值**的对象。它的核心作用是将异步操作规范化为一个状态机，并通过链式调用解决回调地狱（Callback Hell），同时与事件循环的**微任务队列**深度绑定。

## 1. 核心机制：单向不可逆的状态机

![[Pasted image 20261111114011.png]]

每个 Promise 实例都处于以下三种状态之一，且**状态一旦改变就永久凝固，无法再次修改**：

1. **`pending`（进行中）**：初始状态。调用 `new Promise(executor)` 时，传入的 `executor` 函数会**立即同步执行**。
2. **`fulfilled`（已成功）**：调用 `resolve(value)` 后转入此状态（前提是 `value` 不是另一个待定的 Promise），实例内部保存结果值 `value`。
3. **`rejected`（已失败）**：调用 `reject(reason)`，或在 `executor` 中同步抛出未捕获异常（`throw new Error()`）时转入此状态，保存错误原因 `reason`。

## 2. 基础用法

### 2.1 创建 Promise

`new Promise(executor)` 用来创建实例，异步操作完成后由 `executor` 调用 `resolve` 或 `reject` 决定最终状态：

```js
const promise = new Promise((resolve, reject) => {
  // 异步操作
  setTimeout(() => {
    const success = true;
    if (success) {
      resolve('操作成功'); // 状态变为 fulfilled
    } else {
      reject('操作失败');  // 状态变为 rejected
    }
  }, 1000);
});
```

### 2.2 消费 Promise

下面的示例依次挂上 `.then()`、`.catch()` 和 `.finally()` 来消费这个 Promise：

```js
promise
  .then(result => {
    console.log('成功:', result);
    return result + ' 处理结果';
  })
  .then(processedResult => {
    console.log('进一步处理:', processedResult);
  })
  .catch(error => {
    console.error('失败:', error);
  })
  .finally(() => {
    console.log('无论成功失败都会执行');
  });
```

## 3. 链式调用与返回值透传

`.then(onFulfilled, onRejected)`、`.catch(onRejected)` 和 `.finally(onFinally)` 每次调用都会**返回一个全新的 Promise 实例**。这也是状态本身不可变、却能改变后续链条状态的根本原因。

### 3.1 then 方法

下面的写法把多个 `.then()` 串联起来，最后用 `.catch()` 收尾：

```js
promise
  .then(onFulfilled, onRejected)
  .then(...)
  .catch(...);
```

**特点**：

- `then` 可以链式调用
- 前一个 `then` 的返回值会作为下一个 `then` 的输入
- 返回一个**新的 Promise**
### 3.2 catch 方法

`catch` 既可单独使用，也可与 `then` 的第二个回调配合，并且能捕获链中任意位置抛出的错误：

```js
// 方式一：只捕获错误
promise.catch(error => {...});

// 方式二：同时处理成功和失败
promise.then(
  value => {...},
  error => {...}
);

// 注意：catch 会捕获链中任何位置的错误
promise
  .then(() => { throw new Error('then 1 报错'); })
  .then(() => { throw new Error('then 2 报错'); })
  .catch(error => console.error(error.message)); // 捕获第一个错误
```

### 3.3 新 Promise 的状态与返回值

**新 Promise 的状态由当前回调函数的执行结果决定：**

1. **返回一个普通值（包括 `undefined`）**：新 Promise 状态变为 `fulfilled`，值为该返回值。哪怕这是在 `.catch()` 中返回的，后续也会进入下一个 `.then()`。
2. **返回一个新的 Promise**：新 Promise 的状态和结果与返回的这个 Promise 完全一致（自动解包，不会产生嵌套的 Promise）。
3. **抛出异常（`throw err`）**：新 Promise 状态变为 `rejected`，错误向后传递，直到遇到下一个 `.catch()` 或 `onRejected`。
4. **值穿透（未传入回调函数）**：如果 `.then()` 中没有传函数（例如 `.then(null)`），上一个 Promise 的状态和值会原封不动地透传给下一个链条节点。

前三种情况在代码中的表现如下：

```js
// 1. 返回普通值：自动包装为 Promise.resolve(value)
Promise.resolve(1)
  .then(value => value + 1) // 返回 2，包装为 Promise.resolve(2)
  .then(value => console.log(value)); // 2

// 2. 返回 Promise：等待该 Promise 状态
Promise.resolve(1)
  .then(value => Promise.resolve(value + 1))
  .then(value => console.log(value)); // 2

// 3. 抛出错误：自动包装为 Promise.reject(error)
Promise.resolve(1)
  .then(value => { throw new Error('出错了'); })
  .catch(error => console.error(error.message)); // 出错了
```

下面的示例演示错误向下穿透、被 `.catch()` 捕获后返回普通值、再由下一个 `.then()` 继续执行的过程：

```js
Promise.reject(new Error('初始错误'))
  .then(res => console.log('不会执行')) // 错误向下穿透
  .catch(err => {
    console.log('捕获到:', err.message);
    return '已修复'; // 返回普通值，新 Promise 变为 fulfilled
  })
  .then(res => {
    console.log('继续执行:', res); // 输出: "继续执行: 已修复"
  });
```


## 4. 静态方法

### 4.1 Promise.resolve / reject

`Promise.resolve` 与 `Promise.reject` 直接创建已敲定的 Promise：

```js
// 创建已成功的 Promise
const resolved = Promise.resolve('成功');
resolved.then(value => console.log(value));

// 创建已失败的 Promise
const rejected = Promise.reject('失败');
rejected.catch(error => console.error(error));
```

### 4.2 Promise.all（全部成功）

并行执行多个 Promise，全部成功才返回：

```js
// 并行执行多个 Promise，全部成功才返回
const promise1 = fetch('/api/data1');
const promise2 = fetch('/api/data2');
const promise3 = fetch('/api/data3');

Promise.all([promise1, promise2, promise3])
  .then(([data1, data2, data3]) => {
    console.log('全部成功:', data1, data2, data3);
  })
  .catch(error => {
    console.error('有失败:', error); // 任一失败立即返回
  });
```

**特点**：

- 所有 Promise 并行执行
- **全部成功**才进入 `.then`
- **任一失败**立即进入 `.catch`
- 结果顺序与输入顺序一致

### 4.3 Promise.race（竞速）

返回最先完成（**无论成功失败**）的 Promise 结果：

```js
// 返回最先完成（无论成功失败）的 Promise 结果
const slow = new Promise(resolve => setTimeout(() => resolve('慢'), 1000));
const fast = new Promise(resolve => setTimeout(() => resolve('快'), 500));

Promise.race([slow, fast])
  .then(result => console.log(result)); // 输出 "快"（500ms 后）
```

### 4.4 Promise.allSettled（全部完成）

等待所有 Promise 完成，无论成功失败：

```js
// 等待所有 Promise 完成，无论成功失败
const promises = [
  Promise.resolve('成功'),
  Promise.reject('失败'),
  Promise.resolve('成功')
];

Promise.allSettled(promises)
  .then(results => {
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        console.log('成功:', result.value);
      } else {
        console.log('失败:', result.reason);
      }
    });
  });
```

### 4.5 Promise.any（任一成功）

返回最先成功的 Promise，全部失败才 reject：

```js
// 返回最先成功的 Promise，全部失败才 reject
const promises = [
  Promise.reject('失败1'),
  Promise.resolve('成功2'),
  Promise.reject('失败3')
];

Promise.any(promises)
  .then(value => console.log(value)) // 成功2
  .catch(error => console.error('全部失败'));
```


##  Promise 与 async/await

只要在函数声明前加上 `async`，JavaScript 引擎会自动把函数内部所有的 `throw` 包装成 `Promise.reject()`，把所有的 `return` 包装成 `Promise.resolve()`：

```js
// async/await 是 Promise 的语法糖
async function fetchData() {
  const response = await fetch('/api/data');
  const data = await response.json();
  return data;
}

// 等价于
function fetchData() {
  return fetch('/api/data')
    .then(response => response.json());
}
```

## Example

### Promise.resolve/rejected

`Promise.resolve()` 和 `Promise.reject()` 的核心价值在于“快速将同步的值或错误包装为标准的 Promise 对象”，从而保证函数的返回值类型一致，或主动介入 Promise 链条的控制流。

```js
const userCache = new Map();

function fetchUser(userId) {
  // 命中同步缓存：直接用 Promise.resolve 包装成已成功的 Promise 返回
  if (userCache.has(userId)) {
    return Promise.resolve(userCache.get(userId));
  }

  // 未命中缓存：发起真正的异步网络请求（本身返回 Promise）
  return fetch(`/api/users/${userId}`)
    .then(res => res.json())
    .then(data => {
      userCache.set(userId, data);
      return data;
    });
}

// 调用方体验完全一致，无需关心数据来自内存还是网络
fetchUser(101).then(user => console.log(user));
```


### async/await

- 未使用语法糖

```js
function uploadFile(file) {
  if (!file) {
    return Promise.reject(new Error('文件不能为空'));
  }
  if (file.size > 10 * 1024 * 1024) {
    return Promise.reject(new Error('文件大小不能超过 10MB'));
  }

  // 校验通过，再执行真正的上传逻辑
  const formData = new FormData();
  formData.append('file', file);
  return fetch('/api/upload', { method: 'POST', body: formData });
}

uploadFile(null).catch(err => console.error(err.message)); // 输出: 文件不能为空
```

- 使用语法糖

```js
// 加上 async 关键字
async function uploadFile(file) {
  if (!file) {
    // ✅ 在 async 函数里，throw 会被引擎自动转换为 return Promise.reject(...)
    throw new Error('文件不能为空'); 
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('文件大小不能超过 10MB');
  }

  const formData = new FormData();
  formData.append('file', file);
  return fetch('/api/upload', { method: 'POST', body: formData });
}

// ✅ 正常输出: 文件不能为空
uploadFile(null).catch(err => console.error(err.message));
```

在现代业务代码里，**直接给 `uploadFile` 加 `async` 然后用 `throw` 就是最推荐的标准写法**。