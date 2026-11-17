#### 1. `window` 对象

除了作为全局作用域的载体，它还提供了一系列全局控制方法：

- **定时器**：`setTimeout`、`setInterval`、`requestAnimationFrame`（严格来说属于 HTML5 规范，但挂载在 `window` 上）。
    
- **窗口尺寸与滚动**：
    
    - `window.innerWidth` / `window.innerHeight`：视口（Viewport）的宽高（包含滚动条）。
        
    - `window.scrollTo({ top: 0, behavior: 'smooth' })`：平滑滚动到指定位置。
        
- **系统弹窗**（会阻塞 JS 主线程，现代项目较少直接使用）：`alert()`、`confirm()`、`prompt()`。