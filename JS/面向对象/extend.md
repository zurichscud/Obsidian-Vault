---
title: 继承
---

## 1. 类的继承

子类通过 `extends` 继承父类。如果子类定义了 `constructor`，**必须**在访问 `this` 之前调用 `super()`。

```js
class Admin extends User {
  constructor(name, permissions) {
    super(name, 'Admin'); // 调用父类的 constructor(name, role)
    this.permissions = permissions;
  }

  // 重写父类方法
  sayHi() {
    super.sayHi(); // 可用 super 调用父类方法
    console.log(`Permissions: ${this.permissions.join(', ')}`);
  }
}

const admin = new Admin('Bob', ['read', 'write']);

admin.sayHi();
```

## 2. 与原型链的底层对应关系

虽然写的是 `class`，但底层依然是 JavaScript 的原型继承：

| **Class 语法**     | **底层原型对应机制**                                           |
| ---------------- | ------------------------------------------------------ |
| `class User`     | 定义构造函数 `function User() {...}`                         |
| 类构造体内的普通方法       | 挂载在 `User.prototype` 上（所有实例共享）                         |
| `static` 静态方法/属性 | 直接挂载在函数对象本身上，例如 `User.sayHi`                           |
| `extends` 继承     | 建立原型链关联：`Child.prototype.__proto__ = Parent.prototype` |

## 3. 方法重写

在子类中声明一个与父类同名的方法，即可实现重写。

```js
class Animal {
  makeSound() {
    console.log('Some generic sound');
  }
}

class Dog extends Animal {
  // 重写父类的 makeSound 方法
  makeSound() {
    console.log('Woof! Woof!');
  }
}

const dog = new Dog();

dog.makeSound(); // 输出: Woof! Woof!
```

如果不想完全抹去父类的方法，而是想在父类逻辑的基础上**追加功能**，可以通过 `super.methodName()` 调用父类被覆盖的方法：

```js
class BankAccount {
  withdraw(amount) {
    console.log(`取款: $${amount}`);
  }
}

class FeeBankAccount extends BankAccount {
  withdraw(amount) {
    // 1. 先执行父类的取款逻辑
    super.withdraw(amount);

    // 2. 追加子类特有的扣手续费逻辑
    console.log(`扣除手续费: $1`);
  }
}

const account = new FeeBankAccount();

account.withdraw(100);

// 输出:
// 取款: $100
// 扣除手续费: $1
```

## 4. super

### 4.1 作为函数调用

当 `super` 作为函数调用时，代表**父类的构造函数**。

**使用场景**：只能在子类的 `constructor` 中调用。

**核心规则**：子类构造函数中**必须**先调用 `super()`，才能使用 `this` 关键字，否则会抛出 `ReferenceError`。

```js
class Parent {
  constructor(name) {
    this.name = name;
  }
}

class Child extends Parent {
  constructor(name, age) {
    // 必须在使用 this 之前调用 super()
    super(name); // 等同于 Parent.call(this, name)

    this.age = age;
  }
}

const kid = new Child('Xiao Ming', 10);

console.log(kid.name); // 'Xiao Ming'
```

### 4.2 子类 `this` 的由来

在 JavaScript（ES6+）的类继承中，**必须使用 `super`** 的根本原因在于子类自己的 `this` 对象必须先通过父类的构造函数“塑造”并生成。

1. **先由父类创建实例对象 `this`**（因为父类最清楚自己有哪些私有属性和底层构造逻辑）。
2. 子类在 `super()` 返回后再对这个 `this` 进行加工和修饰。

因此，**如果不调用 `super()`，子类就根本没有 `this` 对象**。如果在调用 `super()` 之前使用 `this`，JavaScript 引擎会直接抛出 `ReferenceError`。

```js
class Parent {
  constructor() {
    // 1. 父类构造函数负责生成基础实例对象 this
    this.isParent = true;
  }
}

class Child extends Parent {
  constructor(age) {
    // 此时执行环境里还没有 this！
    // console.log(this); // ❌ 报错：ReferenceError: Must call super constructor in derived class before accessing 'this'

    super(); // 2. 调用 super() 继承父类的 this

    // 3. 此时 this 正式存在，可以进一步扩展子类属性
    this.age = age;
  }
}
```

### 4.3 必须先调用父类构造函数的原因

1. **保证继承的完整性与安全性**

   父类可能在 `constructor` 中初始化重要的内部状态或私有属性。如果不强制要求调用 `super()`，开发者很容易忘记初始化父类，导致子类实例在使用继承来的方法时因缺少底层状态而出错。

2. **与 OOP 面向对象语言标准对齐**

   Java、C#、TypeScript 等语言均严格遵循“构造子类前先构造父类”的逻辑。ES6 规范这一行为，让 JavaScript 的 Class 语法更符合主流面向对象设计的直觉。

### 4.4 什么时候可以不写 `super()`

**子类没有显式声明 `constructor`**：如果你在子类中不写 `constructor`，JS 引擎会自动为你补全包含 `super(...args)` 的构造函数。

```js
// 你写的代码：
class Child extends Parent {}

// 引擎自动解析成的代码：
class Child extends Parent {
  constructor(...args) {
    super(...args);
  }
}
```

**基类（不是子类）**：没有使用 `extends` 关键字继承其他类的独立类，不需要也不允许调用 `super()`。

### 4.5 为什么不自动调用 `super()`

既然 JS 引擎在你不写 `constructor` 时会自动补充 `super(...args)`，那为什么在开发者**自定义了 `constructor` 时，不干脆默认在第一行自动帮我们调一次 `super()`** 呢？

自动调用的最大前提是：JS 引擎知道该给父类传什么参数。但绝大多数继承场景下，**子类接收的参数和父类需要的参数并不完全一致，甚至需要加工处理**。

```js
class User {
  constructor(fullName) {
    this.name = fullName;
  }
}

class Student extends User {
  constructor(firstName, lastName, grade) {
    // 💡 引擎根本无法猜到要将 firstName 和 lastName 拼接后传给父类！
    super(`${firstName} ${lastName}`);

    this.grade = grade;
  }
}
```
