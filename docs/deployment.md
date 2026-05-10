# 部署指南

## 架构总览

整个系统运行在单台机器上，通过 Docker Compose 编排 8 个容器，通过 Cloudflare Tunnel 提供公网访问。

```
公网用户 ──→ Cloudflare ──→ cloudflared ──→ localhost:3000 (Web)
                    │                    └─→ localhost:9000 (Bot + Webhook)
                    │
              DNS: fstool.123tips.cn
```

## 前置依赖

- Docker + Docker Compose
- 一个域名（已接入 Cloudflare，SSL 设为 Flexible）
- cloudflared 命令行工具
- 飞书开放平台应用凭证

## 部署步骤

### 1. 克隆项目

```bash
git clone https://github.com/techshared/CoSTools.git
cd costools
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`，填入必需参数：

| 变量 | 必需 | 说明 |
|------|------|------|
| `LARK_APP_ID` | 是 | 飞书应用 App ID |
| `LARK_APP_SECRET` | 是 | 飞书应用 App Secret |
| `GITHUB_WEBHOOK_SECRET` | 否 | GitHub Webhook 签名密钥 |

### 3. 启动 Docker 服务

```bash
docker compose up -d
```

启动后 8 个容器：

| 容器 | 端口 | 用途 |
|------|------|------|
| costools-postgres-1 | 5432 | PostgreSQL 数据库 |
| costools-redis-1 | 6379 | Redis 缓存 |
| costools-profit-engine-1 | 8001 | 收益分成后端 |
| costools-decision-registry-1 | 8002 | 决策记录后端 |
| costools-dashboard-1 | 8003 | 仪表盘后端 |
| costools-contribution-graph-1 | 8004 | 贡献图谱后端 |
| costools-web-1 | 3000 | Next.js Web 前端 |
| costools-bot-1 | 9000 | 飞书 Bot + Webhook |

验证：

```bash
curl http://localhost:3000     # Web 前端
curl http://localhost:9000/health  # Bot 健康检查
```

### 4. Cloudflare Tunnel

```bash
# 安装 cloudflared
# Linux: 直接下载二进制
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared

# 登录（会打开浏览器）
cloudflared tunnel login

# 创建隧道
cloudflared tunnel create costools

# 配置 ingress
# 编辑 ~/.cloudflared/config.yml
```

```yaml
# ~/.cloudflared/config.yml
tunnel: <your-tunnel-id>
credentials-file: ~/.cloudflared/<your-tunnel-id>.json

ingress:
  - hostname: fstool.123tips.cn
    path: /webhook/*
    service: http://localhost:9000
  - hostname: fstool.123tips.cn
    service: http://localhost:3000
  - service: http_status:404
```

```bash
# 路由 DNS
cloudflared tunnel route dns costools fstool.123tips.cn

# 启动隧道
cloudflared tunnel run costools
```

> 注意：Webhook `/webhook/*` 路由到 Bot（:9000），其余路由到 Web（:3000）。

验证：

```bash
curl https://fstool.123tips.cn         # Web
curl https://fstool.123tips.cn/health   # Bot 健康（路由到 :9000）
```

### 5. 播种演示数据

```bash
python3 scripts/seed-data.py
```

播种内容：
- 仪表盘：14 周趋势数据（健康分、OKR 完成率、任务完成率）
- 成员指标：6 人 × 14 周
- 贡献评分：6 人 × 8 个周期 + 当前用户
- 协作边：10 条成员协作关系

### 6. 配置飞书应用

在 [飞书开放平台](https://open.feishu.cn) 操作：

**基本信息**
- 应用图标: 上传 `app-icon.png`
- 应用主页（网页应用）: `https://fstool.123tips.cn`

**机器人**
- 开启机器人能力
- 事件与回调 → 请求网址: `https://fstool.123tips.cn/webhook/event`
- 添加事件: `im.message.receive_v1`

**网页应用**
- 开启网页应用能力
- 应用主页: `https://fstool.123tips.cn`

**权限管理**
- 开通 `im:message` 相关权限
- 可用范围: 全公司或指定成员

**发布**
- 版本管理与发布 → 创建版本 → 发布

### 7. 配置 GitHub Webhook（可选）

在 GitHub 仓库 Settings → Webhooks → Add webhook：

| 字段 | 值 |
|------|-----|
| Payload URL | `https://fstool.123tips.cn/webhook/github` |
| Content type | `application/json` |
| Secret | 与 `.env` 中 `GITHUB_WEBHOOK_SECRET` 一致 |
| Events | 勾选 `Push` 和 `Pull requests` |

支持的 GitHub 事件：

| 事件 | 贡献分 | 说明 |
|------|--------|------|
| `push` | 10 + commit 数 × 2 | 每次代码提交 |
| `pull_request.opened` | 15 | 提交 PR |
| `pull_request.merged` | 30 + reviewer × 8 | PR 被合并 |

### 8. 配置飞书审批事件（可选）

在飞书开放平台 → 事件与回调 → 添加事件：
- 搜索 `审批实例` → 勾选 `approval_instance`

审批通过时，仪表盘会记录相关成员的协作数据。

## 常用操作

### 查看日志

```bash
# 所有容器
docker compose logs -f

# 单个服务
docker compose logs -f bot
docker compose logs -f web
```

### 重启服务

```bash
# 重启单个
docker compose restart bot

# 重新构建并启动（代码变更后）
docker compose up -d --build bot
```

### 数据库操作

```bash
# 直接查询
docker exec costools-postgres-1 psql -U postgres -d costools -c "SELECT * FROM dashboard_overview;"

# 清空数据后重新播种
docker exec costools-postgres-1 psql -U postgres -d costools -c "DELETE FROM dashboard_overview; DELETE FROM dashboard_member_metrics; DELETE FROM contribution_scores; DELETE FROM collaboration_edges;"
python3 scripts/seed-data.py
```

### 开机自启

**方案一：Windows Task Scheduler**
创建一个基本任务，触发器为开机时，操作为启动 WSL：

```batch
wsl cloudflared tunnel run costools
```

**方案二：start-tunnel.bat**
将 `start-tunnel.bat` 放入 Windows 启动文件夹（运行 `shell:startup`）。

## 故障排除

### Bot 返回 502

```bash
docker logs costools-bot-1 --tail 20
```

常见原因：代码异常导致进程退出。查看日志后修复代码，重新构建。

### Webhook 签名验证失败

确保 GitHub Webhook 的 Secret 与 `.env` 中的 `GITHUB_WEBHOOK_SECRET` 完全一致。

### Cloudflare Tunnel 连接断开

```bash
# 检查隧道状态
ps aux | grep cloudflared

# 重新启动
pkill cloudflared
cloudflared tunnel run costools
```

### SSL 证书问题

在 Cloudflare Dashboard → SSL/TLS → Overview 设为 **Flexible**，否则 origin 自签证书会导致握手失败。
