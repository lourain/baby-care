// ===== 内容数据运行时加载 =====
//
// 三级降级，任何一级失败都不会抛错，保证首页永远有内容可渲染：
//   1. 网络拉取 public/content/policies.json（cache: no-cache 会带 ETag 校验，
//      内容没变时服务端返回 304，开销很小）
//   2. IndexedDB 缓存（离线 / 网络失败 / 服务端异常）
//   3. 编译期内置兜底（src/content/policies.json 打进 bundle 的那一份）
//
// 这样「更新政策」= 改 JSON 文件 + push，不需要改任何组件代码。
// 将来若把 CONTENT_URL 换成后端接口或 CDN，本文件是唯一需要动的地方。

import type { PolicyDef } from '../types'
import { idbGet, idbPut } from './idb'
import { POLICIES as BUNDLED_POLICIES, POLICY_CONTENT_META } from '../data/policies'

export interface ContentBundle {
  version: string
  updatedAt: string
  policies: PolicyDef[]
}

const CACHE_KEY = 'content-bundle-v1'

/** 内容地址随 base 走，部署后位于 /baby-care/content/policies.json */
const CONTENT_URL = `${import.meta.env.BASE_URL}content/policies.json`

/** 编译期内置兜底 */
export const BUNDLED_CONTENT: ContentBundle = {
  version: POLICY_CONTENT_META.version,
  updatedAt: POLICY_CONTENT_META.updatedAt,
  policies: BUNDLED_POLICIES,
}

function isUsable(v: unknown): v is ContentBundle {
  const b = v as ContentBundle | null
  return (
    !!b &&
    typeof b.version === 'string' &&
    Array.isArray(b.policies) &&
    b.policies.length > 0 &&
    typeof b.policies[0]?.id === 'string'
  )
}

export async function loadContent(): Promise<ContentBundle> {
  // 1. 网络
  try {
    const res = await fetch(CONTENT_URL, { cache: 'no-cache' })
    if (res.ok) {
      const data: unknown = await res.json()
      if (isUsable(data)) {
        void idbPut(CACHE_KEY, data).catch(() => {})
        return data
      }
    }
  } catch {
    // 忽略，继续降级
  }

  // 2. 本地缓存
  try {
    const cached = await idbGet<ContentBundle>(CACHE_KEY)
    if (isUsable(cached)) return cached
  } catch {
    // 忽略，继续降级
  }

  // 3. 内置兜底
  return BUNDLED_CONTENT
}
