import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AGE_BANDS } from '../data/bands'
import { VACCINES } from '../data/vaccines'
import { POLICIES } from '../data/policies'
import { useApp, vaccineStatusOf } from '../store'
import { ageDetail, ageInMonths, addMonths, daysUntil, monthsToBand } from '../lib/age'
import type { AgeBand, HealthIssue } from '../types'

// 各月龄段关联的政策卡片（首现位置）
const BAND_POLICIES: Record<string, string[]> = {
  'b0-1': ['sh-birth-onething', 'sh-newborn-yibao-free'],
  'b1-3': ['sh-newborn-yibao-normal', 'sh-shaoer-huzhu', 'national-childcare-subsidy'],
}

function bandVaccines(band: AgeBand) {
  const items: { code: string; name: string; doseNo: number; month: number; free: boolean }[] = []
  for (const v of VACCINES) {
    for (const d of v.doses) {
      if (d.month >= band.start && d.month <= band.end && d.month <= 36) {
        items.push({ code: v.code, name: v.name, doseNo: d.doseNo, month: d.month, free: v.free })
      }
    }
  }
  return items.sort((a, b) => a.month - b.month)
}

function IssueCard({ issue }: { issue: HealthIssue }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl bg-amber-50/60 border border-amber-100">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left"
      >
        <span className="text-sm font-medium text-stone-700">{issue.name}</span>
        <span className={`text-orange-400 text-xs transition-transform ${open ? 'rotate-90' : ''}`}>▶</span>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2">
          <p className="text-xs text-stone-500 leading-relaxed">{issue.desc}</p>
          <ul className="space-y-1">
            {issue.care.map((c, i) => (
              <li key={i} className="text-xs text-stone-600 leading-relaxed flex gap-1.5">
                <span className="text-emerald-500 shrink-0">✓</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function BandCard({
  band,
  current,
  past,
}: {
  band: AgeBand
  current: boolean
  past: boolean
}) {
  const { child, vaccineRecords, milestoneChecks, setMilestone } = useApp()
  const [expanded, setExpanded] = useState(!past)
  const ref = useRef<HTMLDivElement>(null)

  const vaccines = useMemo(() => bandVaccines(band), [band])
  const policyIds = BAND_POLICIES[band.id] || []
  const policies = POLICIES.filter((p) => policyIds.includes(p.id))

  useEffect(() => {
    if (current && ref.current) {
      setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300)
    }
  }, [current])

  if (!child) return null
  const nowMonth = ageInMonths(child.birthDate)

  return (
    <div ref={ref} className="flex gap-3">
      {/* 时间轴轨道 */}
      <div className="flex flex-col items-center">
        <div
          className={`w-3.5 h-3.5 rounded-full mt-6 shrink-0 border-2 ${
            current
              ? 'bg-orange-500 border-orange-300 ring-4 ring-orange-200'
              : past
                ? 'bg-orange-300 border-orange-200'
                : 'bg-white border-orange-200'
          }`}
        />
        <div className="w-px flex-1 bg-orange-200/70 my-1" />
      </div>

      {/* 阶段卡片 */}
      <div className={`flex-1 pb-8 ${past && !expanded ? 'opacity-70' : ''}`}>
        <div
          onClick={() => past && setExpanded(!expanded)}
          className={`rounded-3xl bg-white shadow-sm border p-4 transition-all ${
            current ? 'border-orange-300 shadow-orange-100 shadow-lg' : 'border-orange-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-stone-800">
              <span className="mr-1.5">{band.emoji}</span>
              {band.label}
            </h3>
            {current && (
              <span className="text-[10px] bg-orange-500 text-white rounded-full px-2 py-0.5">当前阶段</span>
            )}
            {past && <span className="text-xs text-orange-300">{expanded ? '收起 ▲' : '展开 ▼'}</span>}
          </div>
          <p className="text-xs text-stone-400 mt-0.5">{band.theme}</p>

          {expanded && (
            <div className="mt-3 space-y-4">
              {/* 疫苗 */}
              {vaccines.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-stone-400 mb-1.5">💉 本阶段疫苗</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {vaccines.map((v) => {
                      const done = vaccineStatusOf(vaccineRecords, v.code, v.doseNo)
                      const overdue = !done && nowMonth > v.month
                      return (
                        <span
                          key={`${v.code}${v.doseNo}`}
                          className={`text-xs rounded-full px-2.5 py-1 border ${
                            done
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                              : overdue
                                ? 'bg-rose-50 text-rose-500 border-rose-200'
                                : 'bg-orange-50 text-orange-600 border-orange-100'
                          }`}
                        >
                          {done ? '✓ ' : ''}
                          {v.month}月龄 · {v.name}第{v.doseNo}剂{v.free ? '' : ' · 自费'}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* 政策福利 */}
              {policies.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-stone-400 mb-1.5">📋 政策福利与保障</h4>
                  <div className="space-y-1.5">
                    {policies.map((p) => (
                      <Link
                        key={p.id}
                        to="/policy"
                        className="flex items-center gap-2 rounded-xl bg-sky-50 border border-sky-100 px-3 py-2"
                      >
                        <span>{p.emoji}</span>
                        <span className="text-xs text-sky-700 flex-1 font-medium">{p.title}</span>
                        <span className="text-sky-300 text-xs">›</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* 健康问题 */}
              <div>
                <h4 className="text-xs font-medium text-stone-400 mb-1.5">🩺 本阶段高发健康问题</h4>
                <div className="space-y-1.5">
                  {band.health.issues.map((issue) => (
                    <IssueCard key={issue.name} issue={issue} />
                  ))}
                </div>
                {band.health.redFlags.length > 0 && (
                  <div className="mt-2 rounded-xl bg-rose-50 border border-rose-100 px-3 py-2.5">
                    <p className="text-xs font-bold text-rose-600 mb-1">🚨 出现以下情况建议尽快就医</p>
                    <ul className="space-y-0.5">
                      {band.health.redFlags.map((f, i) => (
                        <li key={i} className="text-[11px] text-rose-500 leading-relaxed">
                          · {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* 里程碑 */}
              <div>
                <h4 className="text-xs font-medium text-stone-400 mb-1.5">🌱 发育里程碑（勾选打卡）</h4>
                <div className="space-y-1">
                  {band.milestones.map((m) => {
                    const achieved = milestoneChecks.some(
                      (c) => c.bandId === band.id && c.milestoneId === m.id && c.achieved,
                    )
                    return (
                      <button
                        key={m.id}
                        onClick={() => setMilestone(band.id, m.id, !achieved)}
                        className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left border transition-colors ${
                          achieved
                            ? 'bg-emerald-50 border-emerald-100'
                            : 'bg-stone-50/60 border-stone-100'
                        }`}
                      >
                        <span
                          className={`w-4.5 h-4.5 w-[18px] h-[18px] rounded-md border flex items-center justify-center text-[10px] shrink-0 ${
                            achieved
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-stone-300 text-transparent'
                          }`}
                        >
                          ✓
                        </span>
                        <span
                          className={`text-xs leading-relaxed ${
                            achieved ? 'text-emerald-700 line-through decoration-emerald-300' : 'text-stone-600'
                          }`}
                        >
                          {m.desc}
                          {m.key && !achieved && (
                            <span className="ml-1 text-[10px] text-amber-500">★关键</span>
                          )}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 护理要点 */}
              <div>
                <h4 className="text-xs font-medium text-stone-400 mb-1.5">💡 本阶段护理要点</h4>
                <ul className="space-y-1">
                  {band.health.tips.map((t, i) => (
                    <li key={i} className="text-xs text-stone-500 leading-relaxed flex gap-1.5">
                      <span className="shrink-0">·</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Timeline() {
  const { child } = useApp()
  if (!child) return null

  const nowMonth = ageInMonths(child.birthDate)
  const currentBand = monthsToBand(nowMonth)
  const bandIndex = AGE_BANDS.findIndex((b) => b.id === currentBand)
  const detail = ageDetail(child.birthDate)

  // 最近的疫苗待办
  const nextDose = VACCINES.flatMap((v) =>
    v.doses
      .filter((d) => d.month <= 36)
      .map((d) => ({ ...d, vaccine: v })),
  )
    .filter((d) => !vaccineStatusOf(useApp.getState().vaccineRecords, d.vaccine.code, d.doseNo))
    .sort((a, b) => a.month - b.month)[0]

  // 政策待办（未完成且有相对时限）
  const urgentTodos = POLICIES.filter(
    (p) =>
      p.deadlineMonthsFromBirth !== null &&
      p.city !== '其他' &&
      (p.city === 'ALL' || p.city === child.city),
  )
    .map((p) => ({
      policy: p,
      remain: daysUntil(addMonths(child.birthDate, p.deadlineMonthsFromBirth!)),
    }))
    .filter((t) => t.remain > 0)
    .sort((a, b) => a.remain - b.remain)

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      {/* 顶部信息 */}
      <header className="mb-5">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-xl font-bold text-stone-800">
              {child.nickname} 的时间线
            </h1>
            <p className="text-sm text-orange-600 mt-0.5">🌟 {detail}</p>
          </div>
          <Link to="/me" className="text-3xl">
            {child.gender === 'male' ? '👦' : child.gender === 'female' ? '👧' : '👶'}
          </Link>
        </div>
      </header>

      {/* 待办横幅 */}
      {urgentTodos.length > 0 && (
        <Link
          to="/policy"
          className="block mb-4 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 text-white p-4 shadow-lg shadow-orange-200 active:scale-[0.99] transition-transform"
        >
          <p className="text-xs opacity-90">⏰ 限时待办</p>
          <p className="text-sm font-medium mt-1">
            {urgentTodos[0].policy.title}：剩余 {urgentTodos[0].remain} 天
            {urgentTodos.length > 1 && `（还有 ${urgentTodos.length - 1} 项待办）`}
          </p>
        </Link>
      )}
      {nextDose && (
        <Link
          to="/vaccines"
          className="block mb-4 rounded-2xl bg-white border border-orange-100 p-4 shadow-sm active:scale-[0.99] transition-transform"
        >
          <p className="text-xs text-stone-400">💉 下一剂疫苗</p>
          <p className="text-sm font-medium text-stone-700 mt-1">
            {nextDose.vaccine.name} 第 {nextDose.doseNo} 剂 · 建议 {nextDose.month} 月龄接种
            {nowMonth >= nextDose.month && (
              <span className="text-rose-500 ml-1">（已到龄，尽快安排）</span>
            )}
          </p>
        </Link>
      )}

      {/* 时间轴 */}
      <div className="pt-2">
        {AGE_BANDS.map((band) => (
          <BandCard
            key={band.id}
            band={band}
            current={band.id === currentBand}
            past={AGE_BANDS.findIndex((b) => b.id === band.id) < bandIndex}
          />
        ))}
      </div>

      <p className="text-[11px] text-stone-400 text-center pb-6 px-6 leading-relaxed">
        健康与政策内容仅供科普参考，均标注了来源；不能替代专业医疗建议与官方办理指引。
      </p>
    </div>
  )
}
