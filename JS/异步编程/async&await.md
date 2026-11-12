`async/await` 是语法糖，让异步代码可以写得像同步代码一样。它不是新的异步机制，底层仍然是 Promise。

## 1. 核心规则

- `async` 函数**一定返回 Promise**。
- `await` 只能在 `async` 函数内部（或模块顶层）使用
- `await`作用是等待一个 Promise 完成并取出结果。
- `await` 后面如果不是 Promise，会被自动包装成 `Promise.resolve(值)`。
- `await` **暂停的只是当前 async 函数**，不会阻塞整个线程；`async`函数外面的代码继续执行。
- `await` 之后的代码，要等 Promise 完成才会放入微任务队列。

下面这段代码对比 `async` 函数与等价的 Promise 写法：

```js
async function foo() {
  return 42;
}
// 等价于
function foo() {
  return Promise.resolve(42);
}

foo().then(v => console.log(v)); // 42
```

如果 `async` 函数里抛出异常，返回的就是一个 rejected 的 Promise：

```js
async function bar() {
  throw new Error("出错了");
}
// 等价于 return Promise.reject(new Error("出错了"))
```

## 2. await 到底做了什么

`await expr` 大致等价于：把后面的代码放进 `expr` 的 `then` 回调里。

下面用两种写法实现同一个 `load` 函数：

```js
// async/await 写法
async function load() {
  const res = await fetch("/api/user");
  const user = await res.json();
  console.log(user);
}

// 等价的 Promise 写法
function load() {
  return fetch("/api/user")
    .then(res => res.json())
    .then(user => {
      console.log(user);
    });
}
```


下面这段代码演示 `await` 之后代码的执行时机：

```js
async function test() {
  console.log("A");
  await null;
  console.log("B"); // 变成微任务
}

console.log("1");
test();
console.log("2");
// 输出：1 A 2 B
```

## 3. 错误处理

用 `try/catch` 捕获，写法和同步代码一致。下面是一个完整的 `load` 函数：

```js
async function load() {
  try {
    const res = await fetch("/api/user");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("请求失败：", err);
    throw err; // 需要的话继续向上抛
  } finally {
    console.log("清理工作");
  }
}
```

## 4. 串行 vs 并行（最重要的性能点）

### 4.1 串行（互相依赖时才这样写）

先取用户，再用用户 ID 取订单，两者有依赖关系：

```js
const user = await getUser();
const orders = await getOrders(user.id); // 依赖 user
```

### 4.2 常见错误：互不依赖却串行

两个请求互不依赖，却写成先后等待：

```js
// 慢：总耗时 = A + B
const a = await fetchA();
const b = await fetchB();
```

### 4.3 正确：并行

用 `Promise.all` 让两个请求同时发出：

```js
// 快：总耗时 = max(A, B)
const [a, b] = await Promise.all([fetchA(), fetchB()]);
```

或者先启动两个请求，再分别等待结果：

```js
const pa = fetchA(); // 立刻开始
const pb = fetchB(); // 立刻开始
const a = await pa;
const b = await pb;
```

### 4.4 循环中的 await

下面这段代码对比循环中串行与并行的写法：

```js
// 串行：一个接一个
for (const id of ids) {
  const data = await fetchItem(id);
  console.log(data);
}

// 并行：同时发出所有请求
const results = await Promise.all(ids.map(id => fetchItem(id)));
```

### 4.5 陷阱：forEach 里用 await 无效

`forEach` 不会等待回调返回的 Promise，下面的写法不会按预期执行：

```js
// 错误：forEach 不会等待回调返回的 Promise
ids.forEach(async id => {
  await fetchItem(id);
});
console.log("这行会先执行，不会等上面完成");

// 正确：用 for...of 或 Promise.all + map
```

### 4.6 并行但要处理部分失败

`Promise.allSettled` 会等全部请求结束，再逐个查看结果：

```js
const results = await Promise.allSettled(ids.map(fetchItem));
results.forEach(r => {
  if (r.status === "fulfilled") console.log(r.value);
  else console.error(r.reason);
});
```

### 4.7 限制并发数

请求量很大时，全部同时发出可能压垮服务器，可以分批。下面按每批 `limit` 个执行：

```js
async function runInBatches(items, limit, worker) {
  const results = [];
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    results.push(...await Promise.all(batch.map(worker)));
  }
  return results;
}

await runInBatches(ids, 5, fetchItem); // 每批 5 个
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

- 使用语法糖

```js
async function fetchUser(userId) {
  // 命中同步缓存：直接返回缓存数据
  if (userCache.has(userId)) {
    return userCache.get(userId)
  }

  // 未命中缓存：发起异步网络请求
  const res = await fetch(`/api/users/${userId}`)
  const data = await res.json()

  // 更新缓存
  userCache.set(userId, data)

  return data
}
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