# 模块一：收益分成计算引擎

> 对应 <不打卡组织> 核心规则：「项目利润 30% 分给执行团队，上不封顶」

---

## 1. 解决方案概述

### 1.1 要解决的问题

- 不打卡组织没有"固定工位"和"固定工时"概念，一人参与多项目、贡献度动态变化
- 项目回款周期不一（有的一次性、有的分期），利润确认时间点复杂
- 分成计算不透明会直接摧毁信任——不打卡模式下信任是基石
- Excel 手动算：易出错、不可追溯、无法处理多人多项目的交叉分配

### 1.2 核心价值

| 指标 | 说明 |
|------|------|
| **完全透明** | 所有分成数据全员可见，算法公开 |
| **实时可查** | 成员随时查看自己的累计分成、每个项目的分成明细 |
| **审计追溯** | 每一笔分成都有完整的计算链路和审批记录 |
| **自动合规** | 自动计算个税、社保，对接发薪系统 |

### 1.3 算法概要

```
项目可分配利润 = 项目回款总额 - 项目直接成本 - 公司预留(如20%)
团队分成池 = 项目可分配利润 × 30%

个人分成 = 团队分成池 × 个人贡献权重 / 团队总权重

个人贡献权重 = f(交付产出评分, 角色系数, 参与时长, 同行评议分)
```

**权重因子说明：**

| 因子 | 权重建议 | 数据来源 |
|------|---------|---------|
| 交付产出评分 | 50% | 该成员在本项目交付物经评审后的得分 |
| 角色系数 | 20% | PM=1.2, 核心开发=1.0, 支持角色=0.8 |
| 参与时长 | 15% | 有效投入的时间比例（非坐班，而是实际产出周期） |
| 同行评议分 | 15% | 项目组内互评 |

---

## 2. 技术解决方案

### 2.1 系统架构图

```
┌─────────────────────────────────────────────────────────┐
│                      接入层                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │ Web UI   │  │ 飞书Bot  │  │ Open API（第三方集成）│  │
│  └────┬─────┘  └────┬─────┘  └──────────┬───────────┘  │
└───────┼──────────────┼───────────────────┼──────────────┘
        │              │                   │
┌───────┴──────────────┴───────────────────┴──────────────┐
│                      业务层                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │              计算引擎（核心）                     │   │
│  │  ┌─────────┐  ┌──────────┐  ┌───────────────┐  │   │
│  │  │利润确认  │  │权重计算  │  │分成分配计算   │  │   │
│  │  └─────────┘  └──────────┘  └───────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐       │
│  │项目管理  │  │成员管理  │  │审批流引擎        │       │
│  └──────────┘  └──────────┘  └──────────────────┘       │
└──────────────────────────────────────────────────────────┘
                        │
┌───────────────────────┴──────────────────────────────────┐
│                      数据层                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐   │
│  │PostgreSQL│  │  Redis   │  │ 审计日志（不可篡改）  │   │
│  └──────────┘  └──────────┘  └──────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

### 2.2 核心 API 设计

```
POST   /api/v1/projects              # 创建项目（录入预算、成本基线）
GET    /api/v1/projects              # 项目列表
POST   /api/v1/projects/:id/revenue  # 确认回款
POST   /api/v1/projects/:id/cost     # 确认成本
POST   /api/v1/projects/:id/distribute  # 触发分成计算
GET    /api/v1/projects/:id/distribution-history  # 分成历史
GET    /api/v1/members/:id/earnings  # 某成员累计分成
GET    /api/v1/reports/team-earnings # 团队分成报表
```

### 2.3 核心计算流程

```
触发分成（手动/自动按周期）
  │
  ├─ 1. 校验：项目状态、利润已确认、成员已确认
  │
  ├─ 2. 计算可分配利润 = 回款 - 成本 - 预留
  │
  ├─ 3. 计算团队分成池 = 可分配利润 × 30%
  │
  ├─ 4. 计算每人权重
  │     ├─ 获取交付产出评分（来自项目评审系统）
  │     ├─ 获取角色系数（项目配置）
  │     ├─ 获取参与时长（来自工时/产出记录）
  │     └─ 获取同行评议分（来自评议收集）
  │
  ├─ 5. 计算个人分成 = 分成池 × 个人权重 / Σ全体权重
  │
  ├─ 6. 生成分成明细 → 推送到全员可见看板
  │
  └─ 7. 推送通知到飞书（每人收到自己的分成通知）
```

---

## 3. 技术架构

### 3.1 分层架构

| 层次 | 技术选型 | 职责 |
|------|---------|------|
| **前端** | Next.js + React + Tailwind CSS | 管理界面、看板展示 |
| **BFF 层** | Next.js API Routes | 请求聚合、权限校验 |
| **业务服务** | Python FastAPI | 核心计算引擎、项目管理 |
| **工作流** | Temporal / Celery | 异步计算、周期任务、审批流 |
| **数据库** | PostgreSQL 15+ | 业务数据主存储 |
| **缓存** | Redis 7+ | 计算缓存、会话管理 |
| **审计** | 追加写日志表 + 定期快照 | 不可篡改审计追踪 |
| **集成** | Feishu Open API + Webhook | 消息通知、数据同步 |

### 3.2 数据库核心表设计

```sql
-- 项目表
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('active', 'closed', 'archived'),
    total_revenue DECIMAL(12,2) DEFAULT 0,
    total_cost DECIMAL(12,2) DEFAULT 0,
    reserved_ratio DECIMAL(3,2) DEFAULT 0.20,  -- 公司预留比例
    profit_share_ratio DECIMAL(3,2) DEFAULT 0.30, -- 分成比例
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 项目成员表
CREATE TABLE project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    member_id UUID REFERENCES members(id),
    role VARCHAR(50),                        -- PM, dev, design, etc.
    role_coefficient DECIMAL(3,2) DEFAULT 1.0, -- 角色系数
    joined_at TIMESTAMP,
    left_at TIMESTAMP
);

-- 回款记录表
CREATE TABLE revenues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    amount DECIMAL(12,2) NOT NULL,
    received_at DATE NOT NULL,
    milestone VARCHAR(255),
    created_by UUID
);

-- 成本记录表
CREATE TABLE costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    category VARCHAR(100),  -- infrastructure, salary, external, etc.
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    incurred_at DATE
);

-- 分成计算结果表
CREATE TABLE distributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    total_profit DECIMAL(12,2),
    total_pool DECIMAL(12,2),
    calculated_at TIMESTAMP DEFAULT NOW(),
    status ENUM('pending', 'approved', 'paid', 'disputed'),
    approved_by UUID,
    paid_at TIMESTAMP
);

-- 个人分成明细表
CREATE TABLE distribution_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    distribution_id UUID REFERENCES distributions(id),
    member_id UUID REFERENCES members(id),
    weight DECIMAL(5,2),
    weight_detail JSONB,       -- 各因子权重明细
    amount DECIMAL(12,2) NOT NULL,
    status ENUM('pending', 'confirmed', 'disputed'),
    confirmed_at TIMESTAMP
);

-- 同行评议表
CREATE TABLE peer_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    reviewer_id UUID REFERENCES members(id),
    reviewee_id UUID REFERENCES members(id),
    score DECIMAL(3,1) CHECK (score >= 0 AND score <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 3.3 审计与防篡改机制

- 所有分成计算记录**追加写入**，不允许 UPDATE/DELETE
- 每次计算生成 **SHA256 摘要链**，后一条依赖前一条的 hash
- 每周自动对全量数据进行**快照比对**，检测异常修改
- 管理员操作需**双人审批**才可执行分成

---

## 4. 技术栈汇总

| 领域 | 选型 | 选型理由 |
|------|------|---------|
| 前端框架 | Next.js 14 (App Router) | SSR + API Routes 合一，简化架构 |
| UI 组件 | shadcn/ui + Tailwind CSS | 快速搭建专业 UI，组件可定制 |
| 后端语言 | Python 3.12 | FastAPI 天然适合计算密集型 API |
| 后端框架 | FastAPI | 高性能、自动生成 OpenAPI 文档 |
| 计算引擎 | Pandas + NumPy | 复杂权重计算、矩阵运算 |
| 数据库 | PostgreSQL 15+ | JSONB 支持、窗口函数、事务完整 |
| 缓存/队列 | Redis 7+ | 计算任务排队、结果缓存 |
| 工作流引擎 | Temporal | 长周期计算状态追踪、失败重试 |
| 消息通知 | 飞书开放 API / Webhook | 不打卡组织的沟通基础设施 |
| 部署 | Docker + Docker Compose | 中小团队最低运维成本 |
| CI/CD | GitHub Actions | 与代码仓库一体化 |

---

## 5. 安全性设计

- **RBAC** 三级权限：超级管理员 / 项目管理员 / 普通成员
- 普通成员仅可查看**自己参与的项目**的分成数据
- 所有涉及金额的接口均需**二次确认**（确认弹窗 + 操作原因）
- 数据库层面：金额字段使用 `DECIMAL` 避免浮点精度问题
- API 层面：速率限制 + 操作审计日志

---

## 6. 部署方案

```
最小部署（10人以下团队）：
  1 台云服务器 (4C8G) + Docker Compose
  → PostgreSQL + FastAPI + Next.js 容器

标准部署（10-50人团队）：
  2 台云服务器 + 托管 PostgreSQL + Redis
  → 应用层水平扩展

大规模部署（50人以上）：
  Kubernetes + 托管数据库 + CDN
  → 微服务拆分，计算引擎独立部署
```
