---

title: "作用域包"

description: "npm 包名中的 @ 符号"

---

带 `@` 的包叫作用域包，格式为 `@scope/package-name`；不带 `@` 的是普通包。

## 1. 两种形式对比

下面分别安装普通包和作用域包，可以看到两者的包名写法差异。

```sh
# 普通包
npm install lodash
npm install express

# 作用域包
npm install @babel/core
npm install @vue/compiler-sfc
```

## 2. 作用域包的作用

### 2.1 命名空间隔离

普通包的名字是全局共享的，先到先得。比如 `lodash` 这个名字被占了，其他人就无法再用了。

作用域包则把名字限定在某个 scope 内，`@zhangsan/utils` 和 `@lisi/utils` 互不冲突，任何用户/组织都能创建自己的命名空间。

### 2.2 归属标识

scope 通常代表一个组织或官方团队，方便识别包的来源：

- `@babel/*` —— Babel 官方的包
- `@angular/*` —— Angular 官方的包
- `@types/*` —— DefinitelyTyped 维护的 TypeScript 类型定义

## 3. 最佳实践

很多老牌项目（如 `vue`、`react`）早就有普通包名了，而它们的子包、工具包则放在自己的 scope 下（如 `@vue/cli`、`@react-native/*`）。这样既保留了主包名的知名度，又方便统一管理生态内的包。
