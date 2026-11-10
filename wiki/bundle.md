---

title: "bundle"

descirption: "打包产物"

---

把多个 JavaScript、CSS、图片等资源文件经过构建工具处理后，合并（或组织）成浏览器可以加载的文件。

开发时：

```

src/

├── main.ts

├── App.tsx

├── Button.tsx

├── utils.ts

└── style.css

```

  

经过 **bundle**：

  

```js

dist/

├── app.js

├── vendor.js

└── style.css

```