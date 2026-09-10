// ===== 全局类型定义 =====

export interface Child {
  id: string
  nickname: string
  gender: 'male' | 'female' | 'unknown'
  birthDate: string // YYYY-MM-DD
  city: string
  createdAt: number
}

export type VaccineStatus = 'due' | 'done'

export interface VaccineDose {
  vaccineCode: string
  doseNo: number
  dueMonth: number // 应接种月龄
}

export interface VaccineRecord {
  id: string // `${childId}:${vaccineCode}:${doseNo}`
  childId: string
  vaccineCode: string
  doseNo: number
  status: VaccineStatus
  actualDate?: string // 实际接种日期
}

export type GrowthType = 'height' | 'weight' | 'head' | 'temp'

export interface GrowthRecord {
  id: string
  childId: string
  type: GrowthType
  value: number
  recordDate: string // YYYY-MM-DD
  note?: string
  createdAt: number
}

export interface MilestoneCheck {
  id: string // `${childId}:${bandId}:${milestoneId}`
  childId: string
  bandId: string
  milestoneId: string
  achieved: boolean
}

export type TodoStatus = 'open' | 'done'

export interface TodoState {
  id: string // `${childId}:${todoId}`
  childId: string
  todoId: string
  status: TodoStatus
  doneAt?: number
}

// ===== 内容数据类型 =====

export interface VaccineDef {
  code: string
  name: string
  short?: string
  prevent: string
  free: boolean
  note?: string
  doses: { doseNo: number; month: number }[]
}

export interface MilestoneDef {
  id: string
  desc: string
  key?: boolean // 关键里程碑，未达成给提示
}

export interface HealthIssue {
  name: string
  desc: string
  care: string[]
}

export interface AgeBand {
  id: string
  label: string
  start: number // 起始月龄（含）
  end: number // 结束月龄（含）
  theme: string // 阶段主题一句话
  emoji: string
  health: {
    issues: HealthIssue[]
    redFlags: string[] // 就医红线
    tips: string[]
  }
  milestones: MilestoneDef[]
}

export interface PolicyDef {
  id: string
  category: 'insurance' | 'subsidy' | 'checklist'
  title: string
  subtitle: string
  city: string // 'ALL' | '上海'
  emoji: string
  tags: string[]
  /** 适用条件 */
  condition: string
  /** 办理/申领流程步骤 */
  steps: string[]
  /** 办理渠道 */
  channels: string[]
  /** 所需材料 */
  materials: string[]
  /** 关键时限说明 */
  deadline: string
  /** 相对宝宝出生日的待办截止（月），用于倒计时提醒；null 表示无固定相对时限 */
  deadlineMonthsFromBirth: number | null
  content: string
  source: string
  sourceUrl: string
  lastChecked: string
}
