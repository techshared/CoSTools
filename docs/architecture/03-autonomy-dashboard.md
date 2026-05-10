# 模块三：自驱力仪表盘

> 对应 <不打卡组织> 管理哲学：「不监控过程，只衡量结果和健康度」

---

## 1. 解决方案概述

### 1.1 要解决的问题

- 不打卡模式下，管理者面临"看不见"的焦虑——不是要监控，而是需要**团队健康度的可见性**
- 现有监控工具（Time Doctor, Hubstaff 等）都是**管控思维**，与不打卡文化冲突
- 管理者需要**提前发现风险**（某项目进度滞后、某成员参与度下降），而不是等结果崩了再救
- 团队成员需要**正向反馈**——看到自己的贡献被看见、被认可

### 1.2 核心设计原则

```
┌─────────────────────────────────────────────┐
│        不打卡仪表盘设计红线                   │
│                                             │
│  ❌ 不追踪：登录时长 / 鼠标移动 / 屏幕截图   │
│  ❌ 不排名：不搞个人效率排行榜               │
│  ❌ 不告警：不设置"活跃度低于X触发处罚"      │
│                                             │
│  ✅ 只看产出：任务完成率 / 文档贡献 / 代码   │
│  ✅ 只看趋势：团队维度的健康度变化           │
│  ✅ 只赋能：数据对个人仅自己可见             │
└─────────────────────────────────────────────┘
```

### 1.3 指标体系

| 维度 | 指标 | 数据来源 | 更新频率 |
|------|------|---------|---------|
| **目标推进** | 当周 OKR 完成率 / 趋势 | 飞书 OKR API | 实时 |
| **任务交付** | 周任务完成数 / 延期率 | 飞书多维表格 / Linear | 日 |
| **文档健康** | 活跃文档数 / 新建率 / 更新率 | 飞书文档 API | 日 |
| **协作密度** | 跨团队 @提及 / 文档评论 / 协作编辑 | 飞书 API | 日 |
| **知识沉淀** | 知识库更新频次 / 新增文档数 | 飞书知识库 | 周 |
| **代码健康** | PR 提交数 / 审查周期 / 合并率 | GitHub API | 实时 |
| **会议效率** | 人均会议时长 / 会议占比趋势 | 飞书日历 API | 周 |
| **成员活跃** | 周目标完成人数 / 连续完成周数 | 内部系统 | 周 |

---

## 2. 技术解决方案

### 2.1 系统架构图

```
┌───────────────────────────────────────────────────────────┐
│                   数据采集层                               │
│  ┌────────────┐ ┌────────────┐ ┌──────────┐ ┌────────┐  │
│  │ Feishu     │ │ GitHub     │ │ Notion   │ │ Linear │  │
│  │ Connector  │ │ Connector  │ │Connector │ │Connector│  │
│  └─────┬──────┘ └──────┬─────┘ └────┬─────┘ └───┬────┘  │
└────────┼───────────────┼────────────┼────────────┼───────┘
         │               │            │            │
┌────────┴───────────────┴────────────┴────────────┴───────┐
│                  数据处理层（ETL）                        │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Apache Airflow / Prefect                       │    │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────────┐  │    │
│  │  │ 数据提取  │ │ 清洗转换  │ │ 指标计算聚合   │  │    │
│  │  └──────────┘ └──────────┘ └────────────────┘  │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
                        │
┌───────────────────────┴──────────────────────────────────┐
│                   数据存储层                              │
│  ┌──────────────────┐  ┌─────────────────────────────┐   │
│  │  PostgreSQL      │  │  TimescaleDB (时序数据)     │   │
│  │  (元数据/配置)    │  │  (指标时间序列)             │   │
│  └──────────────────┘  └─────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
                        │
┌───────────────────────┴──────────────────────────────────┐
│                   可视化展示层                            │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Next.js + React + Recharts / D3.js             │    │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────────┐  │    │
│  │  │ 全局看板  │ │团队看板  │ │个人看板(仅自己)│  │    │
│  │  └──────────┘ └──────────┘ └────────────────┘  │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

### 2.2 核心 API 设计

```
GET    /api/v1/dashboard/overview              # 全局概览
GET    /api/v1/dashboard/team/:team_id          # 团队看板
GET    /api/v1/dashboard/me                     # 个人看板（仅自己可见）
GET    /api/v1/metrics/:metric_name            # 具体指标数据
GET    /api/v1/metrics/:metric_name/history     # 指标历史趋势
POST   /api/v1/insights/generate               # AI 生成周度洞察
```

### 2.3 隐私架构

```
┌─────────────────────────────────────────────┐
│              数据可见性矩阵                   │
├──────────────┬───────┬───────┬──────────────┤
│  数据维度     │ 本人  │ 直属上级 │ 全员       │
├──────────────┼───────┼───────┼──────────────┤
│  OKR 进度     │  ✅   │  ✅   │   ✅         │
│  任务完成率   │  ✅   │  ✅   │   ✅         │
│  文档贡献     │  ✅   │  ✅   │   匿名聚合    │
│  协作密度     │  ✅   │  ✅   │   ❌         │
│  代码贡献     │  ✅   │  ✅   │   ✅         │
│  个人趋势     │  ✅   │  ✅   │   ❌         │
│  个人排名     │  ❌   │  ❌   │   ❌         │
│  活跃时长     │  ❌   │  ❌   │   ❌         │
└──────────────┴───────┴───────┴──────────────┘
```

---

## 3. 技术架构

### 3.1 分层架构

| 层次 | 技术选型 | 职责 |
|------|---------|------|
| **前端展示** | Next.js 14 + React + Tailwind CSS | 仪表盘渲染 |
| **图表库** | Recharts (通用) + D3.js (复杂) | 数据可视化 |
| **BFF 层** | Next.js API Routes | 聚合多数据源 |
| **ETL 编排** | Apache Airflow / Prefect | 定时采集、清洗、计算 |
| **数据连接器** | Python (httpx + pandas) | 各工具 API 适配器 |
| **时序数据库** | TimescaleDB (PostgreSQL 扩展) | 指标存储与查询 |
| **AI 洞察** | OpenAI/Claude API (可选) | 每周自动生成团队健康报告 |

### 3.2 数据库核心表设计

```sql
-- 指标定义表
CREATE TABLE metrics_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,     -- okr_completion_rate
    display_name VARCHAR(200),              -- OKR 完成率
    category VARCHAR(50),                   -- goal, delivery, health
    data_source VARCHAR(100),               -- feishu_okr
    unit VARCHAR(50),                       -- %, count, hours
    higher_is_better BOOLEAN DEFAULT true,
    aggregation ENUM('sum', 'avg', 'max', 'latest')
);

-- 指标时序数据表（TimescaleDB hypertable）
CREATE TABLE metric_timeseries (
    time TIMESTAMPTZ NOT NULL,
    metric_id UUID REFERENCES metrics_definitions(id),
    team_id UUID,
    member_id UUID,          -- nullable, 团队级指标为 null
    value DOUBLE PRECISION NOT NULL
);
-- 转换为 TimescaleDB hypertable
SELECT create_hypertable('metric_timeseries', 'time');

-- 数据连接器配置表
CREATE TABLE connectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,      -- feishu, github, notion, linear
    config JSONB NOT NULL,           -- API key, webhook secret, etc.
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP,
    sync_interval INTEGER DEFAULT 3600  -- 秒
);

-- 匿名化的协作图谱
CREATE TABLE collaboration_edges (  -- 仅存聚合数据，不存具体内容
    period DATE NOT NULL,
    team_id UUID NOT NULL,
    from_role VARCHAR(50),
    to_role VARCHAR(50),
    interaction_count INTEGER DEFAULT 0,
    interaction_type VARCHAR(50),   -- mention, comment, co_edit
    UNIQUE(period, team_id, from_role, to_role, interaction_type)
);
```

### 3.3 ETL Pipeline 设计

```
每小时 cron trigger
  │
  ├─ 飞书连接器:
  │   ├─ 拉取 OKR 进度 → 计算完成率
  │   ├─ 拉取文档活跃度 → 计算文档健康分
  │   └─ 拉取日历数据 → 计算会议占比
  │
  ├─ GitHub 连接器:
  │   ├─ 拉取 PR 数据 → 提交数/审查周期
  │   └─ 拉取 Issue → 任务完成/延期率
  │
  ├─ 指标计算:
  │   ├─ 去个人标识 → 保证隐私
  │   └─ 写入 timeseries
  │
  └─ 异常检测（每日）:
      ├─ 团队指标显著下降 → 标记观察
      └─ 个人连续 2 周指标为零 → 标记"可能需要关注"
          （仅通知本人和其上级，非处罚）
```

---

## 4. 技术栈汇总

| 领域 | 选型 | 选型理由 |
|------|------|---------|
| 前端框架 | Next.js 14 (App Router) | 仪表盘类应用的首选 |
| UI 组件 | shadcn/ui + Tailwind CSS | 快速搭建仪表盘组件 |
| 图表库 | Recharts + D3.js | Recharts 通用，D3 复杂定制 |
| ETL 编排 | Prefect 2.x | 比 Airflow 更轻量，Python 原生 |
| 时序数据库 | TimescaleDB | 基于 PostgreSQL，无需额外运维 |
| 数据连接器 | Python (httpx + pydantic) | 类型安全、异步高性能 |
| AI 洞察 | Claude API / GPT-4o (可选) | 周报自动生成自然语言洞察 |
| 部署 | Docker Compose / K8s | 根据规模选择 |

---

## 5. 与监控工具的本质区别

| 维度 | 传统监控工具 (Time Doctor) | 自驱力仪表盘 |
|------|---------------------------|-------------|
| 数据源 | 鼠标移动、键盘敲击、屏幕截图 | 任务完成、文档产出、代码提交 |
| 视角 | 个体行为监控 | 团队健康度 |
| 目的 | 发现偷懒、惩罚 | 提前预警、赋能 |
| 使用者 | 管理者单向查看 | 全员可看（个人数据仅自己） |
| 文化信号 | "我不信任你" | "我们在乎结果并且帮助你更好" |

---

## 6. 部署方案

```
开发环境：
  docker compose up
  → Next.js + PostgreSQL (TimescaleDB) + Prefect worker

生产环境（10-50人）：
  1台应用服务器 (4C8G) + 托管 TimescaleDB
  → Prefect 调度器 + 连接器 worker

生产环境（50-200人）：
  K8s 集群
  → 连接器水平扩展 + 读写分离 + CDN 静态资源
```
