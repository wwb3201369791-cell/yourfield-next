# Ubuntu 测试服务器部署教程（直接 IP 访问）

这份教程适用于当前 `yourfield-next` 项目在 Ubuntu 服务器上做测试部署。

目标：

- 不绑定域名
- 直接用服务器 IP 访问
- 优先满足测试/验收
- 保留 Payload 后台 `/admin`

仓库结构说明：

- 仓库根目录里有一层 `yourfield-next/`
- 真正的 Next.js + Payload 应用也在这层目录里
- 后续所有 `pnpm` 命令都在 `yourfield-next/` 目录下执行

---

## 1. 服务器准备

建议系统：Ubuntu 22.04 / 24.04

开放端口：

- SSH：22
- 直接 IP 测试：3000
- 如果要走 Nginx：80（可选 443）
- 如果数据库/Meilisearch/Umami 都在同机 Docker 中，一般不需要对外开放 5432 / 7700 / 3002

安装基础软件：

```bash
sudo apt update
sudo apt install -y git git-lfs curl nginx docker.io docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
git lfs install
```

安装 Node.js 20 和 pnpm：

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
corepack enable
corepack prepare pnpm@10.28.2 --activate
```

安装 PM2：

```bash
sudo npm i -g pm2
```

重新登录一次 SSH，让 docker 组权限生效，或者临时用 `newgrp docker`。

---

## 2. 拉代码

```bash
cd /var/www
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www

git clone https://github.com/wwb3201369791-cell/yourfield-next.git
cd yourfield-next
git lfs pull
cd yourfield-next
```

说明：

- 克隆后仓库根目录会是 `/var/www/yourfield-next`
- 应用目录是 `/var/www/yourfield-next/yourfield-next`
- 图片、视频、CMS 上传目录通过 Git LFS 管理；如果没有执行 `git lfs pull`，页面可能只拿到 LFS 指针文件，表现为图片/视频无法正常显示

如果你已经把仓库放到了别的目录，只要先在仓库根目录执行 `git lfs pull`，再进入 `package.json` 所在的 `yourfield-next/` 子目录即可。

---

## 3. 配置环境变量

复制示例文件：

```bash
cd /var/www/yourfield-next/yourfield-next
cp .env.example .env.local
nano .env.local
```

### 3.1 直接 IP 访问的关键值

如果你打算直接访问：

```text
http://服务器IP:3000
```

那么至少把这两个值设成一致：

```env
NEXT_PUBLIC_SITE_URL=http://服务器IP:3000
PAYLOAD_PUBLIC_SERVER_URL=http://服务器IP:3000
```

如果你后面改成 Nginx 80 端口直出，那就改成：

```env
NEXT_PUBLIC_SITE_URL=http://服务器IP
PAYLOAD_PUBLIC_SERVER_URL=http://服务器IP
```

### 3.2 必填生产/测试密钥

当前项目在 `NODE_ENV=production` 下会要求这些值：

```env
PAYLOAD_SECRET=请生成一个随机串
CRON_SECRET=请生成一个随机串
REVALIDATE_SECRET=请生成一个随机串
PAYLOAD_PREVIEW_SECRET=请生成一个随机串
```

生成命令：

```bash
openssl rand -base64 48
openssl rand -base64 48
openssl rand -base64 48
openssl rand -base64 48
```

### 3.3 Turnstile 测试键

测试阶段可直接用 Cloudflare 官方测试键，任何域名/IP 都能用。

```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET=1x0000000000000000000000000000000AA
```

说明：

- 这组是测试用，不是正式生产密钥
- 适合当前“直接 IP、测试阶段”的部署方式

### 3.4 数据库与后台账号

如果你使用本机 Docker Postgres：

```env
DATABASE_URI=postgresql://postgres:<你的强密码>@127.0.0.1:5432/yourfield_dev
SUPERADMIN_EMAIL=yourfield@yourfield.local
SUPERADMIN_USERNAME=yourfield
SUPERADMIN_PASSWORD=<你的后台密码>
PAYLOAD_ADMIN_LOCALE=zh
PAYLOAD_DB_PUSH=false
```

说明：

- `SUPERADMIN_USERNAME` 是本地登录别名
- 系统会把它映射到 `SUPERADMIN_EMAIL`
- `PAYLOAD_DB_PUSH=false` 更安全，避免生产/测试库启动时自动改 schema

### 3.5 其它常见值

建议至少确认这些：

```env
TZ=Asia/Shanghai
NODE_ENV=production
PORT=3000
PAYLOAD_PUBLIC_ADMIN_PATH=/admin
PAYLOAD_PUBLIC_API_PATH=/payload-api
PAYLOAD_PUBLIC_GRAPHQL_PATH=/payload-graphql
PAYLOAD_PUBLIC_GRAPHQL_PLAYGROUND_PATH=/payload-graphql-playground
```

---

## 4. 启动数据库 / 搜索 / 统计服务

如果你要做完整联调，建议一起启动 Docker 里的三个服务：

```bash
cd /var/www/yourfield-next/yourfield-next
# 如果你已经改过 docker-compose.yml 里的密码，先确认和 .env.local 对齐

docker compose up -d postgres meilisearch umami
docker compose ps
```

注意：

- `docker-compose.yml` 里的示例密码是开发用
- 上服务器前建议改成你自己的测试密码
- `.env.local` 里的 `DATABASE_URI` 必须和 Postgres 密码一致

如果你暂时只想验证站点和后台，Meilisearch / Umami 可先不启。

---

## 5. 安装依赖、检查、构建

进入应用目录：

```bash
cd /var/www/yourfield-next/yourfield-next
```

安装依赖：

```bash
pnpm install --frozen-lockfile
```

首次部署或数据库为空时，先执行迁移和初始化数据：

```bash
pnpm payload:migrate
pnpm seed -- --skip-existing
```

说明：

- `pnpm seed` 会导入页面、产品、新闻、媒体和后台账号
- seed 使用仓库根目录的 `assets/` 和应用目录的 `public/` 资源；这些文件走 Git LFS，所以必须先完成 `git lfs pull`
- `--skip-existing` 会跳过已有记录，避免重复初始化；如果你明确要用仓库种子覆盖测试库数据，再去掉这个参数
- 新闻前台已有静态兜底，即使临时未 seed，新闻列表和详情也不会空白；但后台内容管理仍建议 seed 一次

先做基础校验：

```bash
pnpm lint
pnpm typecheck
```

生产构建：

```bash
NEXT_BUILD_WORKERS=1 pnpm build
```

说明：

- 这一步会检查生产环境变量
- `NEXT_BUILD_WORKERS=1` 会把 Next 静态生成 worker 降到 1 个，测试服务器更稳，避免低内存机器构建时 OOM
- 如果缺少 `TURNSTILE_SECRET`、`NEXT_PUBLIC_TURNSTILE_SITE_KEY`、`CRON_SECRET`、`REVALIDATE_SECRET`、`PAYLOAD_PREVIEW_SECRET`，构建会失败
- 当前项目已经支持直接用上面的 Turnstile 测试键完成测试阶段构建

---

## 6. 启动应用

### 方案 A：最简单，直接暴露 3000 端口

这是测试阶段最省事的方式。

启动：

```bash
pm2 start "pnpm start" --name yourfield-next
pm2 save
pm2 status
```

如果服务器开了防火墙，放行 3000：

```bash
sudo ufw allow OpenSSH
sudo ufw allow 3000/tcp
sudo ufw enable
sudo ufw status
```

然后直接访问：

```text
http://服务器IP:3000
http://服务器IP:3000/admin
```

### 方案 B：Nginx 反代到 80 端口

如果你想直接访问：

```text
http://服务器IP
```

可以加一层 Nginx。

创建站点文件：

```bash
sudo nano /etc/nginx/sites-available/yourfield-next
```

写入：

```nginx
server {
    listen 80;
    server_name _;

    client_max_body_size 120m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

启用并重载：

```bash
sudo ln -s /etc/nginx/sites-available/yourfield-next /etc/nginx/sites-enabled/yourfield-next
sudo nginx -t
sudo systemctl reload nginx
```

如果使用 Nginx 方案，环境变量改成：

```env
NEXT_PUBLIC_SITE_URL=http://服务器IP
PAYLOAD_PUBLIC_SERVER_URL=http://服务器IP
```

---

## 7. 首次登录后台

后台地址：

```text
http://服务器IP:3000/admin
# 或
http://服务器IP/admin
```

登录方式：

- 用户名：`SUPERADMIN_USERNAME`
- 密码：`SUPERADMIN_PASSWORD`

如果你在 `.env.local` 里配置了别名：

- 用户名可以填 `yourfield`
- 系统会自动映射到 `SUPERADMIN_EMAIL`

---

## 8. 启动后验证清单

### 8.1 健康检查

```bash
curl -s http://服务器IP:3000/api/health
```

应该返回类似：

```json
{"ok":true,...}
```

### 8.2 页面检查

用浏览器打开并确认：

- 首页
- `/admin`
- 解决方案列表 / 详情
- 新闻动态列表 / 详情
- 产品大类列表 / 详情
- 联系方式全局页

### 8.3 后台操作检查

建议至少点一遍：

- 列表页
- 详情页
- 详情页 tab 切换
- 保存一次记录
- 上传一张图片

### 8.4 日志检查

```bash
pm2 logs yourfield-next
```

如果数据库或 Docker 服务异常：

```bash
docker compose logs --tail=100 postgres
docker compose logs --tail=100 meilisearch
docker compose logs --tail=100 umami
```

---

## 9. 常见问题

### 9.1 `pnpm build` 报缺少环境变量

检查 `.env.local` 是否包含：

- `TURNSTILE_SECRET`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `CRON_SECRET`
- `REVALIDATE_SECRET`
- `PAYLOAD_PREVIEW_SECRET`

测试阶段可以直接用 Cloudflare 的测试键。

### 9.2 `/admin` 打不开

检查：

- `pm2 status` 是否在跑
- `curl -I http://127.0.0.1:3000/admin` 是否返回 200
- 如果走 Nginx，检查 `sudo nginx -t`
- 看 `pm2 logs yourfield-next`

### 9.3 数据库连不上

检查 `DATABASE_URI`：

- 主机名是否是 `127.0.0.1`
- 密码是否和 docker-compose 一致
- Postgres 容器是否 `healthy`

### 9.4 资源 / 图片 404

如果你用的是新部署机器，要确认：

- 静态文件已经跟仓库一起拉下来
- 如果媒体库走本地盘，`src/uploads/` 目录是否存在并有权限
- 如果你改了图片路径，前台页面是否同步更新

### 9.5 服务器 IP 访问后链接不对

检查这两个值是否和你实际访问方式一致：

- `NEXT_PUBLIC_SITE_URL`
- `PAYLOAD_PUBLIC_SERVER_URL`

如果你浏览器访问的是 `http://IP:3000`，那环境变量也要写成 `http://IP:3000`。

---

## 10. 最短可复制流程

如果你只想快速跑起来，按这个顺序执行：

```bash
# 1) 安装依赖
sudo apt update
sudo apt install -y git git-lfs curl nginx docker.io docker-compose-plugin
git lfs install
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
corepack enable
corepack prepare pnpm@10.28.2 --activate
sudo npm i -g pm2

# 2) 拉代码
cd /var/www
git clone https://github.com/wwb3201369791-cell/yourfield-next.git
cd yourfield-next
git lfs pull
cd yourfield-next

# 3) 配置环境
cp .env.example .env.local
# 编辑 .env.local，至少填：
# NEXT_PUBLIC_SITE_URL=http://服务器IP:3000
# PAYLOAD_PUBLIC_SERVER_URL=http://服务器IP:3000
# DATABASE_URI=postgresql://postgres:<密码>@127.0.0.1:5432/yourfield_dev
# PAYLOAD_SECRET / CRON_SECRET / REVALIDATE_SECRET / PAYLOAD_PREVIEW_SECRET
# NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
# TURNSTILE_SECRET=1x0000000000000000000000000000000AA
# SUPERADMIN_EMAIL / SUPERADMIN_USERNAME / SUPERADMIN_PASSWORD

# 4) 启数据库（可选但推荐）
cd /var/www/yourfield-next/yourfield-next
docker compose up -d postgres meilisearch umami

# 5) 安装、检查、构建、启动
cd /var/www/yourfield-next/yourfield-next
pnpm install --frozen-lockfile
pnpm payload:migrate
pnpm seed -- --skip-existing
pnpm lint
pnpm typecheck
NEXT_BUILD_WORKERS=1 pnpm build
pm2 start "pnpm start" --name yourfield-next
pm2 save

# 6) 访问
# http://服务器IP:3000/admin
```

---

## 11. 我建议你的测试方式

测试阶段最省事的方案是：

- 直接用 `http://服务器IP:3000`
- 先不配域名
- 先不配 HTTPS
- 先用 Cloudflare Turnstile 测试键
- 先用本机 Docker Postgres

这样你能最快进入后台验收，不会被域名和证书卡住。
