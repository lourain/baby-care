// 把 src/content/*.json 同步到 public/content/，供应用运行时 fetch。
//
// 单一真源在 src/content/：
//   - 它会被 TypeScript 直接 import，作为编译期内置兜底
//   - 同时同步一份到 public/，让应用能通过 HTTP 拉到最新内容
// public/content/ 是构建产物，已加入 .gitignore。
//
// 由 package.json 的 predev / prebuild 自动触发。

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = path.join(root, 'src/content')
const outDir = path.join(root, 'public/content')

if (!fs.existsSync(srcDir)) {
  console.log('[sync-content] 未找到 src/content，跳过')
  process.exit(0)
}

fs.mkdirSync(outDir, { recursive: true })

const files = fs.readdirSync(srcDir).filter((f) => f.endsWith('.json'))
for (const f of files) {
  fs.copyFileSync(path.join(srcDir, f), path.join(outDir, f))
}

console.log(`[sync-content] 已同步 ${files.length} 个文件到 public/content/：${files.join(', ')}`)
