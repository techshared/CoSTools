// ===================== 收益分成引擎 =====================

export type ProjectStatus = 'active' | 'closed' | 'archived'
export type DistributionStatus = 'pending' | 'approved' | 'paid' | 'disputed'
export type DistributionItemStatus = 'pending' | 'confirmed' | 'disputed'

export interface Project {
  id: string
  name: string
  description?: string
  status: ProjectStatus
  totalRevenue: number
  totalCost: number
  reservedRatio: number
  profitShareRatio: number
  createdAt: string
  updatedAt: string
}

export interface ProjectMember {
  id: string
  projectId: string
  memberId: string
  memberName: string
  role: string
  roleCoefficient: number
  joinedAt: string
  leftAt?: string
}

export interface Revenue {
  id: string
  projectId: string
  amount: number
  receivedAt: string
  milestone: string
}

export interface Cost {
  id: string
  projectId: string
  category: string
  amount: number
  description: string
  incurredAt: string
}

export interface Distribution {
  id: string
  projectId: string
  totalProfit: number
  totalPool: number
  calculatedAt: string
  status: DistributionStatus
  approvedBy?: string
  paidAt?: string
}

export interface DistributionItem {
  id: string
  distributionId: string
  memberId: string
  memberName: string
  weight: number
  weightDetail: WeightDetail
  amount: number
  status: DistributionItemStatus
}

export interface WeightDetail {
  deliveryScore: number
  roleCoefficient: number
  participationRatio: number
  peerReviewScore: number
}

export interface CreateProjectInput {
  name: string
  description?: string
  reservedRatio?: number
  profitShareRatio?: number
}

export interface AddRevenueInput {
  projectId: string
  amount: number
  receivedAt: string
  milestone: string
}

export interface AddCostInput {
  projectId: string
  category: string
  amount: number
  description: string
  incurredAt: string
}

// ===================== 异步决策记录器 =====================

export type DecisionStatus = 'draft' | 'proposal' | 'voting' | 'decided' | 'implementing' | 'closed'
export type DecisionType = 'tech_selection' | 'product' | 'hiring' | 'process' | 'strategy' | 'other'
export type VoteValue = 'approve' | 'abstain' | 'against'

export interface DecisionOption {
  name: string
  pros: string
  cons: string
}

export interface Decision {
  id: string
  serialNo: string
  title: string
  type: DecisionType
  status: DecisionStatus
  background?: string
  options: DecisionOption[]
  decision?: string
  rationale?: string
  expectedImpact?: string
  actualResult?: string
  decisionMakerId?: string
  decisionMakerName?: string
  createdBy: string
  createdByName: string
  createdAt: string
  decidedAt?: string
  closedAt?: string
  tags: string[]
  commentCount: number
}

export interface DecisionComment {
  id: string
  decisionId: string
  authorId: string
  authorName: string
  content: string
  parentId?: string
  createdAt: string
}

export interface DecisionVote {
  decisionId: string
  memberId: string
  memberName: string
  vote: VoteValue
  comment?: string
  createdAt: string
}

export interface CreateDecisionInput {
  title: string
  type: DecisionType
  background?: string
  options?: DecisionOption[]
  tags?: string[]
}

// ===================== 自驱力仪表盘 =====================

export type MetricCategory = 'goal' | 'delivery' | 'health' | 'collaboration'
export type AggregationType = 'sum' | 'avg' | 'max' | 'latest'

export interface MetricDefinition {
  id: string
  name: string
  displayName: string
  category: MetricCategory
  dataSource: string
  unit: string
  higherIsBetter: boolean
}

export interface MetricDataPoint {
  time: string
  metricId: string
  metricName: string
  teamId?: string
  memberId?: string
  value: number
}

export interface DashboardOverview {
  teamHealthScore: number
  okrCompletionRate: number
  taskCompletionRate: number
  activeMembers: number
  collaborationDensity: number
  weeklyTrends: MetricDataPoint[]
}

export interface TeamDashboard {
  teamId: string
  teamName: string
  metrics: Record<string, number>
  history: Record<string, MetricDataPoint[]>
}

export interface PersonalDashboard {
  memberId: string
  memberName: string
  okrProgress: number
  taskCompletionRate: number
  docContributions: number
  codeContributions: number
  collaborationScore: number
  trends: MetricDataPoint[]
}

// ===================== 成员贡献图谱 =====================

export type ContributionNodeType = 'document' | 'task' | 'pr' | 'issue' | 'comment' | 'design' | 'wiki'
export type ContributionEdgeType = 'created' | 'reviewed' | 'commented' | 'mentioned' | 'co-edited'

export interface Contributor {
  id: string
  displayName: string
  avatarUrl?: string
  joinedAt: string
}

export interface ContributorIdentity {
  id: string
  contributorId: string
  platform: 'feishu' | 'github' | 'figma'
  platformUserId: string
  platformUsername: string
}

export interface ContributionNode {
  id: string
  contributorId: string
  nodeType: ContributionNodeType
  sourcePlatform: string
  sourceId: string
  title: string
  url?: string
  weight: number
  createdAt: string
}

export interface ContributionEdge {
  id: string
  sourceNodeId: string
  targetNodeId: string
  edgeType: ContributionEdgeType
  weight: number
}

export interface ContributionScore {
  period: string
  contributorId: string
  contributorName: string
  totalScore: number
  dimensionScores: DimensionScores
  rank?: number
}

export interface DimensionScores {
  code: number
  doc: number
  task: number
  design: number
  knowledge: number
  peerRecognition: number
}

export interface ContributionGraphData {
  nodes: ContributionNode[]
  edges: ContributionEdge[]
  scores: ContributionScore[]
}

// ===================== 通用 =====================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  pagination?: Pagination
}

export interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface Member {
  id: string
  name: string
  email: string
  avatarUrl?: string
  role: string
  teams: string[]
  joinedAt: string
}
