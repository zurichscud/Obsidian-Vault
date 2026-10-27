[REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) 是一个 VS Code 扩展，让你直接在编辑器里发送 HTTP 请求，用纯文本文件（`.http` / `.rest`）描述接口，无需打开 Postman。

## 1. 快速上手

1. VS Code 扩展市场安装 **REST Client**
2. 新建 `.http` 文件，写一个请求
3. 请求上方会浮现 **Send Request** 链接（CodeLens），点击它
4. 响应在右侧分栏展示（状态码、耗时、响应头、响应体）

一个最简单的请求：

```http
GET http://localhost:3000/health
```

同一个文件可以放任意多个请求，用 `###`（三个以上 `#`）分隔。

## 2. 请求语法

### 2.1 请求结构

完整结构由四部分组成：**请求行 → 请求头 → 空行 → 请求体**。下例标注了各部分的对应位置：

```http
### 请求名（可选）

# @name createArticle          ← 命名请求，供其他请求引用（可选）
POST {{baseUrl}}/api/articles   ← 请求行：方法 + URL
Content-Type: application/json  ← 请求头，紧跟请求行
Accept: application/json

{                               ← 空行之后是请求体
  "title": "标题"
}
```

常见的语法细节如下：

| 场景      | 写法                     |
| ------- | ---------------------- |
| 省略方法    | 只写 URL，默认 `GET`        |
| 查询参数换行  | 参数行以 `?` 或 `&` 开头      |
| 分隔请求    | `###`（`###` 后的文字是请求备注） |
| 注释      | `#` 或 `//` 开头          |
| 多个同名请求头 | 直接写多行，自动合并             |

### 2.2 文件上传

`<` 从文件读内容，变量不解析；`<@` 读取并解析变量；可指定编码如 `<@latin1`。下例通过 `<` 上传本地图片：

```http
POST {{baseUrl}}/api/upload
Content-Type: multipart/form-data; boundary=WebAppBoundary

--WebAppBoundary
Content-Disposition: form-data; name="file"; filename="cover.png"
Content-Type: image/png

< ./cover.png
--WebAppBoundary--
```

### 2.3 整个请求体来自文件

整个请求体也可以直接来自文件：

```http
POST {{baseUrl}}/api/articles
Content-Type: application/json

< ./data/article.json
```

## 3. 变量系统

变量统一用 `{{变量名}}` 引用。**优先级：请求变量 > 文件变量 > 环境变量**。

### 3.1 环境变量

环境变量跨文件共享，推荐放 `baseUrl` 这类配置，定义在 `.vscode/settings.json`（本项目已配好）：

```json
{
  "rest-client.environmentVariables": {
    "$shared": {},                        // 所有环境共享的变量
    "dev": { "baseUrl": "http://localhost:3000" },
    "server": { "baseUrl": "http://124.221.210.219:3000" }
  }
}
```

切换环境：点击**底部状态栏**的环境名（默认显示 `No Environment`）。

### 3.2 文件变量

文件变量仅当前文件生效：

```http
@token = eyJhbGciOiJIUzI1NiIs...
@pageSize = 10

### 
GET {{baseUrl}}/api/articles?pageSize={{pageSize}}
Authorization: Bearer {{token}}
```

## 4. 请求链式调用

用 `# @name` 给请求命名，后续请求可以直接从它的响应里取值（最典型的场景：登录后拿 token）。下例先登录，再用上一步返回的 token 发起请求：

```http
### 登录
# @name login
POST {{baseUrl}}/api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "123456"
}

### 用上一步的 token 请求
# @name profile
GET {{baseUrl}}/api/me
Authorization: Bearer {{login.response.body.$.data.token}}
```

### 4.1 引用语法

引用语法：`{{请求名.response|request.body|headers.取值路径}}`。常用的取值写法如下：

| 写法                                      | 取什么                          |
| --------------------------------------- | ---------------------------- |
| `{{login.response.body.$.data.token}}`  | 响应体 JSON（`$` 后是 JSONPath）    |
| `{{login.response.headers.Set-Cookie}}` | 某个响应头                        |
| `{{login.response.status}}`             | 状态码                          |

> 注意 `$` 前的点：`body.$.data.token` 中 `$` 表示 JSON 根节点。

## 5. 设置

`settings.json` 里的 `rest-client.*` 配置：

```json
{
  // 环境变量
  "rest-client.environmentVariables": {
    "$shared": {},
    "dev": { "baseUrl": "http://localhost:3000" }
  },

  // 请求超时（毫秒，0 为不限制）
  "rest-client.timeoutinmilliseconds": 0,

  // 重定向跟随次数
  "rest-client.followredirect": 3,

  // 响应面板显示内容：full / headers / body / exchange
  "rest-client.previewOption": "full",

  // 记住 Cookie 供后续请求使用
  "rest-client.rememberCookiesForSubsequentRequests": true,

  // 所有请求的公共头
  "rest-client.defaultHeaders": {
    "User-Agent": "vscode-restclient"
  }
}
```
