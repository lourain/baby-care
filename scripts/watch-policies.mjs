// ===== 政策来源变更监测 =====
//
// 目标：把「发现哪里变了」自动化，把「判断和改写数据」留给人。
// 本脚本 **不会** 自动修改 src/content/policies.json，它只做三件事：
//   1. 抓取每条政策的 sourceUrl，提取正文并算 hash
//   2. 与上次快照（scripts/policy-snapshots.json）比对
//   3. 有变化时开一个 GitHub Issue（可选附带 LLM 的改写建议）
//
// 首次运行没有基线，只记录快照、不报警。
// 本地运行：node scripts/watch-policies.mjs --dry-run

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CONTENT_FILE = path.join(root, 'src/content/policies.json')
const SNAPSHOT_FILE = path.join(root, 'scripts/policy-snapshots.json')

const DRY_RUN = process.argv.includes('--dry-run')
const RESET = process.argv.includes('--reset')
const ISSUE_LABEL = '政策监测'
const SNAPSHOT_TEXT_LIMIT = 8000
const MAX_SNIPPETS = 8
const FETCH_TIMEOUT_MS = 25000

// ---------- 抓取与提取 ----------

function decodeBody(buf, contentType) {
  let charset = /charset=["']?([\w-]+)/i.exec(contentType || '')?.[1]
  if (!charset) {
    const head = Buffer.from(buf).subarray(0, 4096).toString('latin1')
    charset = /charset=["']?([\w-]+)/i.exec(head)?.[1]
  }
  let cs = (charset || 'utf-8').toLowerCase()
  if (cs === 'gb2312' || cs === 'gbk' || cs === 'gb18030') cs = 'gbk'
  try {
    return new TextDecoder(cs).decode(buf)
  } catch {
    return new TextDecoder('utf-8').decode(buf)
  }
}

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(br|\/p|\/div|\/li|\/tr|\/h[1-6]|\/td)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/gi, '&')
}

/** 切成便于做段落级 diff 的片段：短行保留，长行按中文句读切开 */
function toSegments(text) {
  const out = []
  for (const raw of text.split('\n')) {
    const line = raw.replace(/[ \t\u00a0]+/g, ' ').trim()
    if (!line) continue
    if (line.length <= 120) {
      out.push(line)
      continue
    }
    const parts = line.split(/(?<=[。！？；])/).map((s) => s.trim()).filter(Boolean)
    if (parts.length > 1) out.push(...parts)
    else out.push(line)
  }
  return out
}

async function fetchSnapshot(url) {
  const res = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      // 注意：HTTP header 只允许 ASCII（ByteString），不能出现中文
      'User-Agent': 'baby-care-policy-watch/1.0 (+https://github.com/lourain/baby-care)',
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'zh-CN,zh;q=0.9',
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buf = await res.arrayBuffer()
  const html = decodeBody(buf, res.headers.get('content-type'))
  const segments = toSegments(htmlToText(html))
  const text = segments.join('\n')
  const hash = crypto.createHash('sha256').update(text).digest('hex').slice(0, 16)
  return { hash, text, segments }
}

// ---------- diff ----------

function diffSegments(oldSegments, newSegments) {
  const before = new Map()
  for (const s of oldSegments) before.set(s, (before.get(s) || 0) + 1)
  const after = new Map()
  for (const s of newSegments) after.set(s, (after.get(s) || 0) + 1)

  const removed = []
  for (const [s, n] of before) {
    const m = after.get(s) || 0
    for (let i = 0; i < n - m; i++) removed.push(s)
  }
  const added = []
  for (const [s, n] of after) {
    const m = before.get(s) || 0
    for (let i = 0; i < n - m; i++) added.push(s)
  }
  return { removed, added }
}

function snippet(lines) {
  const shown = lines.slice(0, MAX_SNIPPETS)
  const rest = lines.length - shown.length
  const body = shown.map((l) => `> ${l}`).join('\n\n')
  return rest > 0 ? `${body}\n\n_（另有 ${rest} 段未展示）_` : body
}

// ---------- LLM 建议（可选） ----------

async function askLLM({ url, relatedPolicies, removed, added }) {
  const apiKey = process.env.POLICY_LLM_API_KEY
  if (!apiKey) return null

  const baseUrl = (process.env.POLICY_LLM_BASE_URL || 'https://api.deepseek.com/v1').replace(/\/+$/, '')
  const model = process.env.POLICY_LLM_MODEL || 'deepseek-chat'

  const system = [
    '你是育儿 App 的政策数据维护助手。用户会给你「官方页面正文的变更」以及「当前 App 里对应的政策数据」。',
    '你的任务是判断这次官方页面变更是否影响到 App 里的政策数据，并给出改写建议。',
    '要求：',
    '1. 只依据给出的材料，不要臆造政策细节；没有实质影响就明确说「无需修改」。',
    '2. 输出 Markdown，包含两个小节：「### 变更影响判断」与「### 建议更新后的 JSON」。',
    '3. JSON 小节给出一条 ```json 代码块，内容是需要更新的完整政策对象数组（字段与输入保持完全一致，含 id）。',
    '4. 如果无法确定，就在判断小节里说明需要人工核对哪一部分。',
  ].join('\n')

  const user = [
    `官方来源：${url}`,
    '',
    '## App 中引用该来源的政策数据',
    '```json',
    JSON.stringify(relatedPolicies, null, 2),
    '```',
    '',
    '## 官方页面本次「删除/改写前」的内容片段',
    removed.length ? removed.slice(0, 40).map((s) => `- ${s}`).join('\n') : '（无）',
    '',
    '## 官方页面本次「新增/改写后」的内容片段',
    added.length ? added.slice(0, 40).map((s) => `- ${s}`).join('\n') : '（无）',
  ].join('\n')

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
    signal: AbortSignal.timeout(180000),
  })
  if (!res.ok) throw new Error(`LLM HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`)
  const data = await res.json()
  return data?.choices?.[0]?.message?.content?.trim() || null
}

// ---------- GitHub Issue ----------

async function gh(method, endpoint, body) {
  const token = process.env.GITHUB_TOKEN
  const repo = process.env.GITHUB_REPOSITORY
  const res = await fetch(`https://api.github.com/repos/${repo}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'User-Agent': 'baby-care-policy-watch',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`GitHub API ${method} ${endpoint} → ${res.status} ${(await res.text()).slice(0, 300)}`)
  return res.status === 204 ? null : res.json()
}

async function ensureLabel() {
  try {
    await gh('POST', '/labels', {
      name: ISSUE_LABEL,
      color: 'fbca04',
      description: '政策官方来源内容发生变更，需要人工核对',
    })
  } catch {
    // 已存在或无权创建，忽略
  }
}

async function publishIssue(title, body) {
  const repo = process.env.GITHUB_REPOSITORY
  const token = process.env.GITHUB_TOKEN
  if (!repo || !token) {
    console.log('\n[未配置 GITHUB_TOKEN / GITHUB_REPOSITORY，跳过开 Issue，以下为正文]\n')
    console.log(body)
    return
  }
  await ensureLabel()
  const existing = await gh('GET', `/issues?state=open&labels=${encodeURIComponent(ISSUE_LABEL)}&per_page=1`)
  if (Array.isArray(existing) && existing.length > 0) {
    await gh('POST', `/issues/${existing[0].number}/comments`, { body })
    console.log(`已追加评论到 Issue #${existing[0].number}`)
  } else {
    const created = await gh('POST', '/issues', { title, body, labels: [ISSUE_LABEL] })
    console.log(`已创建 Issue #${created.number}`)
  }
}

// ---------- 主流程 ----------

async function main() {
  const bundle = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'))
  const policies = bundle.policies

  // 同一来源可能被多条政策引用，先去重
  const byUrl = new Map()
  for (const p of policies) {
    if (!p.sourceUrl) continue
    if (!byUrl.has(p.sourceUrl)) byUrl.set(p.sourceUrl, [])
    byUrl.get(p.sourceUrl).push(p)
  }

  const snapshots = RESET || !fs.existsSync(SNAPSHOT_FILE)
    ? {}
    : JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf8')).snapshots || {}

  const nextSnapshots = { ...snapshots }
  const changes = []
  const failures = []
  let firstRunCount = 0

  for (const [url, related] of byUrl) {
    const prev = snapshots[url]
    try {
      const { hash, text, segments } = await fetchSnapshot(url)
      console.log(`✓ ${url} → ${hash}`)

      if (!prev || !prev.hash) {
        firstRunCount++
      } else if (prev.hash !== hash) {
        const prevSegments = (prev.text || '').split('\n').filter(Boolean)
        const { removed, added } = diffSegments(prevSegments, segments)
        changes.push({ url, related, removed, added })
        console.log(`  ⚠ 检测到变更：-${removed.length} / +${added.length} 段`)
      }

      nextSnapshots[url] = {
        hash,
        fetchedAt: new Date().toISOString(),
        policies: related.map((p) => p.id),
        text: text.slice(0, SNAPSHOT_TEXT_LIMIT),
      }
    } catch (err) {
      failures.push({ url, message: String(err?.message || err) })
      console.log(`✗ ${url} → ${err?.message || err}`)
      if (prev) nextSnapshots[url] = prev
    }
  }

  if (!DRY_RUN) {
    fs.writeFileSync(
      SNAPSHOT_FILE,
      JSON.stringify(
        { note: '政策来源正文快照，由 scripts/watch-policies.mjs 自动维护，请勿手工编辑', snapshots: nextSnapshots },
        null,
        2,
      ) + '\n',
      'utf8',
    )
    console.log(`\n快照已写入 ${path.relative(root, SNAPSHOT_FILE)}`)
  }

  if (firstRunCount > 0) console.log(`\n首次建立基线 ${firstRunCount} 个来源（本次不报警）`)
  if (failures.length > 0) console.log(`抓取失败 ${failures.length} 个来源：${failures.map((f) => f.url).join(', ')}`)

  if (changes.length === 0) {
    console.log('\n没有检测到内容变更。')
    return
  }

  // 组装 Issue 正文
  const today = new Date().toISOString().slice(0, 10)
  const lines = [
    `自动化监测发现 **${changes.length}** 个官方来源的正文内容与上次快照不一致。`,
    '',
    '> 本 Issue 由 `scripts/watch-policies.mjs` 自动创建，**不会自动改动数据**。',
    '> 请人工确认后修改 `src/content/policies.json`，然后关闭本 Issue。',
    '',
  ]

  for (const change of changes) {
    lines.push(
      `---`,
      '',
      `## ${change.related.map((p) => p.title).join(' / ')}`,
      '',
      `- 来源：${change.url}`,
      `- 关联政策 id：${change.related.map((p) => p.id).join(', ')}`,
      `- 变更规模：删除/改写 ${change.removed.length} 段，新增/改写 ${change.added.length} 段`,
      '',
    )
    if (change.removed.length > 0) {
      lines.push(`<details><summary>删除或改写前的内容（${change.removed.length} 段）</summary>`, '', snippet(change.removed), '', '</details>', '')
    }
    if (change.added.length > 0) {
      lines.push(`<details><summary>新增或改写后的内容（${change.added.length} 段）</summary>`, '', snippet(change.added), '', '</details>', '')
    }

    if (process.env.POLICY_LLM_API_KEY) {
      try {
        console.log(`… 正在为 ${change.url} 请求 LLM 改写建议`)
        const suggestion = await askLLM(change)
        if (suggestion) {
          lines.push(`<details open><summary>🤖 AI 改写建议（需人工审核）</summary>`, '', suggestion, '', '</details>', '')
        }
      } catch (err) {
        lines.push(`> ⚠️ AI 建议生成失败：${err?.message || err}`, '')
      }
    }
  }

  if (failures.length > 0) {
    lines.push(`---`, '', `## ⚠️ 未能抓取的来源`, '')
    for (const f of failures) lines.push(`- ${f.url} — ${f.message}`)
    lines.push('')
  }

  lines.push(
    '---',
    '',
    '## 处理清单',
    '',
    '- [ ] 打开上面的来源链接，确认官方是否真的改了',
    '- [ ] 如确有变更：修改 `src/content/policies.json`，并更新该条的 `lastChecked`',
    '- [ ] 若有实质变更：把 `version` 递增（例如 `2026.09.1` → `2026.09.2`）',
    '- [ ] 提交 PR / 直接 commit 到 main，CI 会自动重新构建部署',
    '- [ ] 关闭本 Issue',
    '',
  )

  await publishIssue(`[政策监测] ${changes.length} 个来源内容有变化（${today}）`, lines.join('\n'))
}

main().catch((err) => {
  console.error('监测脚本执行失败：', err)
  process.exit(1)
})
