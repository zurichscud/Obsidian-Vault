**DOM 操作**：用 JavaScript 读取和修改网页内容、结构和样式。DOM 是浏览器把 HTML 解析成的一棵"节点树"，JS 通过它来控制页面。

主要做这几类事：

- **查找元素**：`document.querySelector('.box')`，拿到页面上的某个元素。
- **修改内容**：`el.textContent = '你好'`，改变元素里的文字或 HTML。
- **修改样式和属性**：`el.classList.add('active')`、`el.style.color = 'red'`、`el.setAttribute('href', '...')`。
- **创建和插入元素**：`document.createElement('li')` 创建，`parent.append(li)` 插入页面。
- **删除元素**：`el.remove()`。
- **绑定事件**：`el.addEventListener('click', fn)`，响应用户操作（也就是前面讲的事件对象的来源）。