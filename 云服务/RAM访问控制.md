## 1. 云账号 AccessKey 的风险

云账号 AccessKey **具有账号的完全权限，且不能做权限控制**。若因保管和使用不当导致云账号 AccessKey 被他人利用，将会对账号资源造成巨大的安全威胁。

![[Pasted image 20261027165327.png]]

因此应使用 RAM 用户 AccessKey，并进行最小化授权。

## 2. 创建用户

![[Pasted image 20261027164507.png]]

### 2.1 获取 AccessKey

创建完成后可得到 accessKeyId 和 accessKeySecret，形如：

```
accessKeyId 123456
accessKeySecret 78901
```

## 3. 新增授权

![[Pasted image 20261027164949.png]]

## 4. 开发

根据 accessKeyId、accessKeySecret 以及所提供的权限进行开发。
