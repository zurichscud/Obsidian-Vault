SSH（Secure Shell，安全外壳协议）是一种用于远程登录和安全通信的网络协议。

开发者使用 SSH 的常见场景：

1. 远程登录服务器：在本地终端操作 Linux 服务器。
2. 免密登录：通过 SSH 密钥认证，不需要每次输入密码。
3. 文件传输：在本地和服务器之间传输文件。
4. Git 远程操作：通过 SSH 克隆、拉取和推送代码。
5. 远程部署：通过 SSH 执行服务器命令，部署 Node.js、Java 等项目。

## 1. 登录服务器

登录 SSH 命令如下：

```
ssh 用户名@服务器IP
```

例如，以 `root` 用户登录 `81.68.90.136`：

```
ssh root@81.68.90.136
```

SSH 不使用默认的 22 端口时，用 `-p` 指定端口：

```
ssh -p 2222 root@81.68.90.136
```

各参数的含义：

| 参数 | 说明 |
| --- | --- |
| `ssh` | SSH 客户端命令 |
| `-p` | 指定服务器端口 |
| `root` | 远程服务器用户名 |
| `81.68.90.136` | 服务器 IP |

登录后，可以像在服务器本地终端一样执行命令：

```
pwd
ls
cd /www
pm2 list
```

退出远程连接：

```
exit
```

## 2. 密钥认证

SSH 有多种身份认证方式，最常见的是两种：

- 密码认证（Password Authentication）
- 公钥认证（Public Key Authentication）

开发中通常推荐使用公钥认证。
> **谁想连对方，就把自己的公钥放到对方的 `authorized_keys` 里**

![[Pasted image 20261109151950.png]]
## 3. 配置文件

经常连接服务器时，每次输入 IP、用户名和端口比较麻烦。

SSH 提供了一个客户端配置文件：

```
~/.ssh/config
```

例如，配置一个名为 `my-server` 的连接：

```
Host my-server
    HostName 81.68.90.136
    User root
    Port 22
    IdentityFile ~/.ssh/id_ed25519
```

配置后只需要：

```
ssh my-server
```

就可以连接服务器。

字段说明：

| 配置 | 含义 |
| --- | --- |
| `Host` | 自定义连接名称 |
| `HostName` | 服务器 IP 或域名 |
| `User` | 登录用户名 |
| `Port` | SSH 端口 |
| `IdentityFile` | 指定使用的私钥 |

有多台服务器时，可以配置多个 `Host`：

```
Host test-server
    HostName 81.68.90.136
    User root
    IdentityFile ~/.ssh/id_ed25519

Host prod-server
    HostName example.com
    User root
    IdentityFile ~/.ssh/id_ed25519
```

## 4. 文件传输

SSH 不仅能远程登录，还能安全传输文件，常用命令是 `scp`。

### 4.1 本地上传到服务器

把本地文件 `app.js` 上传到服务器的 `/www/app/` 目录：

```
scp ./app.js root@81.68.90.136:/www/app/
```

### 4.2 下载服务器文件到本地

把服务器上的 `/www/app/app.js` 下载到本地当前目录：

```
scp root@81.68.90.136:/www/app/app.js ./
```

### 4.3 上传整个目录

用 `-r` 递归上传 `dist` 目录：

```
scp -r ./dist root@81.68.90.136:/www/app/
```

已经配置了 SSH `Host` 别名时，可以直接使用别名：

```
scp -r ./dist my-server:/www/app/
```
