# 模块四：成员贡献图谱

> 对应 <不打卡组织> 核心理念：「贡献看得见，价值可量化」

---

## 1. 解决方案概述

### 1.1 要解决的问题

- 不打卡模式下，"谁在做什么、做出了什么"变得不可见
- 传统的"存在感"（坐在工位上）被移除，需要新的"贡献感"替代
- 项目分成时，贡献度的评估容易主观、引发争议
- 跨项目协作时，不知道哪个成员擅长什么、活跃在哪些领域
- 成员自己也需要"被看见"——付出与贡献需要有可视化的反馈

### 1.2 设计思路：基于 SourceCred 开源方案定制

**SourceCred 简介：**
SourceCred 是一个开源的贡献度计算框架（GitHub: sourcecred/sourcecred），最初为开源社区设计，通过聚合 GitHub Issue、PR、Review 等数据计算贡献度。

**定制方向：**
- GitHub Issue/PR 贡献 -> + 飞书文档贡献
- GitHub Review -> + 飞书多维表格任务
- 仅限开源社区 -> + 知识库贡献
- 单一权重配置 -> + 可调权重矩阵
- 基于时间衰减 -> + 多维度衰减因子

### 1.3 核心概念

贡献图谱 = 多维贡献数据的聚合、评分、可视化系统

维度权重（建议初始配置）：
- 代码贡献 (GitHub): 35%
- 文档贡献 (飞书文档): 20%
- 任务交付 (多维表格): 20%
- 设计贡献 (Figma): 10%
- 知识分享 (知识库): 10%
- 同行认可 (互评): 5%

权重可被团队民主投票调整，非管理员独断

---

## 2. 技术解决方案——基于 SourceCred + 定制

### 2.1 整体架构

```
┌──────────────────────────────────────────────────────┐
│                    数据接入层                         │
│  ┌──────────┐  ┌──────────┐  ┌────────┐ ┌────────┐ │
│  │ GitHub   │  │ 飞书文档  │  │  Figma │ │ 多维   │ │
│  │ Plugin   │  │ Plugin   │  │ Plugin │ │ 表格   │ │
│  └─────┬────┘  └────┬─────┘  └───┬────┘ └───┬────┘ │
└────────┼────────────┼────────────┼──────────┼───────┘
         │            │            │          │
┌────────┴────────────┴────────────┴──────────┴───────┐
│                   SourceCred Core                    │
│  ┌──────────────────────────────────────────────┐   │
│  │  贡献图 (Contribution Graph)                 │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │   │
│  │  │ 节点构建  │ │边构建    │ │ 权重传播算法 │ │   │
│  │  └──────────┘ └──────────┘ └──────────────┘ │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │  评分引擎                                     │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │   │
│  │  │ 归一化    │ │ 时间衰减  │ │ 加权聚合     │ │   │
│  │  └──────────┘ └──────────┘ └──────────────┘ │   │
│  └──────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
                        │
┌───────────────────────┴──────────────────────────────┐
│                    可视化层                           │
│  ┌──────────────────────────────────────────────┐    │
│  │  Next.js + D3.js + vis-network                │    │
│  │  ┌──────────┐ ┌──────────┐ ┌─────────────┐  │    │
│  │  │ 贡献看板  │ │ 图谱视图  │ │ 趋势视图    │  │    │
│  │  └──────────┘ └──────────┘ └─────────────┘  │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

### 2.2 SourceCred 定制方案

**原生架构理解：**

SourceCred 的核心机制是 PageRank-based Contribution Graph：
1. 构建贡献图谱（Graph）：节点 = 贡献者、Issue、PR、文档、评论等；边 = 创建、评论、审查、@提及等关系
2. PageRank 算法传播权重：被"高贡献者"引用的节点获得更高权重，迭代收敛后得到每个贡献者的最终分数

**定制点：**

| 定制项 | 原生 SourceCred | 定制后 |
|--------|---------------|--------|
| 数据源 | GitHub 为主 | GitHub + 飞书文档 + 多维表格 + Figma + 知识库 |
| 节点类型 | Issue, PR, Review, Comment | + Document, Task, Design, Wiki |
| 权重配置 | JSON 配置 | 可视化配置面板 + 团队投票机制 |
| 时间衰减 | 线性衰减 | 可配置衰减曲线（线性/指数/阶梯） |
| 身份关联 | GitHub 账号 | 多平台身份绑定（飞书 <-> GitHub <-> Figma） |
| UI | 命令行输出 | Web 可视化图谱 |

### 2.3 核心 API 设计

```
贡献核心：
GET    /api/v1/contributions/overview       # 团队贡献总览
GET    /api/v1/contributions/members        # 成员贡献排名（区间展示）
GET    /api/v1/contributions/members/:id    # 个人贡献详情
GET    /api/v1/contributions/timeline       # 贡献趋势

图谱：
GET    /api/v1/graph/full                   # 全量图谱数据
GET    /api/v1/graph/member/:id             # 个人协作网络
GET    /api/v1/graph/project/:id            # 项目协作网络

权重管理：
GET    /api/v1/weights                      # 当前权重配置
PUT    /api/v1/weights                      # 更新权重（需团队投票通过）
POST   /api/v1/weights/proposal             # 提交权重变更提案

身份绑定：
POST   /api/v1/identities/link              # 绑定多个平台账号
GET    /api/v1/identities/:id/accounts      # 查看已绑定账号
```

---

## 3. 技术架构

### 3.1 分层架构

| 层次 | 技术选型 | 职责 |
|------|---------|------|
| 前端 | Next.js + React + D3.js + vis-network | 贡献看板、图谱可视化 |
| 评分引擎 | SourceCred (Node.js) + 定制 Plugin | 核心图算法、权重传播 |
| 聚合服务 | Python FastAPI | 数据聚合、插件调度、API |
| 数据采集器 | Python / Node.js | 连接器实现 |
| 主数据库 | PostgreSQL 15+ | 贡献评分、元数据 |
| 图数据库 | Neo4j (可选) | 复杂图谱查询优化 |
| 缓存 | Redis | 图谱渲染缓存 |

### 3.2 数据库核心表设计

```sql
-- 贡献者主表（成员身份聚合）
CREATE TABLE contributors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name VARCHAR(200) NOT NULL,
    avatar_url VARCHAR(500),
    joined_at TIMESTAMP DEFAULT NOW()
);

-- 多平台身份绑定
CREATE TABLE contributor_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contributor_id UUID REFERENCES contributors(id),
    platform VARCHAR(50) NOT NULL,
    platform_user_id VARCHAR(200) NOT NULL,
    platform_username VARCHAR(200),
    UNIQUE(platform, platform_user_id)
);

-- 贡献节点
CREATE TABLE contribution_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contributor_id UUID REFERENCES contributors(id),
    node_type VARCHAR(50) NOT NULL,
    source_platform VARCHAR(50),
    source_id VARCHAR(200),
    title TEXT,
    url VARCHAR(500),
    weight DECIMAL(10,4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(source_platform, source_id)
);

-- 贡献边
CREATE TABLE contribution_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_node_id UUID REFERENCES contribution_nodes(id),
    target_node_id UUID REFERENCES contribution_nodes(id),
    edge_type VARCHAR(50) NOT NULL,
    weight DECIMAL(10,4) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 周期贡献评分快照
CREATE TABLE contribution_scores (
    period DATE NOT NULL,
    contributor_id UUID REFERENCES contributors(id),
    total_score DECIMAL(12,4) NOT NULL,
    dimension_scores JSONB,
    rank INTEGER,
    calculated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(period, contributor_id)
);

-- 维度权重配置历史
CREATE TABLE weight_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    weights JSONB NOT NULL,
    proposed_by UUID,
    approved_by_vote BOOLEAN DEFAULT false,
    effective_from DATE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 3.3 评分算法说明

```
Step 1: 数据采集
  各插件从对应平台拉取上一周期的贡献数据
  -> GitHub: PR merged, Review given, Issue closed
  -> 飞书: 文档创建/编辑数、评论数、@提及数
  -> 多维表格: 任务完成数、任务创建数
  -> Figma: 设计稿创建、评论
  -> 知识库: 文档创建、更新、阅读量

Step 2: 图构建
  所有贡献节点和边构建为有向图
  - 节点权重初始化为 1
  - 边权重根据类型不同

Step 3: PageRank 迭代
  初始化：每个节点得分 1/N
  迭代：得分 = (1-d) + d * sum(入边节点的得分 * 边权 / 出度)
  20-30 次迭代后收敛, d = 0.85

Step 4: 维度加权
  按团队投票确定的维度权重聚合
  最终得分 = sum(维度i得分 * 维度i权重)

Step 5: 时间衰减
  近30天: 100% | 30-90天: 70% | 90-180天: 40% | 180天+: 不计
```

---

## 4. 技术栈汇总

| 领域 | 选型 | 选型理由 |
|------|------|---------|
| 核心算法 | SourceCred (Node.js) | 成熟贡献图算法，MIT 开源 |
| 算法引擎 | Node.js 18+ | SourceCred 原生生态 |
| 聚合 API | Python FastAPI | 插件调度和数据聚合 |
| 插件开发 | Node.js (TypeScript) | 与 SourceCred 架构一致 |
| 图数据库 | Neo4j (可选) | 50人以上图谱查询优化 |
| 关系数据库 | PostgreSQL 15+ | 主数据存储 |
| 前端框架 | Next.js + React | 前后端同构 |
| 可视化 | D3.js + vis-network | 图谱渲染、交互探索 |
| 部署 | Docker Compose | 容器化 |

---

## 5. 与分成引擎的集成

贡献图谱 -> 收益分成引擎

API 契约：分成引擎调用
```
GET /api/v1/contributions/score/:member_id?project=:project_id&period=:period
```
返回该成员在指定项目/周期的贡献分数，作为分成权重输入因子。

优势：
- 客观数据驱动，减少主观争执
- 覆盖代码、文档、设计全维度
- 时间衰减确保持续参与才有持续回报

---

## 6. 隐私与伦理设计

```
1. 贡献分数不公开排名
   - 只看得到自己的完整分数
   - 管理员看得到团队聚合（不展示个人排序）
   - 所有公开视图只显示"相对区间"

2. 成员可以选择退出
   - 可选择不被计入图谱
   - 但不计图谱会影响分成权重计算（需签知情同意）

3. 算法公开透明
   - 权重配置全员可查
   - 权重变更需团队投票 > 60% 同意
   - 评分规则开源、可审计
```

---

## 7. SourceCred 部署指南

```bash
# 克隆并安装
git clone https://github.com/sourcecred/sourcecred.git
cd sourcecred && yarn install
```

配置文件 (sourcecred/config.json):
```json
{
  "feishuPlugin": {
    "enabled": true,
    "appId": "cli_xxxx",
    "docsWeight": 0.20
  },
  "githubPlugin": {
    "enabled": true,
    "repositories": ["org/repo1", "org/repo2"],
    "token": "ghp_xxx"
  }
}
```

运行:
```bash
yarn sourcecred load --plugin feishu --plugin github
yarn sourcecred graph
yarn sourcecred scores
yarn sourcecred server --port 6001
```

---

## 8. 部署方案

**MVP 最小方案：**
1台服务器 (4C8G) -> SourceCred CLI 定时跑 + 结果导入 PostgreSQL -> Next.js 展示
10人团队：每周跑一次，5分钟完成

**标准方案：**
应用服务器 + 数据库服务器 -> SourceCred 容器化运行 -> Neo4j 可选 -> GitHub Actions 定时触发

**企业方案：**
完全定制替换 SourceCred Core，用 Go/Rust 重写计算引擎以支持更大规模
