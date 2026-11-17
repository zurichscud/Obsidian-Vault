`window.navigator`（可简写为 `navigator`）用来提供**浏览器客户端及运行设备的识别信息**，同时也是现代 Web 硬件与系统级能力（剪贴板、地理位置、媒体设备、蓝牙、Service Worker 等）的统一入口。这些能力以 `navigator` 子对象的形式挂载。

## 1. 环境与设备识别属性（只读）

| 属性                       | 示例返回值 / 说明                                             | 常见用途                                                          |
| ------------------------ | ------------------------------------------------------ | ------------------------------------------------------------- |
| `userAgent`              | `"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)..."` | 浏览器用户代理字符串，用于粗略识别操作系统、浏览器内核或 App 内置 WebView                   |
| `userAgentData`          | `{ brands: [...], mobile: false, platform: "macOS" }`  | 现代替代方案。传统 `userAgent` 存在历史伪装且正逐步被浏览器冻结精简，Chromium 系推荐使用该结构化对象 |
| `language` / `languages` | `"zh-CN"` / `["zh-CN", "en-US", "ja"]`                 | 获取用户浏览器的首选语言及语言偏好列表                                           |
| `onLine`                 | `true` / `false`                                       | 判断设备当前是否连接网络（可配合 `window` 的 `online` / `offline` 事件实现断网提示）    |
| `cookieEnabled`          | `true` / `false`                                       | 检测当前浏览器是否启用了 Cookie                                           |
| `hardwareConcurrency`    | `8`                                                    | 获取设备逻辑 CPU 核心数，常用于决定开启多少个 `Web Worker` 线程进行并行计算               |
| `maxTouchPoints`         | `0`（桌面端）或 `5`（触屏设备）                                    | 判断设备是否支持多点触控                                                  |

## 2. 剪贴板操作

`navigator.clipboard` 是新标准接口，返回 `Promise`。下面的代码演示写入文本与读取文本两个操作。

```js
// 写入文本到系统剪贴板
await navigator.clipboard.writeText('复制这段内容');

// 读取系统剪贴板文本（首次会弹出浏览器权限确认框）
const text = await navigator.clipboard.readText();
```

## 3. 地理位置

`navigator.geolocation` 用于获取用户经纬度坐标，需用户明确授权。下面的代码调用 `getCurrentPosition`，成功时打印经纬度，失败时打印错误信息。

```js
navigator.geolocation.getCurrentPosition(
  (pos) => console.log(pos.coords.latitude, pos.coords.longitude),
  (err) => console.error('获取位置失败:', err.message)
);
```

## 4. 页面关闭前可靠上报

`navigator.sendBeacon()` 在用户关闭标签页或刷新离开时发送埋点/日志数据。普通的 `fetch` / `axios` 请求在页面卸载时容易被浏览器直接取消，而 `sendBeacon` 会在后台异步可靠地把数据发出去，且不阻塞页面卸载。

下面的代码监听 `visibilitychange` 事件，在页面进入隐藏状态时上报离开事件。

```js
window.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    navigator.sendBeacon('/api/analytics', JSON.stringify({ event: 'leave' }));
  }
});
```

## 5. 音视频设备

`navigator.mediaDevices` 是 WebRTC 视频通话、网页扫码、录音的核心入口。下面的代码请求访问摄像头和麦克风。

```js
// 请求访问摄像头和麦克风
const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
```

## 6. 离线缓存与 PWA

`navigator.serviceWorker` 用于注册 Service Worker，实现资源离线缓存、后台同步与消息推送，例如调用 `navigator.serviceWorker.register('/sw.js')`。

## 7. UA

**UA（User-Agent，用户代理）** 是浏览器（或 App、爬虫等 HTTP 客户端）在每次向服务器发送请求时，自动附带在 HTTP 请求头（`User-Agent` 字段）中的一段**身份标识字符串**，在前端 JavaScript 中可以通过 `navigator.userAgent` 读取。
