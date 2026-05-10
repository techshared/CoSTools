export function formatCurrency(amount: number, currency = 'CNY'): string {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount)
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('zh-CN')
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const diff = Date.now() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}天前`
  return formatDate(d)
}

export function calcProfit(revenue: number, cost: number, reservedRatio: number): number {
  return revenue - cost - revenue * reservedRatio
}

export function calcProfitShare(profit: number, shareRatio: number): number {
  return profit * shareRatio
}

export function calcMemberShare(pool: number, memberWeight: number, totalWeight: number): number {
  if (totalWeight === 0) return 0
  return pool * (memberWeight / totalWeight)
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function generateSerialNo(type: string, index: number): string {
  const prefix = type === 'tech_selection' ? 'TS'
    : type === 'product' ? 'PD'
    : type === 'hiring' ? 'HR'
    : type === 'process' ? 'PC'
    : type === 'strategy' ? 'SG'
    : 'OT'
  return `${prefix}-${String(index).padStart(3, '0')}`
}

export const DECISION_TYPE_LABELS: Record<string, string> = {
  tech_selection: '技术选型',
  product: '产品',
  hiring: '招聘',
  process: '流程',
  strategy: '战略',
  other: '其他',
}

export const DECISION_STATUS_LABELS: Record<string, string> = {
  open: '进行中',
  closed: '已关闭',
}

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  active: '进行中',
  closed: '已结束',
  archived: '已归档',
}

export const DISTRIBUTION_STATUS_LABELS: Record<string, string> = {
  pending: '待审批',
  approved: '已批准',
  paid: '已发放',
  disputed: '争议中',
}
