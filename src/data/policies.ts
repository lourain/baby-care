// ===== 政策数据访问层 =====
//
// 内容真源：src/content/policies.json
//   更新政策只需改这个 JSON（纯数据，无代码风险），不必改 .ts。
//   `npm run build` / `npm run dev` 会通过 scripts/sync-content.mjs
//   把它同步到 public/content/policies.json，供运行时拉取。
//
// 本文件只做类型收窄 + 元信息透出，保持既有 `POLICIES` 导出不变，
// 让所有调用点无需关心数据是从 JSON 来的。

import raw from '../content/policies.json'
import type { PolicyDef } from '../types'

interface PolicyBundle {
  version: string
  updatedAt: string
  policies: PolicyDef[]
}

const bundle = raw as unknown as PolicyBundle

/** 编译期内置的政策数据（运行时拉取失败时的兜底） */
export const POLICIES: PolicyDef[] = bundle.policies

/** 内容版本元信息，用于 UI 展示与「内容是否有更新」的判断 */
export const POLICY_CONTENT_META = {
  version: bundle.version,
  updatedAt: bundle.updatedAt,
} as const
