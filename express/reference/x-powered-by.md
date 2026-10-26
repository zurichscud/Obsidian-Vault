## 1. 关闭 X-Powered-By

Express 默认会设置 `X-Powered-By: Express` 响应头，向客户端暴露服务端使用的框架/技术栈。

攻击者可据此识别技术栈，针对性地利用已知漏洞或构造攻击（比如 Express 特定版本的已知问题）。

关闭该响应头的配置如下：

```js
app.disable('x-powered-by');
```

