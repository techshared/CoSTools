import type {
  ApiResponse, Pagination,
  Project, CreateProjectInput, Revenue, Cost, Distribution, DistributionItem, AddRevenueInput, AddCostInput,
  Decision, DecisionComment, CreateDecisionInput,
  DashboardOverview, TeamDashboard, PersonalDashboard,
  ContributionScore, ContributionGraphData,
  Member
} from '@costools/shared-types'

export interface ClientConfig {
  baseUrl: string
  token?: string
  onAuthError?: () => void
}

export class ApiClient {
  private config: ClientConfig

  constructor(config: ClientConfig) {
    this.config = config
  }

  private get headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' }
    if (this.config.token) h['Authorization'] = `Bearer ${this.config.token}`
    return h
  }

  private async request<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const url = `${this.config.baseUrl}${path}`
    const res = await fetch(url, { ...options, headers: { ...this.headers, ...options?.headers } })
    if (res.status === 401 && this.config.onAuthError) this.config.onAuthError()
    return res.json()
  }

  // 收益分成引擎
  async getProjects(page = 1, pageSize = 20) { return this.request<Project[]>(`/api/v1/projects?page=${page}&pageSize=${pageSize}`) }
  async getProject(id: string) { return this.request<Project>(`/api/v1/projects/${id}`) }
  async createProject(input: CreateProjectInput) { return this.request<Project>('/api/v1/projects', { method: 'POST', body: JSON.stringify(input) }) }
  async addRevenue(input: AddRevenueInput) { return this.request<Revenue>('/api/v1/revenues', { method: 'POST', body: JSON.stringify(input) }) }
  async addCost(input: AddCostInput) { return this.request<Cost>('/api/v1/costs', { method: 'POST', body: JSON.stringify(input) }) }
  async distribute(projectId: string) { return this.request<Distribution>(`/api/v1/projects/${projectId}/distribute`, { method: 'POST' }) }
  async getDistributions(projectId: string) { return this.request<Distribution[]>(`/api/v1/projects/${projectId}/distributions`) }
  async getMyEarnings(memberId: string) { return this.request<DistributionItem[]>(`/api/v1/members/${memberId}/earnings`) }

  // 异步决策记录器
  async getDecisions(page = 1, pageSize = 20) { return this.request<Decision[]>(`/api/v1/decisions?page=${page}&pageSize=${pageSize}`) }
  async getDecision(id: string) { return this.request<Decision>(`/api/v1/decisions/${id}`) }
  async createDecision(input: CreateDecisionInput) { return this.request<Decision>('/api/v1/decisions', { method: 'POST', body: JSON.stringify(input) }) }
  async searchDecisions(q: string) { return this.request<Decision[]>(`/api/v1/decisions/search?q=${encodeURIComponent(q)}`) }
  async addComment(decisionId: string, content: string, parentId?: string) { return this.request<DecisionComment>(`/api/v1/decisions/${decisionId}/comments`, { method: 'POST', body: JSON.stringify({ content, parentId }) }) }

  // 自驱力仪表盘
  async getOverview() { return this.request<DashboardOverview>('/api/v1/dashboard/overview') }
  async getTeamDashboard(teamId: string) { return this.request<TeamDashboard>(`/api/v1/dashboard/team/${teamId}`) }
  async getMyDashboard() { return this.request<PersonalDashboard>('/api/v1/dashboard/me') }

  // 贡献图谱
  async getContributionsOverview() { return this.request<ContributionScore[]>('/api/v1/contributions/overview') }
  async getMyContributions() { return this.request<ContributionScore>('/api/v1/contributions/me') }
  async getContributionGraph(projectId?: string) { return this.request<ContributionGraphData>(`/api/v1/contributions/graph${projectId ? `?projectId=${projectId}` : ''}`) }
}
