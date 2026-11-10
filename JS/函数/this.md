---
title: this
---

JS 中的 `this` 是一个在**函数被调用时**才确定的引用，它指向“当前执行上下文的主体”。核心要记住一句话：**`this` 取决于函数怎么被调用，而不是在哪里定义的**（箭头函数除外）。

## 1. 四种绑定规则（优先级从低到高）

**优先级**：`new` > 显式绑定（`bind` / `call` / `apply`）> 隐式绑定 > 默认绑定。

### 1.1 默认绑定：独立函数调用

独立调用函数时，`this` 取默认值：

```js
function foo() {
  console.log(this);
}
foo(); // 非严格模式:window / globalThis;严格模式:undefined
```

### 1.2 隐式绑定：作为对象方法调用

作为对象的方法调用时，`this` 指向“点”前面的对象：

```js
const obj = {
  name: 'Tom',
  say() { console.log(this.name); }
};
obj.say(); // 'Tom',this 指向"点"前面的对象
```

**隐式丢失**是最常见的坑：把方法单独取出，或作为回调传入，`this` 都会丢失。

```js
const fn = obj.say;
fn(); // this 丢失,变成默认绑定,拿不到 name

setTimeout(obj.say, 100); // 同样丢失
```

### 1.3 显式绑定：call / apply / bind

三种显式绑定方式的用法对比：

```js
function say(greet) { console.log(greet + this.name); }
const p = { name: 'Tom' };

say.call(p, 'Hi ');      // 立即调用,参数逐个传
say.apply(p, ['Hi ']);   // 立即调用,参数传数组
const bound = say.bind(p); // 返回新函数,this 永久绑定
bound('Hi ');
```

|方法|是否立即执行|参数传递|返回值|
|---|---|---|---|
|`call(thisArg, a, b)`|是|逐个传|函数的返回值|
|`apply(thisArg, [a, b])`|是|数组(或类数组)|函数的返回值|
|`bind(thisArg, a, b)`|否|逐个传(可预置部分)|**新函数**|
### 1.4 new 绑定：构造调用

用 `new` 调用构造函数时，`this` 指向新创建的实例：

```js
function Person(name) {
  this.name = name; // this 指向新创建的实例
}
const p = new Person('Tom');
```

`new` 的过程：创建空对象 → 链接原型 → 以该对象为 `this` 执行构造函数 → 返回该对象（除非构造函数显式返回了对象）。

## 2. 箭头函数：没有自己的 this

箭头函数不遵守上面的规则，它的 `this` 在**定义时**由外层作用域（词法作用域）决定，且无法被 `call` / `apply` / `bind` 修改。

在方法内部使用箭头函数时，`this` 继承自 `delay`：

```js
const obj = {
  name: 'Tom',
  delay() {
    setTimeout(() => {
      console.log(this.name); // 'Tom',继承自 delay 的 this
    }, 100);
  }
};
```

### 2.1 不要用箭头函数定义对象方法

对象方法写成箭头函数时，`this` 指向外层而不是 `obj`：

```js
const obj = {
  name: 'Tom',
  say: () => console.log(this.name) // this 是外层(模块/全局),不是 obj
};
```

箭头函数也不能用作构造函数（`new` 会报错）。

### 2.2 对象字面量不产生作用域

很多人以为 `{ ... }` 会像函数一样创建一个新的 `this` 环境，**其实不会**。只有函数（普通函数）才会创建 `this` 绑定，对象字面量只是一堆键值对。

所以箭头函数 `say` 往外找 `this` 时，会跳过 `obj`，直接找到 `obj` 所在的那一层：

```js
const obj = {
  name: 'Tom',
  say: () => console.log(this.name)
};
// ↑ 这个箭头函数的外层,就是 obj 所在的"顶层"
```

同一个 `obj` 中，普通方法与箭头方法的对比：

```js
const obj = {
  name: 'Tom',
  say1() { console.log(this.name); },       // 普通函数
  say2: () => console.log(this.name)        // 箭头函数
};

obj.say1(); // 'Tom'   —— 调用时 this = obj(点前面的对象)
obj.say2(); // 不是 Tom —— 定义时 this 就已经定死为外层 this
```

箭头函数的 `this` 是在**定义时**就按词法作用域确定的，之后不管怎么调用（`obj.say2()`、`call`、`bind`），都改变不了。
