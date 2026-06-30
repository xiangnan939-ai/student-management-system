# Cloudflare Pages 免费部署说明

这个版本已经改成 Cloudflare Pages + Pages Functions + D1。

## 1. 上传到 GitHub

```bash
git init
git add .
git commit -m "Deploy student system to Cloudflare Pages"
git branch -M main
git remote add origin 你的GitHub仓库地址
git push -u origin main
```

不要上传 `node_modules`、`StudentOS_Final.exe`、`server/database.sqlite`，这些已在 `.gitignore` 里忽略。

## 2. 创建 Cloudflare Pages 项目

1. 登录 Cloudflare。
2. 进入 Workers & Pages。
3. Create application。
4. 选择 Pages。
5. Connect to Git。
6. 选择刚才的 GitHub 仓库。

构建配置：

```text
Framework preset: None
Build command: npm run build
Build output directory: client/dist
Root directory: /
```

## 3. 创建 D1 数据库

1. 进入 Cloudflare 的 D1。
2. Create database。
3. 数据库名建议：`student-os-db`。
4. 创建后进入数据库控制台，执行 `migrations/0001_init.sql` 里的 SQL。

## 4. 给 Pages 绑定 D1

进入 Pages 项目：

```text
Settings -> Functions -> D1 database bindings
```

添加绑定：

```text
Variable name: DB
D1 database: student-os-db
```

再重新部署一次 Pages。

## 5. 配置管理员账号

进入 Pages 项目：

```text
Settings -> Environment variables
```

添加：

```text
ADMIN_USER=admin
ADMIN_PASSWORD=你自己的强密码
```

如果不配置，默认仍是 `admin / 123456`，不建议线上使用。修改环境变量后，记得重新部署一次 Pages。

线上登录地址：

```text
https://你的域名/login
```

## 6. 绑定你的域名

推荐把域名 DNS 托管切到 Cloudflare：

1. Cloudflare 添加你的域名。
2. 选择 Free 计划。
3. Cloudflare 会给你两个 nameserver。
4. 去聚域网后台，把域名 DNS 服务器改成 Cloudflare 给你的两个 nameserver。
5. 回 Cloudflare Pages 项目，进入 Custom domains。
6. 添加你的根域名或 `www` 域名。

DNS 生效后，Cloudflare 会自动签发 HTTPS 证书。

## 7. 以后更新网站

本地改代码后：

```bash
git add .
git commit -m "更新网站内容"
git push
```

Cloudflare Pages 会自动重新部署。
