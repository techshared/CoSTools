# 模块二：异步决策记录器

> 对应 <不打卡组织> 协作模式：「能写文档不开会，能异步不同步」

---

## 1. 解决方案概述

### 1.1 要解决的问题

- 不打卡模式下，大量决策在异步场景发生（飞书群、文档评论、邮件），决策过程不沉淀
- 三个月后没人记得当时为什么选 A 不选 B，组织失忆症
- 新成员入职后对过往关键决策一无所知，重复讨论已定事项
- 传统会议纪要太啰嗦，没人看；不记又等于没发生过

### 1.2 核心价值

| 指标 | 说明 |
|------|------|
| **决策可追溯** | 每个决策都有完整的上下文、备选方案、决策依据 |
| **减少重复讨论** | 搜索即得，不再纠结已定事项 |
| **新人加速 onboarding** | 看一遍决策历史就理解组织为什么是现在的样子 |
| **决策质量提升** | 写下来倒逼思考质量，减少拍脑袋决策 |

### 1.3 产品形态概览

```
一个决策 = 一张卡片（类似 GitHub Issue 的结构）

┌─────────────────────────────────────────┐
│ [RFC-042] 是否采用飞书多维表格作为项目管 │
│ 理工具                                   │
│                                          │
│ 状态: ✅ 已决策    类型: 技术选型         │
│ 决策人: @张三      决策日期: 2026-04-15  │
│                                          │
│ 背景: 团队从15人扩张到30人，现有Trello   │
│ 已不够用，需要在飞书多维表格和Notion之间 │
│ 选择                                     │
│                                          │
│ 备选方案:                                │
│ 方案A: 飞书多维表格 (成本0, 与现有IM集成)│
│ 方案B: Notion (成本$10/人/月, 更灵活)    │
│                                          │
│ 决策: 飞书多维表格，优先降低切换成本      │
│                                          │
│ 影响:                                    │
│ - 后续所有项目管理迁移到多维表格          │
│ - 通知知识库组长更新SOP                 │
│ ─────────────────────────────────────    │
│ 💬 讨论记录 (12条)   🔗 关联项目 (3个)   │
└─────────────────────────────────────────┘
```

---

## 2. 技术解决方案

### 2.1 系统架构图

```
┌────────────────────────────────────────────────────┐
│                   输入层                            │
│  ┌──────────┐  ┌─────────┐  ┌─────────────────┐   │
│  │ Web UI   │  │飞书Bot  │  │ Slack / 企微 Bot │   │
│  │（完整）  │  │（快捷） │  │  （适配）        │   │
│  └────┬─────┘  └────┬────┘  └───────┬─────────┘   │
└───────┼──────────────┼───────────────┼─────────────┘
        │              │               │
┌───────┴──────────────┴───────────────┴─────────────┐
│                   业务层                            │
│  ┌─────────────────────────────────────────────┐   │
│  │ 决策引擎                                     │   │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────┐  │   │
│  │  │ 决策CRUD  │ │搜索/检索引擎│ │标签/分类  │  │   │
│  │  └──────────┘ └──────────┘ └────────────┘  │   │
│  └─────────────────────────────────────────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐    │
│  │ 模板引擎 │ │关联引擎  │ │ 通知/订阅引擎    │    │
│  └──────────┘ └──────────┘ └──────────────────┘    │
└─────────────────────────────────────────────────────┘
                        │
┌───────────────────────┴─────────────────────────────┐
│                   数据层                             │
│  ┌──────────────────────────────────────────────┐   │
│  │  PostgreSQL（主存储 + 全文检索）              │   │
│  │  decisions / decision_comments /              │   │
│  │  decision_templates / tags                    │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────┐  ┌───────────────────────────┐    │
│  │  Redis 缓存  │  │  Elasticsearch（可选搜索） │    │
│  └──────────────┘  └───────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### 2.2 核心 API 设计

```
POST   /api/v1/decisions                   # 创建决策记录
GET    /api/v1/decisions                   # 决策列表（分页+筛选）
GET    /api/v1/decisions/:id               # 决策详情
PUT    /api/v1/decisions/:id               # 更新决策
PATCH  /api/v1/decisions/:id/status        # 变更状态
POST   /api/v1/decisions/:id/comments      # 添加讨论
GET    /api/v1/decisions/search?q=keyword  # 全文搜索
GET    /api/v1/decisions/timeline          # 决策时间线
POST   /api/v1/decisions/:id/link          # 关联到项目/任务
```

### 2.3 决策生命周期

```
DRAFT（草稿）
  │  创建者填写背景、备选方案
  │
  ▼
PROPOSAL（提案中）
  │  公开给相关人员评论、讨论
  │  飞书Bot自动推送通知
  │
  ▼
VOTING（投票中）[可选]
  │  对关键决策进行轻量投票
  │
  ▼
DECIDED（已决策）
  │  决策人填写最终决定和理由
  │  自动通知所有参与者
  │
  ▼
IMPLEMENTING（执行中）
  │  关联到具体执行任务
  │
  ▼
CLOSED（关闭）
  │  执行完成后记录实际结果
  │  与当初的决策预期做对比复盘
```

---

## 3. 技术架构

### 3.1 分层架构

| 层次 | 技术选型 | 职责 |
|------|---------|------|
| **前端** | Next.js + React + Tailwind CSS | 决策浏览、创建、搜索 |
| **IM Bot** | 飞书 SDK / Bot | IM 内快捷录入和查询 |
| **BFF** | Next.js API Routes | 请求聚合、权限校验 |
| **业务服务** | Go (Gin/Echo) 或 Python FastAPI | 决策 CRUD、搜索、关联 |
| **搜索** | PostgreSQL FTS / Elasticsearch | 全文检索 |
| **数据库** | PostgreSQL 15+ | JSONB 存储决策结构 |
| **缓存** | Redis | 热门决策缓存、会话 |
| **集成** | Feishu/Slack Webhook + OAuth | 消息通知、身份认证 |

### 3.2 数据库核心表设计

```sql
-- 决策类型枚举
CREATE TYPE decision_status AS ENUM (
    'draft', 'proposal', 'voting', 'decided', 'implementing', 'closed'
);
CREATE TYPE decision_type AS ENUM (
    'tech_selection', 'product', 'hiring', 'process', 'strategy', 'other'
);

-- 决策主表
CREATE TABLE decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_no VARCHAR(20) UNIQUE,          -- RFC-001 格式
    title VARCHAR(255) NOT NULL,
    type decision_type NOT NULL,
    status decision_status DEFAULT 'draft',
    background TEXT,                        -- 背景说明
    options JSONB,                         -- 备选方案 [{name, pros, cons, ...}]
    decision TEXT,                          -- 最终决定
    rationale TEXT,                         -- 决策理由
    expected_impact TEXT,                   -- 预期影响
    actual_result TEXT,                     -- 实际结果（关闭时填写）
    decision_maker_id UUID,
    created_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    decided_at TIMESTAMP,
    closed_at TIMESTAMP
);

-- 决策标签
CREATE TABLE decision_tags (
    decision_id UUID REFERENCES decisions(id),
    tag VARCHAR(50) NOT NULL,
    PRIMARY KEY (decision_id, tag)
);

-- 决策讨论
CREATE TABLE decision_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID REFERENCES decisions(id),
    author_id UUID NOT NULL,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES decision_comments(id),  -- 支持回复
    created_at TIMESTAMP DEFAULT NOW()
);

-- 决策关联（关联到项目、任务或其他决策）
CREATE TABLE decision_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID REFERENCES decisions(id),
    target_type VARCHAR(50),    -- 'project', 'task', 'decision'
    target_id UUID NOT NULL,
    relation VARCHAR(50),       -- 'supersedes', 'related_to', 'blocks'
    created_at TIMESTAMP DEFAULT NOW()
);

-- 投票记录
CREATE TABLE decision_votes (
    decision_id UUID REFERENCES decisions(id),
    member_id UUID REFERENCES members(id),
    vote ENUM('approve', 'abstain', 'against'),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (decision_id, member_id)
);

-- 全文索引
CREATE INDEX idx_decisions_fts ON decisions
    USING GIN(to_tsvector('simple', title || ' ' || coalesce(background, '') || ' ' || coalesce(decision, '')));
```

### 3.3 飞书 Bot 交互设计

```
用户 @决策机器人 发送：
  "记录决策：前端框架选型，选择Next.js，理由：团队React经验丰富"

机器人自动结构化：
  ┌─────────────────────────────────────────┐
  │ 已记录决策草案，请确认：                 │
  │ 标题：前端框架选型                      │
  │ 决策：选择 Next.js                      │
  │ 理由：团队 React 经验丰富               │
  │ 状态：草稿                              │
  │ ┌─────┐ ┌─────┐ ┌─────────┐            │
  │ │确认  │ │编辑  │ │查看完整  │           │
  │ └─────┘ └─────┘ └─────────┘            │
  └─────────────────────────────────────────┘

用户查询 "搜索关于框架的决策"：
  → 返回相关决策列表，点击查看详情
```

---

## 4. 技术栈汇总

| 领域 | 选型 | 选型理由 |
|------|------|---------|
| 前端框架 | Next.js 14 (App Router) | SSR + API Routes，SEO友好 |
| UI 组件 | shadcn/ui + Tailwind CSS | 快速搭建，暗色模式原生支持 |
| 后端 | Go (Gin) | 高并发下性能优异，编译为单二进制部署简单 |
| 数据库 | PostgreSQL 15+ | 内置 FTS 足够好用，无需额外 Elasticsearch |
| IM 集成 | 飞书开放 SDK / Bot API | 国内不打卡团队的事实标准 |
| 全文搜索 | PostgreSQL FTS | 中小规模足够，大规模换 ES |
| 缓存 | Redis | 热门决策缓存 + 投票去重 |
| 部署 | Docker + Docker Compose | 最小运维成本 |

---

## 5. 与飞书多维表格的关系

> ⚠️ **重要设计决策**：为什么不直接用飞书多维表格？

| 维度 | 飞书多维表格 | 自研决策记录器 |
|------|-------------|---------------|
| 结构化 | 适合表格，不适合长文本+树状讨论 | 原生支持决策结构 |
| 搜索 | 基础搜索 | 全文检索+标签+关联搜索 |
| 决策生命周期 | 需手动管理 | 内置状态流转引擎 |
| IM 集成 | 基础通知 | 双向交互 Bot |
| 模板 | 通用 | 决策类型模板 |
| 权限 | 表格级 | 字段级+决策级 |

**推荐策略**：先用飞书多维表格搭一个极简版（标题/状态/决策人三列），等决策数超过 100 条时切换到自研系统。

---

## 6. 部署方案

```
MVP 极简部署：
  1 台云服务器 (2C4G)
  → Next.js (含 API) + PostgreSQL (同机)
  → 支持 10-50 人团队使用

标准部署：
  应用服务 + 托管 PostgreSQL (如 Supabase)
  → 自动备份 + 读写分离
  → 支持 50-200 人团队

```sql
-- 全文索引
CREATE INDEX idx_decisions_fts ON decisions
    USING GIN(to_tsvector('simple', title || ' ' || coalesce(background, '') || ' ' || coalesce(decision, '')));
```
