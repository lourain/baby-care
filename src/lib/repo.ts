// ===== 数据仓库抽象层 =====
// MVP 实现 LocalRepository（IndexedDB 本地存储）；
// 云同步只留接口占位，后续可替换为 Supabase / 自建后端实现。

import type {
  Child,
  GrowthRecord,
  MilestoneCheck,
  TodoState,
  VaccineRecord,
} from '../types'
import { idbGet, idbPut } from './idb'

export interface PersistedState {
  child: Child | null
  vaccineRecords: VaccineRecord[]
  growthRecords: GrowthRecord[]
  milestoneChecks: MilestoneCheck[]
  todos: TodoState[]
  updatedAt: number
}

export interface DataRepository {
  load(): Promise<PersistedState | null>
  save(state: PersistedState): Promise<void>
}

const KEY = 'app-state-v1'

export class LocalRepository implements DataRepository {
  async load(): Promise<PersistedState | null> {
    try {
      return (await idbGet<PersistedState>(KEY)) ?? null
    } catch {
      return null
    }
  }
  async save(state: PersistedState): Promise<void> {
    await idbPut(KEY, state)
  }
}

// 云端仓库占位：接口对齐，未来实现时替换调用点即可
export class CloudRepository implements DataRepository {
  async load(): Promise<PersistedState | null> {
    throw new Error('CloudRepository 尚未接入：预留接口，后续可对接 Supabase 等')
  }
  async save(_state: PersistedState): Promise<void> {
    throw new Error('CloudRepository 尚未接入')
  }
}

export const repository: DataRepository = new LocalRepository()
