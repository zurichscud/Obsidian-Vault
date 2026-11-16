## 1. 它是做什么的

`closest()` 是 DOM 元素的方法，作用是：**从当前元素开始，沿着父级一路向上查找，返回第一个匹配指定选择器的元素**，找不到就返回 `null`。

下面的示例是它的基本调用形式：

```js
const result = element.closest(selector);
```

查找顺序：先检查**元素自己**，不匹配再检查父元素，再检查祖父元素，一直找到 `document` 的根为止。

## 2. 基本用法

下面的 HTML 是本节示例用到的页面结构：

```html
<ul id="list" class="menu">
  <li class="item">
    <span class="text">第一项</span>
  </li>
</ul>
```

以 `.text` 这个 `span` 为起点，下面的示例分别演示了四种查找结果：

```js
const span = document.querySelector('.text');

span.closest('.item');   // <li class="item">...</li>
span.closest('ul');      // <ul id="list">...</ul>
span.closest('.text');   // span 自己（会先检查自己）
span.closest('.xxx');    // null（向上都没找到）
```

要点：

- **包含自身**：如果元素自己就匹配，直接返回自己。
- **只往上找**：只查祖先链，不会查子元素或兄弟元素。
- **参数是 CSS 选择器**：类名、标签名、属性、组合选择器都可以，例如 `closest('div.card[data-id]')`。
- 返回的是**单个元素**，不是集合。

## 3. 最常见的用途：事件委托

这正是事件委托代码里用到 `closest()` 的原因。点击事件的 `e.target` 是**最内层**被点击的元素，可能是 `li` 里面的 `span`、`img`、`b` 之类的子标签，直接判断 `e.target` 是不是 `li` 会漏掉这些情况。

下面的示例在 `list` 上委托点击，并从 `e.target` 向上查找最近的 `li`：

```js
list.addEventListener('click', (e) => {
  // 错误：点在 li 里的 span 上时，target 是 span，不是 li
  // if (e.target.tagName === 'LI') { ... }

  // 正确：从 target 往上找最近的 li
  const item = e.target.closest('li');
  if (!item) return;                // 点在了 ul 的空白处
  if (!list.contains(item)) return; // 防止匹配到 list 外层的同名元素
  console.log('点击了：', item.textContent);
});
```

这里有两层判断，各有原因：

- `if (!item) return`：点击位置不在任何 `li` 内，`closest` 返回 `null`。
- `list.contains(item)`：`closest` 会一直向上找到根，如果 `list` 本身嵌套在另一个 `li` 里，可能匹配到 `list` 外面的 `li`，需要排除。
