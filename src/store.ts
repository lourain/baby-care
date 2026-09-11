// ===== 全局状态（Zustand + IndexedDB 持久化） =====

import { create } from 'zustand'
import type {
  Child,
  GrowthRecord,
  GrowthType,
  MilestoneCheck,
  PolicyDef,
  TodoState,
  VaccineRecord,
} from './types'
import { repository } from './lib/repo'
import { loadContent } from './lib/content'
import { POLICIES } from './data/policies'

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

interface AppState {
  child: Child | null
  vaccineRecords: VaccineRecord[]
  growthRecords: GrowthRecord[]
  milestoneChecks: MilestoneCheck[]
  todos: TodoState[]
  /** 政策内容：启动时从 public/content/policies.json 拉取，失败时降级到内置数据 */
  policies: PolicyDef[]
  /** 当前生效的内容版本号，便于排查「用户看到的是哪一版内容」 */
  contentVersion: string
  hydrated: boolean

  hydrate: () => Promise<void>
  setChild: (c: Partial<Child>) => void
  toggleVaccineDose: (vaccineCode: string, doseNo: number, done: boolean) => void
  markVaccine: (vaccineCode: string, doseNo: number, done: boolean, actualDate?: string) => void
  addGrowth: (type: GrowthType, value: number, recordDate: string, note?: string) => void
  deleteGrowth: (id: string) => void
  setMilestone: (bandId: string, milestoneId: string, achieved: boolean) => void
  setTodo: (todoId: string, status: 'open' | 'done') => void
  resetAll: () => void
}

function persist(s: AppState) {
  void repository.save({
    child: s.child,
    vaccineRecords: s.vaccineRecords,
    growthRecords: s.growthRecords,
    milestoneChecks: s.milestoneChecks,
    todos: s.todos,
    updatedAt: Date.now(),
  })
}

export const useApp = create<AppState>((set, get) => ({
  child: null,
  vaccineRecords: [],
  growthRecords: [],
  milestoneChecks: [],
  todos: [],
  policies: POLICIES,
  contentVersion: 'bundled',
  hydrated: false,

  hydrate: async () => {
    // 内容与用户数据并行加载；loadContent 自带降级，不会抛错
    const [saved, content] = await Promise.all([repository.load(), loadContent()])
    set({
      child: saved?.child ?? null,
      vaccineRecords: saved?.vaccineRecords ?? [],
      growthRecords: saved?.growthRecords ?? [],
      milestoneChecks: saved?.milestoneChecks ?? [],
      todos: saved?.todos ?? [],
      policies: content.policies,
      contentVersion: content.version,
      hydrated: true,
    })
  },

  setChild: (c) => {
    const cur = get().child
    const child: Child = cur
      ? { ...cur, ...c }
      : {
          id: uid(),
          nickname: c.nickname || '宝宝',
          gender: c.gender || 'unknown',
          birthDate: c.birthDate || '',
          city: c.city || '上海',
          createdAt: Date.now(),
        }
    set({ child })
    persist(get())
  },

  markVaccine: (vaccineCode, doseNo, done, actualDate) => {
    const { child, vaccineRecords } = get()
    if (!child) return
    const id = `${child.id}:${vaccineCode}:${doseNo}`
    const exist = vaccineRecords.find((r) => r.id === id)
    let next: VaccineRecord[]
    if (exist) {
      next = done
        ? vaccineRecords.map((r) =>
            r.id === id ? { ...r, status: 'done' as const, actualDate: actualDate || r.actualDate } : r,
          )
        : vaccineRecords.filter((r) => r.id !== id)
    } else if (done) {
      next = [
        ...vaccineRecords,
        {
          id,
          childId: child.id,
          vaccineCode,
          doseNo,
          status: 'done',
          actualDate: actualDate || new Date().toISOString().slice(0, 10),
        },
      ]
    } else {
      next = vaccineRecords
    }
    set({ vaccineRecords: next })
    persist(get())
  },

  toggleVaccineDose: (code, doseNo, done) => get().markVaccine(code, doseNo, done),

  addGrowth: (type, value, recordDate, note) => {
    const { child, growthRecords } = get()
    if (!child) return
    const rec: GrowthRecord = {
      id: uid(),
      childId: child.id,
      type,
      value,
      recordDate,
      note,
      createdAt: Date.now(),
    }
    set({ growthRecords: [...growthRecords, rec] })
    persist(get())
  },

  deleteGrowth: (id) => {
    set({ growthRecords: get().growthRecords.filter((r) => r.id !== id) })
    persist(get())
  },

  setMilestone: (bandId, milestoneId, achieved) => {
    const { child, milestoneChecks } = get()
    if (!child) return
    const id = `${child.id}:${bandId}:${milestoneId}`
    const next = milestoneChecks.filter((m) => m.id !== id)
    if (achieved) next.push({ id, childId: child.id, bandId, milestoneId, achieved: true })
    set({ milestoneChecks: next })
    persist(get())
  },

  setTodo: (todoId, status) => {
    const { child, todos } = get()
    if (!child) return
    const id = `${child.id}:${todoId}`
    const next = todos.filter((t) => t.id !== id)
    if (status === 'done')
      next.push({ id, childId: child.id, todoId, status: 'done', doneAt: Date.now() })
    set({ todos: next })
    persist(get())
  },

  resetAll: () => {
    set({ child: null, vaccineRecords: [], growthRecords: [], milestoneChecks: [], todos: [] })
    persist(get())
  },
}))

// ===== 派生选择器 =====

export function vaccineStatusOf(
  records: VaccineRecord[],
  vaccineCode: string,
  doseNo: number,
): boolean {
  return records.some((r) => r.vaccineCode === vaccineCode && r.doseNo === doseNo && r.status === 'done')
}
