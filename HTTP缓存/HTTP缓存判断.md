

``` mermaid
flowchart TD
    Start[发起资源请求] --> CheckCache{本地是否有缓存副本?}
    
    CheckCache -- 无缓存 --> SendReq[向服务器发起完整请求 200 OK]
    SendReq --> SaveCache[存入本地缓存并记录响应头信息]
    
    CheckCache -- 有缓存 --> CheckFresh{是否命中强缓存?<br/>max-age 未过期 且 无 no-cache}
    
    CheckFresh -- 命中强缓存 --> FromCache["读取本地缓存 200 OK<br/>(from memory / disk cache)<br/>耗时 ~0ms，无网络请求"]
    
    CheckFresh -- 未命中/已过期 --> SendCondReq["发起协商缓存条件请求<br/>携带 If-None-Match / If-Modified-Since"]
    
    SendCondReq --> ServerCheck{服务端判断<br/>资源是否发生变更?}
    
    ServerCheck -- 未变更 --> Return304["返回 304 Not Modified<br/>(不带响应体)"]
    Return304 --> ReuseLocal["复用本地旧缓存<br/>更新缓存元数据(如新鲜度)"]
    
    ServerCheck -- 已变更 --> Return200["返回全新内容 200 OK<br/>(带最新响应体与新 ETag)"]
    Return200 --> UpdateCache["覆盖更新本地缓存"]
```

