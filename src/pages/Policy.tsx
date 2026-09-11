import { useMemo, useState, type ReactNode } from 'react'
import { useApp } from '../store'
import { addMonths, daysUntil } from '../lib/age'
import type { PolicyDef } from '../types'

const CAT_LABEL: Record<string, string> = {
  insurance: '保险 · 医保',
  subsidy: '补贴 · 福利',
  checklist: '办事清单',
}

function PolicyModal({ policy, onClose }: { policy: PolicyDef; onClose: () => void }) {
  const { child, todos, setTodo } = useApp()
  const todoDone = child
    ? todos.some((t) => t.todoId === policy.id && t.status === 'done')
    : false

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl p-5 pb-8"
      >
        <div className="flex items-start justify-between gap-3 sticky top-0 bg-white pb-2">
          <div>
            <p className="text-[11px] text-orange-500 font-medium">{CAT_LABEL[policy.category]}</p>
            <h2 className="text-lg font-bold text-stone-800 mt-0.5">
              {policy.emoji} {policy.title}
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">{policy.subtitle}</p>
          </div>
          <button onClick={onClose} className="text-stone-300 text-2xl leading-none px-1">
            ×
          </button>
        </div>

        {/* 时限提醒 */}
        {child && policy.deadlineMonthsFromBirth !== null && (
          <div className="mt-3 rounded-2xl bg-rose-50 border border-rose-100 p-3.5">
            <p className="text-xs text-rose-600 font-bold">⏰ 关键时限</p>
            <p className="text-xs text-rose-500 mt-1 leading-relaxed">{policy.deadline}</p>
          </div>
        )}
        {child && policy.deadlineMonthsFromBirth === null && (
          <div className="mt-3 rounded-2xl bg-amber-50 border border-amber-100 p-3.5">
            <p className="text-xs text-amber-700 leading-relaxed">📌 {policy.deadline}</p>
          </div>
        )}

        <Section title="✅ 适用条件">{policy.condition}</Section>

        <Section title="📝 办理流程">
          <ol className="space-y-1.5">
            {policy.steps.map((s, i) => (
              <li key={i} className="text-xs text-stone-600 leading-relaxed flex gap-2">
                <span className="shrink-0 w-4 h-4 rounded-full bg-orange-100 text-orange-600 text-[10px] flex items-center justify-center font-bold mt-0.5">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </Section>

        <Section title="🧾 所需材料">
          <ul className="flex flex-wrap gap-1.5">
            {policy.materials.map((m, i) => (
              <li key={i} className="text-xs bg-stone-100 text-stone-600 rounded-full px-2.5 py-1">
                {m}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="📍 办理渠道">
          <ul className="space-y-1">
            {policy.channels.map((c, i) => (
              <li key={i} className="text-xs text-stone-600 leading-relaxed">
                · {c}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="📖 详情">{policy.content}</Section>

        {child && (
          <button
            onClick={() => setTodo(policy.id, todoDone ? 'open' : 'done')}
            className={`mt-4 w-full rounded-2xl py-3 text-sm font-medium transition-all active:scale-[0.98] ${
              todoDone
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'bg-orange-500 text-white shadow-lg shadow-orange-200'
            }`}
          >
            {todoDone ? '✓ 已完成，点击撤销' : '标记为「已办完」'}
          </button>
        )}

        <p className="text-[10px] text-stone-400 mt-4 leading-relaxed">
          来源：{policy.source}（{policy.lastChecked} 核对）
          <br />
          <a href={policy.sourceUrl} target="_blank" rel="noreferrer" className="text-sky-500 underline">
            查看原文链接
          </a>
          。政策可能调整，以官方渠道为准。
        </p>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-4">
      <h3 className="text-xs font-bold text-stone-500 mb-1.5">{title}</h3>
      <div className="text-xs text-stone-600 leading-relaxed">{children}</div>
    </div>
  )
}

export default function Policy() {
  const { child, todos, policies } = useApp()
  const [active, setActive] = useState<PolicyDef | null>(null)
  const [cat, setCat] = useState<string>('all')

  // 注意：hooks 必须在任何提前 return 之前调用，否则 child 从 null 变为有值时
  // 会触发 "Rendered fewer hooks than expected"
  const available = useMemo(
    () => (child ? policies.filter((p) => p.city === 'ALL' || p.city === child.city) : []),
    [policies, child],
  )

  const todoItems = useMemo(
    () =>
      child
        ? available
            .filter((p) => p.deadlineMonthsFromBirth !== null)
            .map((p) => {
              const done = todos.some((t) => t.todoId === p.id && t.status === 'done')
              const deadline = addMonths(child.birthDate, p.deadlineMonthsFromBirth!)
              return { policy: p, done, deadline, remain: daysUntil(deadline) }
            })
            .sort((a, b) => Number(a.done) - Number(b.done) || a.remain - b.remain)
        : [],
    [available, todos, child],
  )

  if (!child) return null

  const filtered = cat === 'all' ? available : available.filter((p) => p.category === cat)

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <h1 className="text-xl font-bold text-stone-800">💰 政策福利与保障</h1>

      {/* 待办提醒 */}
      {todoItems.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs font-medium text-stone-400 mb-2">⏰ 我的待办（带倒计时）</h3>
          <div className="space-y-2">
            {todoItems.map(({ policy, done, remain }) => (
              <button
                key={policy.id}
                onClick={() => setActive(policy)}
                className={`w-full flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all active:scale-[0.99] ${
                  done
                    ? 'bg-emerald-50/60 border-emerald-100 opacity-75'
                    : remain < 60
                      ? 'bg-rose-50 border-rose-200'
                      : 'bg-white border-orange-100'
                }`}
              >
                <span className="text-2xl">{done ? '✅' : policy.emoji}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-stone-700 truncate">{policy.title}</span>
                  <span className="block text-[11px] text-stone-400 mt-0.5">
                    {done ? '已完成' : remain >= 0 ? `剩余 ${remain} 天 · ${policy.subtitle}` : `已超期 · ${policy.subtitle}`}
                  </span>
                </span>
                {!done && remain >= 0 && remain < 60 && (
                  <span className="text-[10px] bg-rose-500 text-white rounded-full px-2 py-1 shrink-0">
                    紧急
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 分类筛选 */}
      <div className="mt-5 flex gap-2">
        {(
          [
            ['all', '全部'],
            ['insurance', '医保保险'],
            ['subsidy', '补贴福利'],
            ['checklist', '办事清单'],
          ] as const
        ).map(([c, label]) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`text-xs rounded-full px-3.5 py-1.5 border transition-colors ${
              cat === c
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-white text-stone-500 border-orange-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 政策列表 */}
      <div className="mt-4 space-y-3 pb-8">
        {filtered.map((p) => (
          <button
            key={p.id}
            onClick={() => setActive(p)}
            className="w-full text-left rounded-3xl bg-white border border-orange-100 p-4 shadow-sm active:scale-[0.99] transition-all"
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl">{p.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-stone-800">{p.title}</p>
                <p className="text-xs text-stone-400 mt-0.5">{p.subtitle}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="text-[10px] bg-orange-50 text-orange-500 rounded-full px-2 py-0.5">
                    {CAT_LABEL[p.category]}
                  </span>
                  {p.city !== 'ALL' && (
                    <span className="text-[10px] bg-sky-50 text-sky-600 rounded-full px-2 py-0.5">
                      {p.city}
                    </span>
                  )}
                  {p.tags.slice(0, 2).map((t) => (
                    <span
                      key={t}
                      className="text-[10px] bg-stone-100 text-stone-500 rounded-full px-2 py-0.5"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <span className="text-orange-300">›</span>
            </div>
          </button>
        ))}
      </div>

      <p className="text-[11px] text-stone-400 text-center pb-6 px-4 leading-relaxed">
        以上内容整理自官方公开信息并标注来源，供参考；办理前请以官方渠道最新指引为准。
      </p>

      {active && <PolicyModal policy={active} onClose={() => setActive(null)} />}
    </div>
  )
}
